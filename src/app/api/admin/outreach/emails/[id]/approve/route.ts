import { requireAdmin } from "@/lib/admin-auth";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH — Approve or reject an email
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

) {
  const { id } = await params;
  const body = await req.json();
  const { action, subject, body: emailBody } = body as {
    action: 'approve' | 'reject' | 'edit';
    subject?: string;
    body?: string;
  };

  const email = await prisma.outreachEmail.findUnique({ where: { id } });
  if (!email) {
    return NextResponse.json({ error: 'Email not found' }, { status: 404 });
  }

  if (action === 'approve') {
    const updated = await prisma.outreachEmail.update({
      where: { id },
      data: {
        status: 'APPROVED',
        ...(subject && { subject }),
        ...(emailBody && { body: emailBody }),
      },
    });
    return NextResponse.json(updated);
  }

  if (action === 'reject') {
    const updated = await prisma.outreachEmail.update({
      where: { id },
      data: { status: 'REJECTED' as never },
    });
    return NextResponse.json(updated);
  }

  if (action === 'edit') {
    const updated = await prisma.outreachEmail.update({
      where: { id },
      data: {
        ...(subject && { subject }),
        ...(emailBody && { body: emailBody }),
      },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
