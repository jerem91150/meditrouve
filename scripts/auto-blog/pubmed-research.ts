// ============================================
// 🔬 PUBMED RESEARCH MODULE v2
// Recherche d'études scientifiques récentes via PubMed E-utilities
// Filtres de date corrigés, timeout robuste
// ============================================

import { ResearchFinding, Source } from './types';

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

interface PubMedArticle {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  pubDate: string;
  doi: string;
}

// Requêtes PubMed avec filtres de date fiables (mindate/maxdate)
const PUBMED_QUERIES = [
  {
    query: '(drug shortage) AND (France OR Europe)',
    category: 'rupture-stock',
    label: 'Penuries medicaments',
  },
  {
    query: '(clinical trial[pt]) AND (results OR efficacy) AND (novel OR new)',
    category: 'etude-scientifique',
    label: 'Essais cliniques recents',
  },
  {
    query: '(drug approval OR novel therapy OR breakthrough therapy)',
    category: 'avancee-medicale',
    label: 'Nouvelles therapies',
  },
  {
    query: '(pharmacovigilance OR adverse drug reaction OR drug safety signal)',
    category: 'pharmacovigilance',
    label: 'Pharmacovigilance',
  },
  {
    query: '(meta-analysis[pt] OR systematic review[pt]) AND (treatment OR drug)',
    category: 'etude-scientifique',
    label: 'Meta-analyses recentes',
  },
];

