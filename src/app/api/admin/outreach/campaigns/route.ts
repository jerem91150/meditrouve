import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET — List campaigns
export async function GET() {
  const campaigns = await prisma.outreachCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { emails: true },
      },
    },
  });

  // Enrich with stats
  const enriched = await Promise.all(
    campaigns.map(async (c) => {
      const stats = await prisma.outreachEmail.groupBy({
        by: ['status'],
        where: { campaignId: c.id },
        _count: true,
      });
      return {
        ...c,
        stats: Object.fromEntries(stats.map((s) => [s.status, s._count])),
      };
    })
  );

  return NextResponse.json(enriched);
}

// POST — Create campaign
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type, mode, template, subject } = body;

  if (!name || !type || !template) {
    return NextResponse.json(
      { error: 'name, type, and template are required' },
      { status: 400 }
    );
  }

  const campaign = await prisma.outreachCampaign.create({
    data: {
      name,
      type,
      mode: mode || 'SEMI_AUTO',
      template,
      subject: subject || `AlerteMedicaments — Partenariat ${type.toLowerCase()}`,
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
