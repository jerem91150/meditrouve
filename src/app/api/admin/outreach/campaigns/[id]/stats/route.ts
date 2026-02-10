import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const campaign = await prisma.outreachCampaign.findUnique({
    where: { id },
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const statusCounts = await prisma.outreachEmail.groupBy({
    by: ['status'],
    where: { campaignId: id },
    _count: true,
  });

  const total = await prisma.outreachEmail.count({ where: { campaignId: id } });
  const sent = statusCounts.find(s => s.status === 'SENT')?._count || 0;
  const opened = statusCounts.find(s => s.status === 'OPENED')?._count || 0;
  const replied = statusCounts.find(s => s.status === 'REPLIED')?._count || 0;
  const draft = statusCounts.find(s => s.status === 'DRAFT')?._count || 0;
  const approved = statusCounts.find(s => s.status === 'APPROVED')?._count || 0;

  const sentTotal = sent + opened + replied;

  return NextResponse.json({
    campaign,
    stats: {
      total,
      draft,
      approved,
      sent: sentTotal,
      opened: opened + replied,
      replied,
      openRate: sentTotal > 0 ? ((opened + replied) / sentTotal * 100).toFixed(1) : '0',
      replyRate: sentTotal > 0 ? (replied / sentTotal * 100).toFixed(1) : '0',
    },
    statusBreakdown: Object.fromEntries(statusCounts.map(s => [s.status, s._count])),
  });
}
