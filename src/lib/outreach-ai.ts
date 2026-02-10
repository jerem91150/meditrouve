import { prisma } from './prisma';

// Types
interface OutreachContact {
  id: string;
  name: string;
  email: string;
  type: 'PHARMACY' | 'ASSOCIATION' | 'PRESS' | 'OTHER';
  location?: string | null;
  specialty?: string | null;
  notes?: string | null;
}

interface OutreachCampaign {
  id: string;
  name: string;
  type: string;
  template: string;
  subject?: string | null;
}

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:14b';

// ─── Fetch real BDPM shortage data ───────────────────────────────────

async function getActiveShortages(location?: string | null): Promise<string> {
  try {
    // Try to get from our DB first (from ANSM scraper)
    const shortages = await prisma.medication.findMany({
      where: {
        status: { in: ['RUPTURE', 'TENSION'] },
      },
      select: {
        name: true,
        status: true,
        laboratory: true,
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
    });

    if (shortages.length > 0) {
      return shortages
        .map((s: { name: string; status: string; laboratory: string | null }) =>
          `- ${s.name} (${s.status})${s.laboratory ? ` — ${s.laboratory}` : ''}`
        )
        .join('\n');
    }
    return 'Doliprane 500mg, Amoxicilline 1g, Ozempic 0.5mg, Ventoline spray (données ANSM récentes)';
  } catch {
    return 'Doliprane 500mg, Amoxicilline 1g, Ozempic 0.5mg, Ventoline spray (données ANSM récentes)';
  }
}

// ─── Ollama call ─────────────────────────────────────────────────────

async function callOllama(prompt: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2000,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    return data.response?.trim() || null;
  } catch {
    console.warn('[outreach-ai] Ollama unreachable, using fallback');
    return null;
  }
}

// ─── Build prompt per contact type ───────────────────────────────────

function buildPrompt(
  contact: OutreachContact,
  campaign: OutreachCampaign,
  template: string,
  shortages: string
): string {
  const base = `Tu es un expert en communication santé pour AlerteMedicaments (alertemedicaments.fr), une application française gratuite de suivi des ruptures de médicaments.

Personnalise le mail ci-dessous pour le destinataire. Le mail doit être professionnel, chaleureux et convaincant. Garde la structure HTML du template mais adapte le contenu.

IMPORTANT: Retourne UNIQUEMENT le corps HTML du mail personnalisé. Pas de commentaire, pas d'explication. Ne mets pas de balises \`\`\`html.`;

  const contactInfo = `
Destinataire: ${contact.name}
Email: ${contact.email}
Type: ${contact.type}
${contact.location ? `Localisation: ${contact.location}` : ''}
${contact.specialty ? `Spécialité/Pathologie: ${contact.specialty}` : ''}
${contact.notes ? `Notes: ${contact.notes}` : ''}`;

  let typeInstructions = '';

  switch (contact.type) {
    case 'PHARMACY':
      typeInstructions = `
INSTRUCTIONS SPÉCIFIQUES PHARMACIE:
- Ton professionnel mais direct, entre confrères du monde de la santé
- Mentionne les ruptures actuelles qui impactent leur quotidien:
${shortages}
${contact.location ? `- Personnalise en mentionnant leur département/ville (${contact.location})` : ''}
- Mets en avant le gain de temps pour l'équipe officinale
- Propose le kit officine (QR code, affiches, flyers)
- Mentionne les 3 mois Premium offerts`;
      break;

    case 'ASSOCIATION':
      typeInstructions = `
INSTRUCTIONS SPÉCIFIQUES ASSOCIATION:
- Ton empathique et engagé, orienté mission commune
${contact.specialty ? `- L'association est liée à: ${contact.specialty} — mentionne les médicaments en rupture pour cette pathologie` : ''}
- Ruptures en cours pertinentes:
${shortages}
- Mets en avant l'impact pour les adhérents/patients
- Propose le partenariat (relais newsletter, accès Premium gratuit)
- Insiste sur le fait que c'est gratuit et sans engagement`;
      break;

    case 'PRESS':
      typeInstructions = `
INSTRUCTIONS SPÉCIFIQUES PRESSE:
- Ton informatif et factuel, avec des chiffres
${contact.specialty ? `- Média/Rubrique: ${contact.specialty} — adapte l'angle éditorial` : ''}
- Données actuelles:
${shortages}
- Propose des angles exclusifs (data, témoignages, interview)
- Chiffres clés: 3732 ruptures en 2023 (ANSM), 1 Français sur 4 touché, +60% depuis 2018
- Mets en avant la nouveauté et l'angle "solution concrète"`;
      break;

    default:
      typeInstructions = `
- Adapte le ton au destinataire
- Ruptures en cours: ${shortages}
- Mets en avant la gratuité et l'utilité de l'outil`;
  }

  return `${base}

${contactInfo}

${typeInstructions}

TEMPLATE DE BASE À PERSONNALISER:
---
${template}
---

Retourne UNIQUEMENT le HTML du mail personnalisé.`;
}

