import { NextRequest, NextResponse } from 'next/server';
import { runBDPMPipeline } from '../../../../../scripts/auto-blog/bdpm-pipeline';

export const maxDuration = 300; // 5 minutes max (Vercel Pro)

/**
 * CRON : Generation automatique d'articles sante multi-sources
 * Declencheur quotidien a 9h via Vercel Cron
 * Sources : BDPM (ruptures) + Google News (actu) + PubMed (etudes)
 * Securise par CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🕘 Cron generate-blog v2 multi-source déclenché');

  try {
    const result = await runBDPMPipeline({
      maxTopics: 12,   // Analyse 12 sujets (4 par source)
      topN: 3,         // Genere 3 articles/jour (1 rupture + 1 etude + 1 actu)
      minScore: 70,    // Seuil publication
      dryRun: false,
    });

    return NextResponse.json({
      success: result.success,
      articlesGenerated: result.articlesGenerated,
      articlesPublished: result.articlesPublished,
      articles: result.articles,
      duration: `${(result.duration / 1000).toFixed(1)}s`,
      errors: result.errors,
    });
  } catch (error) {
    console.error('❌ Erreur cron generate-blog:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
