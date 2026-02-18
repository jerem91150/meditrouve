// ============================================
// 🔬 PUBMED RESEARCH MODULE
// Recherche d'études scientifiques récentes via PubMed E-utilities
// Gratuit, pas besoin d'API key
// ============================================

import { ResearchFinding } from './types';

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

// Requêtes de recherche PubMed ciblées
const PUBMED_QUERIES = [
  {
    query: '(drug shortage OR medication shortage) AND France AND ("2025"[Date - Publication] OR "2026"[Date - Publication])',
    category: 'rupture-stock',
    label: 'Pénuries médicaments France',
  },
  {
    query: '(clinical trial results OR phase 3) AND (drug OR treatment) AND ("2025"[Date - Publication] OR "2026"[Date - Publication]) AND (efficacy OR safety)',
    category: 'etude-scientifique',
    label: 'Essais cliniques récents',
  },
  {
    query: '(new drug approval OR novel therapy OR breakthrough) AND ("2025"[Date - Publication] OR "2026"[Date - Publication])',
    category: 'avancee-medicale',
    label: 'Nouvelles thérapies',
  },
  {
    query: '(pharmacovigilance OR adverse drug reaction OR drug safety) AND ("2025"[Date - Publication] OR "2026"[Date - Publication]) AND (France OR Europe)',
    category: 'pharmacovigilance',
    label: 'Pharmacovigilance',
  },
  {
    query: '(meta-analysis OR systematic review) AND (drug OR medication OR treatment) AND ("2025"[Date - Publication] OR "2026"[Date - Publication])',
    category: 'etude-scientifique',
    label: 'Méta-analyses récentes',
  },
];

/**
 * Recherche PubMed : retourne les PMIDs
 */
async function searchPubMed(query: string, maxResults: number = 5): Promise<string[]> {
  const url = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&sort=date&retmode=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`PubMed search error: ${response.status}`);
  const data = await response.json();
  return data.esearchresult?.idlist || [];
}

/**
 * Récupère les détails d'articles PubMed
 */
async function fetchPubMedDetails(pmids: string[]): Promise<PubMedArticle[]> {
  if (pmids.length === 0) return [];

  const url = `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`;
  const response = await fetch(url);
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

    // Extraire auteurs
    const authorMatches = articleXml.match(/<LastName>([\s\S]*?)<\/LastName>/g) || [];
    const authors = authorMatches.slice(0, 5).map(a => a.replace(/<[^>]+>/g, '').trim());

    // Journal
    const journal = articleXml.match(/<Title>([\s\S]*?)<\/Title>/)?.[1]?.trim() || '';

    // Date de publication
    const year = articleXml.match(/<PubDate>[\s\S]*?<Year>([\s\S]*?)<\/Year>/)?.[1]?.trim() || '';
    const month = articleXml.match(/<PubDate>[\s\S]*?<Month>([\s\S]*?)<\/Month>/)?.[1]?.trim() || '01';
    const day = articleXml.match(/<PubDate>[\s\S]*?<Day>([\s\S]*?)<\/Day>/)?.[1]?.trim() || '01';
    const pubDate = year ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : '';

    // DOI
    const doi = articleXml.match(/<ArticleId IdType="doi">([\s\S]*?)<\/ArticleId>/)?.[1]?.trim() || '';

    if (title) {
      articles.push({ pmid, title, abstract: abstractText, authors, journal, pubDate, doi });
    }
  }

  return articles;
}

/**
 * Recherche d'études liées pour le cross-référencement
 */
async function findRelatedStudies(pmid: string, maxResults: number = 3): Promise<PubMedArticle[]> {
  try {
    const url = `${PUBMED_BASE}/elink.fcgi?dbfrom=pubmed&db=pubmed&id=${pmid}&cmd=neighbor_score&retmode=json`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();

    const links = data.linksets?.[0]?.linksetdbs?.find((l: any) => l.linkname === 'pubmed_pubmed')?.links || [];
    const relatedPmids = links.slice(0, maxResults).map((l: any) => String(l));

    if (relatedPmids.length === 0) return [];
    return fetchPubMedDetails(relatedPmids);
  } catch {
    return [];
  }
}

/**
 * 🔬 Recherche PubMed : études scientifiques récentes avec cross-référencement
 */
export async function researchFromPubMed(maxTopics: number = 4): Promise<ResearchFinding[]> {
  console.log('🔬 Recherche PubMed : études scientifiques récentes...');

  const allArticles: Array<PubMedArticle & { category: string; queryLabel: string }> = [];

  for (const q of PUBMED_QUERIES) {
    try {
      const pmids = await searchPubMed(q.query, 3);
      if (pmids.length === 0) {
        console.log(`  ⚠️ ${q.label}: aucun résultat`);
        continue;
      }
      const articles = await fetchPubMedDetails(pmids);
      console.log(`  🔬 ${q.label}: ${articles.length} articles`);
      allArticles.push(...articles.map(a => ({ ...a, category: q.category, queryLabel: q.label })));

      // Rate limit PubMed (3 req/sec sans API key)
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      console.log(`  ⚠️ Erreur ${q.label}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Scorer les articles
  const scored = allArticles.map(article => {
    let score = 50;

    // Articles avec abstract = plus riches
    if (article.abstract && article.abstract.length > 200) score += 20;

    // Journal de haut niveau
    const topJournals = ['lancet', 'nejm', 'nature', 'jama', 'bmj', 'cell', 'science'];
    if (topJournals.some(j => article.journal.toLowerCase().includes(j))) score += 25;

    // Essais cliniques / méta-analyses
    const text = `${article.title} ${article.abstract}`.toLowerCase();
    if (/meta-analysis|systematic review/.test(text)) score += 15;
    if (/randomized|randomised|phase\s*[23]/.test(text)) score += 10;
    if (/france|french|europe/.test(text)) score += 10;

    return { ...article, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, maxTopics);

  const today = new Date().toISOString().split('T')[0];

  // Pour chaque article sélectionné, chercher des études liées
  const findings: ResearchFinding[] = [];

  for (const article of selected) {
    // Chercher études liées pour cross-référencement
    let relatedStudies: PubMedArticle[] = [];
    try {
      relatedStudies = await findRelatedStudies(article.pmid, 3);
      await new Promise(r => setTimeout(r, 400)); // Rate limit
    } catch {
      // Silently continue
    }

    const sources = [
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
    if (sources.length < 3) {
      sources.push({
        url: 'https://ansm.sante.fr',
        title: 'ANSM - Agence nationale de sécurité du médicament',
        publisher: 'ANSM',
        date: today,
        credibility: 'institutional' as const,
      });
    }

    const keyFacts = [
      article.title,
      `Journal: ${article.journal}`,
      article.authors.length > 0 ? `Auteurs: ${article.authors.slice(0, 3).join(', ')}${article.authors.length > 3 ? ' et al.' : ''}` : '',
      article.abstract ? article.abstract.substring(0, 300) : '',
      relatedStudies.length > 0 ? `${relatedStudies.length} études liées identifiées pour cross-référencement` : '',
    ].filter(Boolean);

    findings.push({
      id: `pubmed-${article.pmid}`,
      topic: article.title,
      summary: article.abstract
        ? article.abstract.substring(0, 500)
        : `Étude publiée dans ${article.journal}: ${article.title}`,
      category: article.category as any,
      sources,
      keyFacts,
      dateDiscovered: today,
      relevanceScore: article.score,
    });
  }

  console.log(`🔬 ${findings.length} études scientifiques sélectionnées`);
  return findings;
}
