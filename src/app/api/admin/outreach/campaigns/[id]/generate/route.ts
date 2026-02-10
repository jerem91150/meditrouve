import { requireAdmin } from "@/lib/admin-auth";

import { NextRequest, NextResponse } from 'next/server';
import { generateCampaignEmails } from '@/lib/outreach-ai';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

) {
  const { id } = await params;

  try {
    const generated = await generateCampaignEmails(id);
    return NextResponse.json({ generated, campaignId: id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
