// ============================================
// 📰 NEWS RESEARCH MODULE v2
// Recherche d'actualités santé via sources institutionnelles
// + fallback Claude pour suggestions de sujets d'actualité
// Sources: ANSM, HAS, EMA + Claude fallback
// ============================================

import { ResearchFinding } from './types';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
}

// Sources institutionnelles fiables (ne bloquent pas les serverless)
const INSTITUTIONAL_FEEDS = [
  {
    url: 'https://ansm.sante.fr/actualites/feed',
    name: 'ANSM Actualites',
    credibility: 'institutional' as const,
  },
  {
    url: 'https://www.has-sante.fr/jcms/fc_2875171/fr/rss-du-site-has',
    name: 'HAS Actualites',
    credibility: 'institutional' as const,
  },
];

function parseRSS(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  for (const itemXml of itemMatches) {
    const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]
      ?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() || '';
    const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
    const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || '';
    const source = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]
      ?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() || '';
    const description = itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1]
      ?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').replace(/<[^>]+>/g, '').trim() || '';

    if (title && title.length > 10) {
      items.push({ title, link, pubDate, source, description });
    }
  }
  return items;
}

function categorizeNews(title: string, description: string): { category: string; relevance: number } {
  const text = `${title} ${description}`.toLowerCase();

  if (/rupture|pénurie|indisponible|stock|approvisionnement/.test(text)) {
    return { category: 'rupture-stock', relevance: 90 };
  }
  if (/alerte|rappel|retrait|vigilance|effet.?ind[ée]sirable|pharmacovigilance/.test(text)) {
    return { category: 'alerte-sanitaire', relevance: 88 };
  }
  if (/étude|essai.?clinique|recherche|résultats|publi[ée]/.test(text)) {
    return { category: 'etude-scientifique', relevance: 85 };
  }
  if (/nouveau|approuv[ée]|autorisation|amm|innov|thérapie|traitement|découverte|avancée/.test(text)) {
    return { category: 'avancee-medicale', relevance: 82 };
  }
  if (/réglementation|loi|décret|remboursement|commission|avis/.test(text)) {
    return { category: 'reglementation', relevance: 75 };
  }
  if (/vaccin|prévention|dépistage|campagne/.test(text)) {
    return { category: 'prevention', relevance: 70 };
  }
  return { category: 'actualite-sante', relevance: 60 };
}

/**
 * 📰 Recherche depuis les flux RSS institutionnels
 */
