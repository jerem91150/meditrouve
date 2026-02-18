// ============================================
// 📰 NEWS RESEARCH MODULE
// Recherche d'actualités santé françaises via Google News RSS
// Sources: Google News, ANSM, HAS, Le Monde Santé
// ============================================

import { ResearchFinding } from './types';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
}

// RSS feeds santé France
const NEWS_FEEDS = [
  {
    url: 'https://news.google.com/rss/search?q=m%C3%A9dicament+France+sant%C3%A9&hl=fr&gl=FR&ceid=FR:fr',
    name: 'Google News - Médicaments France',
  },
  {
    url: 'https://news.google.com/rss/search?q=avancée+médicale+traitement+2025+2026&hl=fr&gl=FR&ceid=FR:fr',
    name: 'Google News - Avancées médicales',
  },
  {
    url: 'https://news.google.com/rss/search?q=étude+scientifique+médicament+résultats&hl=fr&gl=FR&ceid=FR:fr',
    name: 'Google News - Études scientifiques',
  },
  {
    url: 'https://news.google.com/rss/search?q=ANSM+alerte+pharmacovigilance&hl=fr&gl=FR&ceid=FR:fr',
    name: 'Google News - ANSM Alertes',
  },
];

/**
 * Parse un flux RSS XML simplifié
 */
function parseRSS(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  for (const itemXml of itemMatches) {
    const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() || '';
    const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
    const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || '';
    const source = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() || '';
    const description = itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').replace(/<[^>]+>/g, '').trim() || '';

    if (title && link) {
      items.push({ title, link, pubDate, source, description });
    }
  }
  return items;
}

/**
 * Catégorise un article de news en fonction de son titre/description
 */
function categorizeNews(title: string, description: string): { category: string; relevance: number } {
  const text = `${title} ${description}`.toLowerCase();

  if (/rupture|pénurie|indisponible|stock|approvisionnement/.test(text)) {
    return { category: 'rupture-stock', relevance: 90 };
  }
  if (/alerte|rappel|retrait|vigilance|effet.?ind[ée]sirable|pharmacovigilance/.test(text)) {
    return { category: 'alerte-sanitaire', relevance: 85 };
  }
  if (/étude|essai.?clinique|recherche|résultats|publi[ée]|lancet|nejm|nature|jama/.test(text)) {
    return { category: 'etude-scientifique', relevance: 80 };
  }
  if (/nouveau|approuv[ée]|autorisation|amm|innov|thérapie|traitement|découverte|avancée/.test(text)) {
    return { category: 'avancee-medicale', relevance: 75 };
  }
  if (/réglementation|loi|décret|has|remboursement|commission/.test(text)) {
    return { category: 'reglementation', relevance: 70 };
  }
  if (/vaccin|prévention|dépistage|campagne/.test(text)) {
    return { category: 'prevention', relevance: 65 };
  }
  return { category: 'actualite-sante', relevance: 50 };
}

/**
 * Déduplique les news par titre similaire
 */
function deduplicateNews(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    // Normaliser le titre pour déduplication
    const key = item.title.toLowerCase()
      .replace(/[^a-zàâéèêëïôùûüç0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 📰 Recherche d'actualités santé françaises
 */
export async function researchFromNews(maxTopics: number = 6): Promise<ResearchFinding[]> {
  console.log('📰 Recherche actualités santé...');
  const allItems: NewsItem[] = [];

  for (const feed of NEWS_FEEDS) {
    try {
      const response = await fetch(feed.url, {
        headers: { 'User-Agent': 'MediTrouve-Bot/1.0' },
      });
      if (!response.ok) {
        console.log(`  ⚠️ Feed ${feed.name}: HTTP ${response.status}`);
        continue;
      }
      const xml = await response.text();
      const items = parseRSS(xml);
      console.log(`  📰 ${feed.name}: ${items.length} articles`);
      allItems.push(...items);
    } catch (err) {
      console.log(`  ⚠️ Erreur feed ${feed.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Dédupliquer
  const unique = deduplicateNews(allItems);
  console.log(`📰 ${unique.length} articles uniques trouvés`);

  // Filtrer les articles des 7 derniers jours
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = unique.filter(item => {
    if (!item.pubDate) return true; // Garder si pas de date
    const d = new Date(item.pubDate).getTime();
    return d > weekAgo;
  });

  // Catégoriser et scorer
  const scored = recent.map(item => {
    const { category, relevance } = categorizeNews(item.title, item.description);
    return { ...item, category, relevance };
  });

  // Trier par pertinence et prendre les meilleurs
  scored.sort((a, b) => b.relevance - a.relevance);
  const selected = scored.slice(0, maxTopics);

  const today = new Date().toISOString().split('T')[0];

  const findings: ResearchFinding[] = selected.map((item, i) => ({
    id: `news-${i}-${Date.now()}`,
    topic: item.title,
    summary: item.description || item.title,
    category: item.category as any,
    sources: [
      {
        url: item.link,
        title: item.title,
        publisher: item.source || 'Presse',
        date: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : today,
        credibility: 'media' as const,
      },
    ],
    keyFacts: [
      item.title,
      `Source: ${item.source || 'Presse française'}`,
      item.description ? item.description.substring(0, 200) : '',
    ].filter(Boolean),
    dateDiscovered: today,
    relevanceScore: item.relevance,
  }));

  console.log(`📰 ${findings.length} sujets d'actualité sélectionnés`);
  return findings;
}
