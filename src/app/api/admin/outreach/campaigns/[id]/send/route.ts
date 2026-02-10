import { NextRequest, NextResponse } from 'next/server';
import { sendCampaignEmails } from '@/lib/outreach-sender';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { emailId } = body as { emailId?: string };

  try {
    const result = await sendCampaignEmails(id, emailId ? { emailId } : undefined);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[ADMIN_SEND_ERROR]', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Send failed' },
      { status: 500 }
    );
  }
}