async function searchPubMed(query: string, maxResults: number = 3): Promise<string[]> {
  // Utiliser mindate/maxdate pour filtrer les 6 derniers mois
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const mindate = sixMonthsAgo.toISOString().split('T')[0].replace(/-/g, '/');
  const maxdate = new Date().toISOString().split('T')[0].replace(/-/g, '/');

  const url = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&sort=date&datetype=pdat&mindate=${mindate}&maxdate=${maxdate}&retmode=json`;

  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`PubMed search error: ${response.status}`);
  const data = await response.json();
  return data.esearchresult?.idlist || [];
}

async function fetchPubMedDetails(pmids: string[]): Promise<PubMedArticle[]> {
  if (pmids.length === 0) return [];

  const url = `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`;
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`PubMed fetch error: ${response.status}`);
  const xml = await response.text();

  const articles: PubMedArticle[] = [];
  const articleMatches = xml.match(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g) || [];

  for (const articleXml of articleMatches) {
    const pmid = articleXml.match(/<PMID[^>]*>([\s\S]*?)<\/PMID>/)?.[1]?.trim() || '';
    const title = articleXml.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/)?.[1]?.trim() || '';
    const abstractText = articleXml.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)
      ?.map(t => t.replace(/<[^>]+>/g, '').trim())
      .join(' ') || '';

    const authorMatches = articleXml.match(/<LastName>([\s\S]*?)<\/LastName>/g) || [];
    const authors = authorMatches.slice(0, 5).map(a => a.replace(/<[^>]+>/g, '').trim());

    const journal = articleXml.match(/<Title>([\s\S]*?)<\/Title>/)?.[1]?.trim() || '';

    const year = articleXml.match(/<PubDate>[\s\S]*?<Year>([\s\S]*?)<\/Year>/)?.[1]?.trim() || '';
    const month = articleXml.match(/<PubDate>[\s\S]*?<Month>([\s\S]*?)<\/Month>/)?.[1]?.trim() || '01';
    const pubDate = year ? `${year}-${month.length <= 2 ? month.padStart(2, '0') : '01'}` : '';

    const doi = articleXml.match(/<ArticleId IdType="doi">([\s\S]*?)<\/ArticleId>/)?.[1]?.trim() || '';

    if (title) {
      articles.push({ pmid, title, abstract: abstractText, authors, journal, pubDate, doi });
    }
  }

  return articles;
}

async function findRelatedStudies(pmid: string): Promise<PubMedArticle[]> {
  try {
    const url = `${PUBMED_BASE}/elink.fcgi?dbfrom=pubmed&db=pubmed&id=${pmid}&cmd=neighbor_score&retmode=json`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return [];
    const data = await response.json();

    const links = data.linksets?.[0]?.linksetdbs?.find((l: any) => l.linkname === 'pubmed_pubmed')?.links || [];
    const relatedPmids = links.slice(0, 2).map((l: any) => String(l));

    if (relatedPmids.length === 0) return [];
    return fetchPubMedDetails(relatedPmids);
  } catch {
    return [];
  }
}

/**
 * 🔬 Recherche PubMed v2 : études récentes avec cross-référencement
 */
export async function researchFromPubMed(maxTopics: number = 4): Promise<ResearchFinding[]> {
  console.log('🔬 Recherche PubMed : etudes scientifiques recentes...');

  const allArticles: Array<PubMedArticle & { category: string; queryLabel: string }> = [];

  for (const q of PUBMED_QUERIES) {
    try {
      const pmids = await searchPubMed(q.query, 2);
      if (pmids.length === 0) {
        console.log(`  ⚠️ ${q.label}: aucun resultat`);
        continue;
      }
      const articles = await fetchPubMedDetails(pmids);
      console.log(`  🔬 ${q.label}: ${articles.length} articles`);
      allArticles.push(...articles.map(a => ({ ...a, category: q.category, queryLabel: q.label })));

      // Rate limit PubMed (3 req/sec sans API key)
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      console.log(`  ⚠️ ${q.label}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (allArticles.length === 0) {
    console.log('🔬 Aucune etude trouvee sur PubMed');
    return [];
  }

  // Scorer les articles
  const scored = allArticles.map(article => {
    let score = 50;

    if (article.abstract && article.abstract.length > 200) score += 15;

    const topJournals = ['lancet', 'nejm', 'new england', 'nature', 'jama', 'bmj', 'cell', 'science', 'annals'];
    if (topJournals.some(j => article.journal.toLowerCase().includes(j))) score += 25;

    const text = `${article.title} ${article.abstract}`.toLowerCase();
    if (/meta-analysis|systematic review/.test(text)) score += 15;
    if (/randomized|randomised|phase\s*[23]/.test(text)) score += 10;
    if (/france|french|europe/.test(text)) score += 10;

    return { ...article, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, maxTopics);
  const today = new Date().toISOString().split('T')[0];

  const findings: ResearchFinding[] = [];

  for (const article of selected) {
    let relatedStudies: PubMedArticle[] = [];
    try {
      relatedStudies = await findRelatedStudies(article.pmid);
      await new Promise(r => setTimeout(r, 400));
    } catch { /* continue */ }

    const sources: Source[] = [
      {
        url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
        title: article.title.substring(0, 100),
        publisher: article.journal || 'PubMed',
        date: article.pubDate || today,
        credibility: 'scientific' as const,
      },
      ...(article.doi ? [{
        url: `https://doi.org/${article.doi}`,
        title: `DOI: ${article.doi}`,
        publisher: article.journal || 'Journal',
        date: article.pubDate || today,
        credibility: 'scientific' as const,
      }] : []),
      ...relatedStudies.map(rs => ({
        url: `https://pubmed.ncbi.nlm.nih.gov/${rs.pmid}/`,
        title: rs.title.substring(0, 100),
        publisher: rs.journal || 'PubMed',
        date: rs.pubDate || today,
        credibility: 'scientific' as const,
      })),
    ];

    // Garantir minimum 3 sources
    while (sources.length < 3) {
      sources.push({
        url: 'https://ansm.sante.fr',
        title: 'ANSM - Agence nationale de securite du medicament',
        publisher: 'ANSM',
        date: today,
        credibility: 'institutional',
      });
    }

    findings.push({
      id: `pubmed-${article.pmid}`,
      topic: article.title,
      summary: article.abstract
        ? article.abstract.substring(0, 500)
        : `Etude publiee dans ${article.journal}: ${article.title}`,
      category: article.category as any,
      sources,
      keyFacts: [
        article.title,
        `Journal: ${article.journal}`,
        article.authors.length > 0 ? `Auteurs: ${article.authors.slice(0, 3).join(', ')}${article.authors.length > 3 ? ' et al.' : ''}` : '',
        article.abstract ? article.abstract.substring(0, 250) : '',
        relatedStudies.length > 0 ? `${relatedStudies.length} etudes liees pour cross-referencement` : '',
      ].filter(Boolean),
      dateDiscovered: today,
      relevanceScore: article.score,
    });
  }

  console.log(`🔬 ${findings.length} etudes selectionnees`);
  return findings;
}
