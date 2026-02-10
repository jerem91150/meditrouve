import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  const campaign = await prisma.outreachCampaign.findUnique({
    where: { id },
    include: {
      emails: {
        select: {
          id: true,
          status: true,
          sentAt: true,
          openedAt: true,
          contact: { select: { name: true, email: true, type: true } },
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const statusCounts = campaign.emails.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    campaign: { id: campaign.id, name: campaign.name, type: campaign.type },
    stats: statusCounts,
    total: campaign.emails.length,
    emails: campaign.emails,
  });
}
