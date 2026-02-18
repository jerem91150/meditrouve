// ============================================
// 🚀 MULTI-SOURCE PIPELINE v2
// Pipeline data-driven : BDPM + News + PubMed → Articles complets → Publish
// Génère des articles d'actualité, ruptures, études croisées
// ============================================

import { researchFromBDPM } from './bdpm-research';
import { researchFromNews } from './news-research';
import { researchFromPubMed } from './pubmed-research';
import { validateArticle } from './validation';
import { generateComprehensiveArticle } from './comprehensive-generator';
import { publishArticle, disconnect, getExistingSlugs } from './publisher';
import { PipelineResult, PipelineConfig, ResearchFinding } from './types';

const DEFAULT_CONFIG: PipelineConfig = {
  maxTopics: 10,
  topN: 3,
  minScore: 70,
  dryRun: false,
};

/**
 * 🚀 Pipeline multi-sources v2
 * Mélange ruptures BDPM, actualités santé, études PubMed
 */
export async function runBDPMPipeline(
  config: Partial<PipelineConfig> = {}
): Promise<PipelineResult> {
  const cfg: PipelineConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();
  const errors: string[] = [];
  const articles: PipelineResult['articles'] = [];

  console.log('🚀 ════════════════════════════════════════');
  console.log('🚀 PIPELINE AUTO-BLOG v2 (MULTI-SOURCE)');
  console.log(`🚀 Config: topN=${cfg.topN}, minScore=${cfg.minScore}, dryRun=${cfg.dryRun}`);
  console.log('🚀 ════════════════════════════════════════\n');

  try {
    // ── PHASE 1 : RECHERCHE MULTI-SOURCES (en parallèle) ──
    console.log('\n📡 ═══ PHASE 1 : RECHERCHE MULTI-SOURCES ═══');

    const [bdpmFindings, newsFindings, pubmedFindings] = await Promise.allSettled([
      researchFromBDPM(6),
      researchFromNews(6),
      researchFromPubMed(4),
    ]);

    const allFindings: ResearchFinding[] = [];

    if (bdpmFindings.status === 'fulfilled') {
      allFindings.push(...bdpmFindings.value.findings);
      console.log(`\n🏥 BDPM: ${bdpmFindings.value.findings.length} ruptures/tensions`);
    } else {
      console.log(`\n⚠️ BDPM: erreur - ${bdpmFindings.reason}`);
      errors.push(`BDPM: ${bdpmFindings.reason}`);
    }

    if (newsFindings.status === 'fulfilled') {
      allFindings.push(...newsFindings.value);
      console.log(`📰 News: ${newsFindings.value.length} actualités`);
    } else {
      console.log(`⚠️ News: erreur - ${newsFindings.reason}`);
      errors.push(`News: ${newsFindings.reason}`);
    }

    if (pubmedFindings.status === 'fulfilled') {
      allFindings.push(...pubmedFindings.value);
      console.log(`🔬 PubMed: ${pubmedFindings.value.length} études`);
    } else {
      console.log(`⚠️ PubMed: erreur - ${pubmedFindings.reason}`);
      errors.push(`PubMed: ${pubmedFindings.reason}`);
    }

    console.log(`\n📊 Total: ${allFindings.length} sujets identifiés`);

    if (allFindings.length === 0) {
      console.log('❌ Aucun sujet trouvé depuis aucune source.');
      return {
        success: false,
        articlesGenerated: 0,
        articlesPublished: 0,
        articles: [],
        errors: ['Aucun sujet trouvé'],
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }

    // ── PHASE 2 : DÉDUPLICATION & SÉLECTION ──
    console.log('\n🔍 ═══ PHASE 2 : DÉDUPLICATION & SÉLECTION ═══');

    let existingSlugs: Set<string> = new Set();
    if (!cfg.dryRun) {
      try {
        existingSlugs = await getExistingSlugs();
        console.log(`📋 ${existingSlugs.size} articles existants en base`);
      } catch (e) {
        console.log('⚠️ Impossible de vérifier les slugs existants');
      }
    }

    // Filtrer les sujets qui ont déjà un article similaire
    const newFindings = allFindings.filter(f => {
      const topicSlug = f.topic
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .substring(0, 30);
      for (const existing of existingSlugs) {
        if (existing.includes(topicSlug.substring(0, 15))) {
          console.log(`  ⏭️ Skip "${f.topic.substring(0, 50)}..." - article existant`);
          return false;
        }
      }
      return true;
    });

    // Sélectionner un mix diversifié de catégories
    const selected = selectDiverseTopics(newFindings, cfg.topN);
    console.log(`\n✅ ${selected.length} sujets sélectionnés :`);
    for (const s of selected) {
      console.log(`  📌 [${s.category}] ${s.topic.substring(0, 70)}...`);
    }

    // ── PHASE 3 & 4 : GÉNÉRATION + VALIDATION + PUBLICATION ──
    for (const finding of selected) {
      try {
        console.log(`\n✍️ ═══ PHASE 3 : GÉNÉRATION "${finding.topic.substring(0, 50)}..." ═══`);
        const article = await generateComprehensiveArticle(finding);

        console.log(`\n✅ ═══ PHASE 4 : VALIDATION "${article.slug}" ═══`);
        const qualityCheck = await validateArticle(article);

        if (!cfg.dryRun) {
          console.log(`\n📤 ═══ PHASE 5 : PUBLICATION "${article.slug}" ═══`);
          const result = await publishArticle(article, qualityCheck, cfg.minScore);
          articles.push({
            slug: article.slug,
            title: article.public.title,
            score: qualityCheck.overallScore,
            published: result.published,
          });
        } else {
          console.log(`\n⏭️ DRY RUN : "${article.slug}" (score: ${qualityCheck.overallScore})`);
          articles.push({
            slug: article.slug,
            title: article.public.title,
            score: qualityCheck.overallScore,
            published: false,
          });
        }
      } catch (err) {
        const msg = `Erreur pour "${finding.topic.substring(0, 50)}": ${err instanceof Error ? err.message : String(err)}`;
        console.error(`❌ ${msg}`);
        errors.push(msg);
      }
    }
  } catch (err) {
    const msg = `Erreur pipeline: ${err instanceof Error ? err.message : String(err)}`;
    console.error(`❌ ${msg}`);
    errors.push(msg);
  } finally {
    await disconnect();
  }

  const duration = Date.now() - startTime;
  const result: PipelineResult = {
    success: errors.length === 0 || articles.some(a => a.published),
    articlesGenerated: articles.length,
    articlesPublished: articles.filter(a => a.published).length,
    articles,
    errors,
    duration,
    timestamp: new Date().toISOString(),
  };

  console.log('\n🏁 ════════════════════════════════════════');
  console.log(`🏁 PIPELINE v2 TERMINÉ en ${(duration / 1000).toFixed(1)}s`);
  console.log(`🏁 Articles : ${result.articlesGenerated} générés, ${result.articlesPublished} publiés`);
  if (errors.length > 0) console.log(`🏁 Erreurs : ${errors.length}`);
  console.log('🏁 ════════════════════════════════════════\n');

  return result;
}

/**
 * Sélectionne un mix diversifié de sujets depuis différentes catégories
 * Priorité : 1 rupture + 1 étude/avancée + 1 actu/alerte
 */
function selectDiverseTopics(findings: ResearchFinding[], topN: number): ResearchFinding[] {
  // Grouper par type de source
  const ruptures = findings.filter(f => f.category === 'rupture-stock');
  const studies = findings.filter(f => ['etude-scientifique', 'avancee-medicale', 'pharmacovigilance'].includes(f.category));
  const news = findings.filter(f => ['actualite-sante', 'alerte-sanitaire', 'reglementation', 'prevention', 'nouveau-medicament'].includes(f.category));

  // Trier chaque groupe par score
  ruptures.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  studies.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  news.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  const selected: ResearchFinding[] = [];

  // Round-robin : prendre 1 de chaque catégorie à tour de rôle
  const pools = [ruptures, studies, news];
  let poolIdx = 0;
  const poolCounters = [0, 0, 0];

  while (selected.length < topN) {
    const pool = pools[poolIdx];
    if (poolCounters[poolIdx] < pool.length) {
      selected.push(pool[poolCounters[poolIdx]]);
      poolCounters[poolIdx]++;
    }
    poolIdx = (poolIdx + 1) % pools.length;

    // Safety: si on a fait un tour complet sans rien ajouter, on arrête
    if (poolCounters.every((c, i) => c >= pools[i].length)) break;
  }

  return selected;
}