// ─── Static fallback ─────────────────────────────────────────────────

function staticFallback(
  contact: OutreachContact,
  template: string,
  subject: string
): { subject: string; body: string } {
  // Simple replacement-based personalization
  let body = template
    .replace(/\[Nom\]/g, contact.name)
    .replace(/\[nom de l'association\]/gi, contact.name)
    .replace(/\[Prénom Nom\]/g, 'Jérémy Porteron')
    .replace(/\[email\]/g, 'contact@alertemedicaments.fr')
    .replace(/\[téléphone\]/g, '')
    .replace(/\[date\]/g, new Date().toLocaleDateString('fr-FR'));

  // Wrap in basic HTML if not already HTML
  if (!body.includes('<')) {
    body = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
${body.split('\n').map(line => {
  if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
  if (line.startsWith('## ')) return `<h2>${line.slice(2)}</h2>`;
  if (line.startsWith('**') && line.endsWith('**')) return `<p><strong>${line.slice(2, -2)}</strong></p>`;
  if (line.startsWith('- ') || line.startsWith('✅')) return `<li>${line.replace(/^[-✅] /, '')}</li>`;
  if (line.trim() === '') return '<br>';
  return `<p>${line}</p>`;
}).join('\n')}
</div>`;
  }

  let personalizedSubject = subject;
  if (contact.type === 'PHARMACY' && contact.location) {
    personalizedSubject = `${subject} — ${contact.location}`;
  }

  return { subject: personalizedSubject, body };
}

// ─── Main export ─────────────────────────────────────────────────────

export async function personalizeEmail(
  contact: OutreachContact,
  campaign: OutreachCampaign,
  template: string
): Promise<{ subject: string; body: string }> {
  const subject = campaign.subject || 'AlerteMedicaments — Partenariat';
  const shortages = await getActiveShortages(contact.location);

  const prompt = buildPrompt(contact, campaign, template, shortages);
  const aiBody = await callOllama(prompt);

  if (aiBody && aiBody.length > 100) {
    // Also personalize subject
    const subjectPrompt = `Génère un objet de mail personnalisé et accrocheur pour: ${contact.name} (${contact.type}${contact.specialty ? `, ${contact.specialty}` : ''}).
Contexte: outreach pour AlerteMedicaments, app de suivi des ruptures de médicaments.
Objet de base: "${subject}"
Retourne UNIQUEMENT l'objet, rien d'autre. Max 80 caractères.`;

    const aiSubject = await callOllama(subjectPrompt);
    const finalSubject = aiSubject && aiSubject.length > 10 && aiSubject.length < 120
      ? aiSubject.replace(/^["']|["']$/g, '')
      : subject;

    return { subject: finalSubject, body: aiBody };
  }

  // Fallback
  return staticFallback(contact, template, subject);
}

// ─── Batch generation ────────────────────────────────────────────────

export async function generateCampaignEmails(campaignId: string): Promise<number> {
  const campaign = await prisma.outreachCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) throw new Error('Campaign not found');

  const contacts = await prisma.outreachContact.findMany({
    where: {
      type: campaign.type,
      status: 'ACTIVE',
    },
  });

  let generated = 0;

  for (const contact of contacts) {
    // Skip if email already exists for this campaign+contact
    const existing = await prisma.outreachEmail.findFirst({
      where: { campaignId, contactId: contact.id },
    });
    if (existing) continue;

    try {
      const { subject, body } = await personalizeEmail(contact, campaign, campaign.template);

      await prisma.outreachEmail.create({
        data: {
          campaignId,
          contactId: contact.id,
          subject,
          body,
          status: campaign.mode === 'AUTO' ? 'APPROVED' : 'DRAFT',
        },
      });

      generated++;
    } catch (err) {
      console.error(`[outreach-ai] Failed for contact ${contact.id}:`, err);
    }
  }

  // Update campaign status
  await prisma.outreachCampaign.update({
    where: { id: campaignId },
    data: { status: 'RUNNING' },
  });

  return generated;
}
