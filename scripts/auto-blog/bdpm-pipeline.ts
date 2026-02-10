// ============================================
// 🚀 BDPM PIPELINE
// Pipeline data-driven : BDPM → SEO Articles → Publish
// Remplace le pipeline halluciné par des données réelles
// ============================================

import { researchFromBDPM } from './bdpm-research';
import { validateArticle } from './validation';
import { generateSEOArticle } from './seo-generator';
import { publishArticle, disconnect, getExistingSlugs } from './publisher';
import { PipelineResult, PipelineConfig, DEFAULT_CONFIG } from './types';

/**
 * 🚀 Pipeline BDPM : génère des articles SEO à partir des ruptures réelles
 */
export async function runBDPMPipeline(
  config: Partial<PipelineConfig> = {}
): Promise<PipelineResult> {
  const cfg: PipelineConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();
  const errors: string[] = [];
  const articles: PipelineResult['articles'] = [];

  console.log('🚀 ════════════════════════════════════════');
  console.log('🚀 PIPELINE AUTO-BLOG BDPM (SEO)');
  console.log(`🚀 Config: maxTopics=${cfg.maxTopics}, topN=${cfg.topN}, minScore=${cfg.minScore}, dryRun=${cfg.dryRun}`);
  console.log('🚀 ════════════════════════════════════════\n');

  try {
    // ── PHASE 1 : RECHERCHE BDPM ──
    console.log('\n🏥 ═══ PHASE 1 : RECHERCHE BDPM ═══');
    const research = await researchFromBDPM(cfg.maxTopics * 2); // fetch more to filter
    console.log(`🏥 ${research.findings.length} ruptures/tensions identifiées\n`);

    // ── PHASE 2 : DÉDUPLICATION ──
    console.log('\n🔍 ═══ PHASE 2 : DÉDUPLICATION ═══');
    let existingSlugs: Set<string> = new Set();
    if (!cfg.dryRun) {
      try {
        existingSlugs = await getExistingSlugs();
      } catch (e) {
        console.log('⚠️ Impossible de vérifier les slugs existants, on continue...');
      }
    }

    // Filtrer les findings dont on a déjà un article récent (même mois)
    const currentMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const newFindings = research.findings.filter(f => {
      const medSlug = f.topic
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .substring(0, 50);
      // Vérifier si un article avec un slug similaire existe déjà ce mois
      for (const existing of existingSlugs) {
        if (existing.includes(medSlug.substring(0, 20))) {
          console.log(`  ⏭️ Skip "${f.topic}" - article existant`);
          return false;
        }
      }
      return true;
    });

    const selectedFindings = newFindings.slice(0, cfg.topN);
    console.log(`🔍 ${selectedFindings.length} nouveaux sujets sélectionnés\n`);

    if (selectedFindings.length === 0) {
      console.log('ℹ️ Aucun nouveau sujet à traiter.');
    }

    // ── PHASE 3 & 4 : GÉNÉRATION + VALIDATION + PUBLICATION ──
    for (const finding of selectedFindings) {
      try {
        console.log(`\n✍️ ═══ PHASE 3 : GÉNÉRATION "${finding.topic.substring(0, 50)}..." ═══`);
        const article = await generateSEOArticle(finding);

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
        const msg = `Erreur pour "${finding.topic}": ${err instanceof Error ? err.message : String(err)}`;
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
    success: errors.length === 0,
    articlesGenerated: articles.length,
    articlesPublished: articles.filter(a => a.published).length,
    articles,
    errors,
    duration,
    timestamp: new Date().toISOString(),
  };

  console.log('\n🏁 ════════════════════════════════════════');
  console.log(`🏁 PIPELINE BDPM TERMINÉ en ${(duration / 1000).toFixed(1)}s`);
  console.log(`🏁 Articles : ${result.articlesGenerated} générés, ${result.articlesPublished} publiés`);
  if (errors.length > 0) console.log(`🏁 Erreurs : ${errors.length}`);
  console.log('🏁 ════════════════════════════════════════\n');

  return result;
}
