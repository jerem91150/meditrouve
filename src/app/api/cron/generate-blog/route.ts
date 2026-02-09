import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '../../../../../scripts/auto-blog/pipeline';

export const maxDuration = 300; // 5 minutes max (Vercel Pro)

/**
 * 🕘 CRON : Génération automatique d'articles de blog
 * Déclenché quotidiennement à 9h via Vercel Cron
 * Sécurisé par CRON_SECRET
 */
export async function GET(request: NextRequest) {
  // Vérification sécurité
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🕘 Cron generate-blog déclenché');

  try {
    const result = await runPipeline({
      maxTopics: 6,
      topN: 3,
      minScore: 80,
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
