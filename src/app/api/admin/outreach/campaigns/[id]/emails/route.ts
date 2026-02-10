import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const emails = await prisma.outreachEmail.findMany({
    where: { campaignId: id },
    include: {
      contact: {
        select: { name: true, email: true, type: true, location: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(emails);
}
