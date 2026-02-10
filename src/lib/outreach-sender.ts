import { Resend } from 'resend';
import { prisma } from './prisma';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.OUTREACH_FROM_EMAIL || 'contact@alertemedicaments.fr';
const FROM_NAME = process.env.OUTREACH_FROM_NAME || 'AlerteMedicaments';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://alertemedicaments.fr';

// ─── Add tracking pixel to email body ────────────────────────────────

function addTrackingPixel(body: string, trackingId: string): string {
  const pixel = `<img src="${BASE_URL}/api/outreach/track/${trackingId}" width="1" height="1" style="display:none" alt="" />`;

  if (body.includes('</body>')) {
    return body.replace('</body>', `${pixel}</body>`);
  }
  return `${body}${pixel}`;
}

// ─── Send a single outreach email ────────────────────────────────────

export async function sendOutreachEmail(emailId: string): Promise<boolean> {
  const email = await prisma.outreachEmail.findUnique({
    where: { id: emailId },
    include: { contact: true, campaign: true },
  });

  if (!email) throw new Error('Email not found');
  if (email.status === 'SENT' || email.status === 'OPENED' || email.status === 'REPLIED') {
    return false; // Already sent
  }
  if (email.contact.status !== 'ACTIVE') {
    return false; // Contact inactive
  }

  const bodyWithTracking = addTrackingPixel(email.body, email.trackingId!);

  try {
    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email.contact.email,
      subject: email.subject,
      html: bodyWithTracking,
      headers: {
        'X-Outreach-Id': email.id,
        'X-Campaign-Id': email.campaignId,
      },
    });

    if (error) {
      console.error(`[outreach-sender] Resend error for ${email.id}:`, error);
      return false;
    }

    await prisma.outreachEmail.update({
      where: { id: emailId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    return true;
  } catch (err) {
    console.error(`[outreach-sender] Failed to send ${emailId}:`, err);
    return false;
  }
}

// ─── Send all approved emails for a campaign ─────────────────────────

export async function sendCampaignEmails(
  campaignId: string,
  options?: { emailId?: string; delayMs?: number }
): Promise<{ sent: number; failed: number }> {
  const where: Record<string, unknown> = { campaignId };

  if (options?.emailId) {
    where.id = options.emailId;
  }

  where.status = { in: ['APPROVED'] };

  const emails = await prisma.outreachEmail.findMany({
    where: where as never,
    include: { contact: true },
  });

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    const success = await sendOutreachEmail(email.id);
    if (success) {
      sent++;
    } else {
      failed++;
    }

    // Delay between sends to avoid rate limiting
    if (options?.delayMs) {
      await new Promise(resolve => setTimeout(resolve, options.delayMs));
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s default
    }
  }

  // Check if all emails sent → mark campaign as DONE
  const remaining = await prisma.outreachEmail.count({
    where: {
      campaignId,
      status: { in: ['DRAFT', 'APPROVED'] },
    },
  });

  if (remaining === 0) {
    await prisma.outreachCampaign.update({
      where: { id: campaignId },
      data: { status: 'DONE' },
    });
  }

  return { sent, failed };
}

// ─── Auto-follow-up (7 days, no open) ───────────────────────────────

export async function processFollowUps(): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const emails = await prisma.outreachEmail.findMany({
    where: {
      status: 'SENT',
      sentAt: { lt: sevenDaysAgo },
      openedAt: null,
      campaign: { mode: 'AUTO' },
    },
    include: { contact: true, campaign: true },
  });

  let count = 0;
  for (const email of emails) {
    // Create a follow-up email
    await prisma.outreachEmail.create({
      data: {
        campaignId: email.campaignId,
        contactId: email.contactId,
        subject: `Re: ${email.subject}`,
        body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<p>Bonjour ${email.contact.name},</p>
<p>Je me permets de revenir vers vous concernant mon précédent message au sujet d'AlerteMedicaments.</p>
<p>Avec plus de 3 700 ruptures de médicaments signalées chaque année, nous pensons que notre outil gratuit pourrait réellement aider ${email.contact.type === 'PHARMACY' ? 'vos patients' : email.contact.type === 'ASSOCIATION' ? 'vos adhérents' : 'vos lecteurs'}.</p>
<p>Auriez-vous quelques minutes pour en discuter ?</p>
<p>Bien cordialement,<br>L'équipe AlerteMedicaments</p>
</div>`,
        status: 'APPROVED',
      },
    });
    count++;
  }

  return count;
}
