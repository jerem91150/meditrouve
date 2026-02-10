import { NextRequest, NextResponse } from 'next/server';
import { sendCampaignEmails } from '@/lib/outreach-sender';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { emailId } = body as { emailId?: string };

  try {
    const result = await sendCampaignEmails(id, { emailId });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Send failed' },
      { status: 500 }
    );
  }
}
