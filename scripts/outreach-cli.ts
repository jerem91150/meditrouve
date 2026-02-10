#!/usr/bin/env ts-node
/**
 * AlerteMedicaments Outreach CLI
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/outreach-cli.ts <command> [options]
 *
 * Commands:
 *   import    --csv <file>              Import contacts from CSV
 *   generate  --campaign <name|id>      Generate AI-personalized emails
 *   preview   --campaign <name|id>      Preview generated emails
 *   send      --campaign <name|id>      Send approved emails
 *   stats     --campaign <name|id>      Show campaign stats
 *   contacts  [--type PHARMACY|...]     List contacts
 *   create    --name <n> --type <t> --template <file>  Create campaign
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

const command = process.argv[2];

// ─── Colors ──────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// ─── Find campaign by name or ID ─────────────────────────────────────

async function findCampaign(nameOrId: string) {
  let campaign = await prisma.outreachCampaign.findUnique({ where: { id: nameOrId } });
  if (!campaign) {
    campaign = await prisma.outreachCampaign.findFirst({
      where: { name: { contains: nameOrId, mode: 'insensitive' } },
    });
  }
  if (!campaign) {
    console.error(`${c.red}Campaign not found: ${nameOrId}${c.reset}`);
    process.exit(1);
  }
  return campaign;
}

// ─── Import CSV ──────────────────────────────────────────────────────

async function importCSV() {
  const csvPath = arg('csv');
  if (!csvPath) { console.error('Usage: import --csv <file>'); process.exit(1); }

  const text = fs.readFileSync(path.resolve(csvPath), 'utf-8');
  const lines = text.trim().split('\n');
  const header = lines[0].toLowerCase().split(',').map(h => h.trim());

  const nameIdx = header.findIndex(h => ['name', 'nom'].includes(h));
  const emailIdx = header.findIndex(h => ['email', 'e-mail', 'mail'].includes(h));
  const typeIdx = header.findIndex(h => ['type', 'catégorie', 'categorie'].includes(h));
  const locationIdx = header.findIndex(h => ['location', 'localisation', 'ville', 'département'].includes(h));
  const specialtyIdx = header.findIndex(h => ['specialty', 'spécialité', 'specialite', 'pathologie'].includes(h));
  const notesIdx = header.findIndex(h => ['notes', 'commentaire'].includes(h));

  if (nameIdx === -1 || emailIdx === -1) {
    console.error(`${c.red}CSV must have 'name' and 'email' columns${c.reset}`);
    process.exit(1);
  }

  let imported = 0, skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(col => col.trim().replace(/^"|"$/g, ''));
    const email = cols[emailIdx];
    if (!email?.includes('@')) { skipped++; continue; }

    const typeMap: Record<string, string> = {
      pharmacy: 'PHARMACY', pharmacie: 'PHARMACY',
      association: 'ASSOCIATION', asso: 'ASSOCIATION',
      press: 'PRESS', presse: 'PRESS', media: 'PRESS',
    };
    const rawType = typeIdx >= 0 ? cols[typeIdx]?.toLowerCase() : '';
    const type = typeMap[rawType] || 'OTHER';

    try {
      await prisma.outreachContact.upsert({
        where: { email },
        create: {
          name: cols[nameIdx] || email.split('@')[0],
          email,
          type: type as any,
          location: locationIdx >= 0 ? cols[locationIdx] || null : null,
          specialty: specialtyIdx >= 0 ? cols[specialtyIdx] || null : null,
          notes: notesIdx >= 0 ? cols[notesIdx] || null : null,
        },
        update: { name: cols[nameIdx] || undefined },
      });
      imported++;
      process.stdout.write(`${c.green}+${c.reset}`);
    } catch {
      skipped++;
      process.stdout.write(`${c.red}x${c.reset}`);
    }
  }

  console.log(`\n\n${c.bold}Import terminé:${c.reset} ${c.green}${imported} ajoutés${c.reset}, ${c.yellow}${skipped} ignorés${c.reset}`);
}

// ─── Generate Emails ─────────────────────────────────────────────────

async function generate() {
  const campaignName = arg('campaign');
  if (!campaignName) { console.error('Usage: generate --campaign <name|id>'); process.exit(1); }

  const campaign = await findCampaign(campaignName);
  console.log(`${c.bold}🤖 Génération IA pour: ${campaign.name}${c.reset}`);
  console.log(`${c.dim}Type: ${campaign.type} | Mode: ${campaign.mode}${c.reset}\n`);

  const contacts = await prisma.outreachContact.findMany({
    where: { type: campaign.type as any, status: 'ACTIVE' },
  });

  console.log(`${c.cyan}${contacts.length} contacts trouvés${c.reset}\n`);

  // Dynamic import of outreach-ai
  const { personalizeEmail } = await import('../src/lib/outreach-ai');

  let generated = 0;
  for (const contact of contacts) {
    const existing = await prisma.outreachEmail.findFirst({
      where: { campaignId: campaign.id, contactId: contact.id },
    });
    if (existing) {
      console.log(`${c.dim}  ⏭️  ${contact.name} (déjà généré)${c.reset}`);
      continue;
    }

    process.stdout.write(`  🤖 ${contact.name}...`);
    try {
      const { subject, body } = await personalizeEmail(contact as any, campaign as any, campaign.template);
      await prisma.outreachEmail.create({
        data: {
          campaignId: campaign.id,
          contactId: contact.id,
          subject,
          body,
          status: campaign.mode === 'AUTO' ? 'APPROVED' : 'DRAFT',
        },
      });
      console.log(` ${c.green}✓${c.reset} (${subject.substring(0, 50)}...)`);
      generated++;
    } catch (err) {
      console.log(` ${c.red}✗ ${err}${c.reset}`);
    }
  }

  console.log(`\n${c.bold}${c.green}${generated} emails générés${c.reset}`);
}

// ─── Preview ─────────────────────────────────────────────────────────

async function preview() {
  const campaignName = arg('campaign');
  if (!campaignName) { console.error('Usage: preview --campaign <name|id>'); process.exit(1); }

  const campaign = await findCampaign(campaignName);
  const emails = await prisma.outreachEmail.findMany({
    where: { campaignId: campaign.id },
    include: { contact: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`${c.bold}📧 ${campaign.name} — ${emails.length} emails${c.reset}\n`);

  for (const email of emails) {
    const statusIcon: Record<string, string> = {
      DRAFT: '📝', APPROVED: '✅', SENT: '📤', OPENED: '📬', REPLIED: '💬', REJECTED: '❌',
    };
    console.log(`${c.bold}${statusIcon[email.status] || '❓'} ${email.contact.name}${c.reset} <${email.contact.email}>`);
    console.log(`   ${c.cyan}Objet:${c.reset} ${email.subject}`);
    console.log(`   ${c.dim}Statut: ${email.status}${email.sentAt ? ` | Envoyé: ${new Date(email.sentAt).toLocaleDateString('fr-FR')}` : ''}${email.openedAt ? ' | 📬 Ouvert' : ''}${c.reset}`);

    if (flag('full')) {
      // Strip HTML and show text
      const text = email.body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      console.log(`   ${c.dim}${text.substring(0, 200)}...${c.reset}`);
    }
    console.log();
  }
}

// ─── Send ────────────────────────────────────────────────────────────

async function send() {
  const campaignName = arg('campaign');
  if (!campaignName) { console.error('Usage: send --campaign <name|id>'); process.exit(1); }

  const campaign = await findCampaign(campaignName);
  const emails = await prisma.outreachEmail.findMany({
    where: { campaignId: campaign.id, status: 'APPROVED' },
    include: { contact: true },
  });

  console.log(`${c.bold}📤 Envoi de ${emails.length} emails pour: ${campaign.name}${c.reset}\n`);

  if (emails.length === 0) {
    console.log(`${c.yellow}Aucun email approuvé à envoyer.${c.reset}`);
    console.log(`Utilisez d'abord: generate --campaign ${campaignName}`);
    return;
  }

  if (!flag('confirm')) {
    console.log(`${c.yellow}⚠️  Ajoutez --confirm pour envoyer réellement${c.reset}`);
    console.log('Emails prêts:');
    for (const e of emails) {
      console.log(`  → ${e.contact.name} <${e.contact.email}>`);
    }
    return;
  }

  const { sendOutreachEmail } = await import('../src/lib/outreach-sender');

  let sent = 0, failed = 0;
  for (const email of emails) {
    process.stdout.write(`  📤 ${email.contact.name}...`);
    try {
      const ok = await sendOutreachEmail(email.id);
      if (ok) {
        console.log(` ${c.green}✓${c.reset}`);
        sent++;
      } else {
        console.log(` ${c.yellow}⏭️${c.reset}`);
      }
    } catch {
      console.log(` ${c.red}✗${c.reset}`);
      failed++;
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n${c.bold}Résultat: ${c.green}${sent} envoyés${c.reset}, ${c.red}${failed} échoués${c.reset}`);
}

// ─── Stats ───────────────────────────────────────────────────────────

async function stats() {
  const campaignName = arg('campaign');
  if (!campaignName) { console.error('Usage: stats --campaign <name|id>'); process.exit(1); }

  const campaign = await findCampaign(campaignName);
  const statusCounts = await prisma.outreachEmail.groupBy({
    by: ['status'],
    where: { campaignId: campaign.id },
    _count: true,
  });

  const total = statusCounts.reduce((a, b) => a + b._count, 0);
  const get = (s: string) => statusCounts.find(x => x.status === s)?._count || 0;
  const sentTotal = get('SENT') + get('OPENED') + get('REPLIED');

  console.log(`\n${c.bold}📊 Stats: ${campaign.name}${c.reset}`);
  console.log(`${'─'.repeat(40)}`);
  console.log(`  Total:      ${total}`);
  console.log(`  Brouillons: ${get('DRAFT')}`);
  console.log(`  Approuvés:  ${get('APPROVED')}`);
  console.log(`  Envoyés:    ${c.green}${sentTotal}${c.reset}`);
  console.log(`  Ouverts:    ${c.cyan}${get('OPENED') + get('REPLIED')}${c.reset}`);
  console.log(`  Réponses:   ${c.magenta}${get('REPLIED')}${c.reset}`);
  console.log(`${'─'.repeat(40)}`);
  if (sentTotal > 0) {
    console.log(`  Taux ouverture: ${c.bold}${((get('OPENED') + get('REPLIED')) / sentTotal * 100).toFixed(1)}%${c.reset}`);
    console.log(`  Taux réponse:   ${c.bold}${(get('REPLIED') / sentTotal * 100).toFixed(1)}%${c.reset}`);
  }
  console.log();
}

// ─── Contacts ────────────────────────────────────────────────────────

async function listContacts() {
  const type = arg('type');
  const where: any = { status: 'ACTIVE' };
  if (type) where.type = type.toUpperCase();

  const contacts = await prisma.outreachContact.findMany({ where, orderBy: { type: 'asc' } });

  console.log(`\n${c.bold}👥 ${contacts.length} contacts${type ? ` (${type})` : ''}${c.reset}\n`);
  for (const ct of contacts) {
    const emoji: Record<string, string> = { PHARMACY: '🏥', ASSOCIATION: '🤝', PRESS: '📰', OTHER: '📋' };
    console.log(`  ${emoji[ct.type] || '📋'} ${c.bold}${ct.name}${c.reset} <${ct.email}>${ct.location ? ` [${ct.location}]` : ''}${ct.specialty ? ` (${ct.specialty})` : ''}`);
  }
  console.log();
}

// ─── Create Campaign ─────────────────────────────────────────────────

async function createCampaign() {
  const name = arg('name');
  const type = arg('type');
  const templateFile = arg('template');
  const mode = arg('mode') || 'SEMI_AUTO';
  const subject = arg('subject');

  if (!name || !type || !templateFile) {
    console.error('Usage: create --name <name> --type <PHARMACY|ASSOCIATION|PRESS> --template <file> [--mode AUTO|SEMI_AUTO] [--subject <s>]');
    process.exit(1);
  }

  const template = fs.readFileSync(path.resolve(templateFile), 'utf-8');
  const campaign = await prisma.outreachCampaign.create({
    data: {
      name,
      type: type.toUpperCase() as any,
      mode: mode.toUpperCase() as any,
      template,
      subject: subject || `AlerteMedicaments — ${name}`,
    },
  });

  console.log(`${c.green}✓ Campagne créée: ${campaign.name} (${campaign.id})${c.reset}`);
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  switch (command) {
    case 'import': await importCSV(); break;
    case 'generate': await generate(); break;
    case 'preview': await preview(); break;
    case 'send': await send(); break;
    case 'stats': await stats(); break;
    case 'contacts': await listContacts(); break;
    case 'create': await createCampaign(); break;
    default:
      console.log(`
${c.bold}📧 AlerteMedicaments Outreach CLI${c.reset}

${c.cyan}Commands:${c.reset}
  import     --csv <file>                         Import contacts from CSV
  contacts   [--type PHARMACY|ASSOCIATION|PRESS]   List contacts
  create     --name <n> --type <t> --template <f>  Create campaign
  generate   --campaign <name|id>                  Generate AI emails
  preview    --campaign <name|id> [--full]          Preview emails
  send       --campaign <name|id> --confirm         Send emails
  stats      --campaign <name|id>                  Show stats
`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