async function fetchInstitutionalNews(): Promise<ResearchFinding[]> {
  console.log('📰 Recherche actualites institutionnelles (ANSM, HAS)...');
  const allItems: NewsItem[] = [];

  for (const feed of INSTITUTIONAL_FEEDS) {
    try {
      const response = await fetch(feed.url, {
        headers: { 'User-Agent': 'MediTrouve/2.0' },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        console.log(`  ⚠️ ${feed.name}: HTTP ${response.status}`);
        continue;
      }
      const xml = await response.text();
      const items = parseRSS(xml);
      console.log(`  📰 ${feed.name}: ${items.length} articles`);
      allItems.push(...items.map(i => ({ ...i, source: i.source || feed.name })));
    } catch (err) {
      console.log(`  ⚠️ ${feed.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Filtrer les 30 derniers jours
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = allItems.filter(item => {
    if (!item.pubDate) return true;
    const d = new Date(item.pubDate).getTime();
    return !isNaN(d) && d > thirtyDaysAgo;
  });

  const today = new Date().toISOString().split('T')[0];

  return recent.slice(0, 8).map((item, i) => {
    const { category, relevance } = categorizeNews(item.title, item.description);
    return {
      id: `news-${i}-${Date.now()}`,
      topic: item.title,
      summary: item.description || item.title,
      category: category as any,
      sources: [{
        url: item.link,
        title: item.title,
        publisher: item.source || 'ANSM/HAS',
        date: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : today,
        credibility: 'institutional' as const,
      }],
      keyFacts: [item.title, item.description || ''].filter(Boolean),
      dateDiscovered: today,
      relevanceScore: relevance,
    };
  });
}

/**
 * 🤖 Fallback : Claude suggère des sujets d'actualité médicale
 */
async function generateTopicsWithClaude(): Promise<ResearchFinding[]> {
  console.log('🤖 Fallback Claude : generation de sujets d\'actualite medicale...');

  const apiKey = OPENROUTER_API_KEY || ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('  ⚠️ Pas de cle API pour le fallback Claude');
    return [];
  }

  const useOpenRouter = !!OPENROUTER_API_KEY;
  const today = new Date().toISOString().split('T')[0];
  const year = new Date().getFullYear();

  const prompt = `Tu es un editeur de blog medical français. Suggere 4 sujets d'articles d'actualite medicale PERTINENTS et RECENTS pour un blog sante grand public + pro.

REGLES :
- Sujets bases sur des evenements REELS et VERIFIABLES (etudes publiees, decisions reglementaires, avancees therapeutiques)
- Diversite : 1 etude scientifique recente, 1 avancee medicale, 1 alerte/pharmacovigilance, 1 actualite sante publique
- Chaque sujet doit etre datable (pas de sujet intemporel)
- Inclure des sources REELLES (PubMed, ANSM, EMA, Lancet, NEJM, etc.)

Reponds STRICTEMENT en JSON :
[
  {
    "topic": "titre complet du sujet",
    "summary": "resume en 2-3 phrases factuelles",
    "category": "etude-scientifique|avancee-medicale|alerte-sanitaire|pharmacovigilance|actualite-sante|prevention",
    "keyFacts": ["fait 1", "fait 2", "fait 3"],
    "sources": [
      {"url": "https://...", "title": "...", "publisher": "...", "date": "${today}", "credibility": "scientific|institutional|professional"}
    ]
  }
]

JSON uniquement, pas de markdown.`;

  try {
    const endpoint = useOpenRouter
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.anthropic.com/v1/messages';

    const headers: Record<string, string> = useOpenRouter
      ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }
      : { 'Content-Type': 'application/json', 'x-api-key': apiKey!, 'anthropic-version': '2023-06-01' };

    const model = useOpenRouter ? 'anthropic/claude-haiku-3' : 'claude-3-haiku-20240307';

    const body = useOpenRouter
      ? JSON.stringify({ model, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] })
      : JSON.stringify({ model, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] });

    const response = await fetch(endpoint, { method: 'POST', headers, body });
    if (!response.ok) {
      console.log(`  ⚠️ Claude fallback error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const text = useOpenRouter
      ? data.choices?.[0]?.message?.content
      : data.content?.find((c: any) => c.type === 'text')?.text;

    if (!text) return [];

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const topics = JSON.parse(jsonMatch[0]);

    const findings: ResearchFinding[] = topics.map((t: any, i: number) => ({
      id: `claude-topic-${i}-${Date.now()}`,
      topic: t.topic || '',
      summary: t.summary || '',
      category: t.category || 'actualite-sante',
      sources: (t.sources || []).map((s: any) => ({
        url: s.url || 'https://ansm.sante.fr',
        title: s.title || t.topic,
        publisher: s.publisher || 'Source medicale',
        date: s.date || today,
        credibility: s.credibility || 'professional',
      })),
      keyFacts: t.keyFacts || [t.topic],
      dateDiscovered: today,
      relevanceScore: 70 + i * 5,
    }));

    console.log(`  🤖 ${findings.length} sujets generes par Claude`);
    return findings;
  } catch (err) {
    console.log(`  ⚠️ Claude fallback error: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

/**
 * 📰 Recherche d'actualites : institutionnel + fallback Claude
 */
export async function researchFromNews(maxTopics: number = 6): Promise<ResearchFinding[]> {
  // D'abord essayer les flux institutionnels
  const institutional = await fetchInstitutionalNews();

  if (institutional.length >= 2) {
    console.log(`📰 ${institutional.length} actualites trouvees (sources institutionnelles)`);
    return institutional.slice(0, maxTopics);
  }

  // Si pas assez de résultats, fallback Claude
  console.log('📰 Pas assez d\'actualites institutionnelles, fallback Claude...');
  const claudeTopics = await generateTopicsWithClaude();

  const all = [...institutional, ...claudeTopics];
  console.log(`📰 Total: ${all.length} sujets d'actualite`);
  return all.slice(0, maxTopics);
}
