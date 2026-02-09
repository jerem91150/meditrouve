import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/blog/views - Incrémenter le compteur de vues
 */
export async function POST(request: NextRequest) {
  try {
    const { slug, version } = await request.json();

    if (!slug || !['public', 'pro'].includes(version)) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }

    const field = version === 'pro' ? 'viewCountPro' : 'viewCountPublic';

    await prisma.blogPost.update({
      where: { slug },
      data: { [field]: { increment: 1 } },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
