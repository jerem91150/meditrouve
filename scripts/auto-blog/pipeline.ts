// ============================================
// 🚀 PIPELINE PRINCIPAL
// Orchestrateur du pipeline de génération d'articles
// Research → Validation → Génération → Re-validation → Publication
// ============================================

import { researchTopics } from './research';
import { validateFindings, validateArticle } from './validation';
import { generateArticle } from './generator';
import { publishArticle, disconnect } from './publisher';
import {
  PipelineResult,
  PipelineConfig,
  DEFAULT_CONFIG,
  ResearchFinding,
} from './types';

/**
 * 🚀 Exécuter le pipeline complet de génération d'articles
 */
export async function runPipeline(
  config: Partial<PipelineConfig> = {}
): Promise<PipelineResult> {
  const cfg: PipelineConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();
  const errors: string[] = [];
  const articles: PipelineResult['articles'] = [];

  console.log('🚀 ════════════════════════════════════════');
  console.log('🚀 PIPELINE AUTO-BLOG MEDITROUVE');
  console.log(`🚀 Config: maxTopics=${cfg.maxTopics}, topN=${cfg.topN}, minScore=${cfg.minScore}, dryRun=${cfg.dryRun}`);
  console.log('🚀 ════════════════════════════════════════\n');

  try {
    // ── PHASE 1 : RESEARCH ──
    console.log('\n📡 ═══ PHASE 1 : RESEARCH ═══');
    const research = await researchTopics(cfg.maxTopics);
    console.log(`📡 ${research.findings.length} sujets trouvés\n`);

    // ── PHASE 2 : VALIDATION FINDINGS ──
    console.log('\n🔍 ═══ PHASE 2 : VALIDATION FINDINGS ═══');
    const validatedFindings = await validateFindings(research.findings, cfg.topN);
    const approvedFindingIds = new Set(validatedFindings.filter(v => v.approved).map(v => v.findingId));

    // Récupérer les findings correspondants
    const topFindings: ResearchFinding[] = [];
    for (const v of validatedFindings) {
      const finding = research.findings.find(f => f.id === v.findingId);
      if (finding && approvedFindingIds.has(v.findingId)) {
        finding.relevanceScore = v.criteria.overallScore;
        topFindings.push(finding);
      }
    }

    if (topFindings.length === 0) {
      console.log('⚠️ Aucun finding approuvé, tentative avec les top scores...');
      // Fallback : prendre les top N même non approuvés
      for (const v of validatedFindings.slice(0, cfg.topN)) {
        const finding = research.findings.find(f => f.id === v.findingId);
        if (finding) {
          finding.relevanceScore = v.criteria.overallScore;
          topFindings.push(finding);
        }
      }
    }

    console.log(`🔍 ${topFindings.length} sujets sélectionnés pour génération\n`);

    // ── PHASE 3 & 4 : GÉNÉRATION + RE-VALIDATION ──
    for (const finding of topFindings) {
      try {
        console.log(`\n✍️ ═══ PHASE 3 : GÉNÉRATION "${finding.topic}" ═══`);
        const article = await generateArticle(finding);

        console.log(`\n✅ ═══ PHASE 4 : RE-VALIDATION "${article.slug}" ═══`);
        const qualityCheck = await validateArticle(article);

        // ── PHASE 5 : PUBLICATION ──
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
          console.log(`\n⏭️ DRY RUN : article "${article.slug}" non publié`);
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
  console.log(`🏁 PIPELINE TERMINÉ en ${(duration / 1000).toFixed(1)}s`);
  console.log(`🏁 Articles : ${result.articlesGenerated} générés, ${result.articlesPublished} publiés`);
  if (errors.length > 0) console.log(`🏁 Erreurs : ${errors.length}`);
  console.log('🏁 ════════════════════════════════════════\n');

  return result;
}
