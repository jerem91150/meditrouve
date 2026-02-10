import { requireAdmin } from "@/lib/admin-auth";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET — List contacts with filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [contacts, total] = await Promise.all([
    prisma.outreachContact.findMany({
      where: where as never,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.outreachContact.count({ where: where as never }),
  ]);

  return NextResponse.json({ contacts, total, page, pages: Math.ceil(total / limit) });
}

// POST — Create contact or bulk import CSV
export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';

  // CSV Import
  if (contentType.includes('text/csv') || contentType.includes('multipart/form-data')) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

    const text = await req.text();
    const lines = text.trim().split('\n');
    const header = lines[0].toLowerCase().split(',').map(h => h.trim());

    const nameIdx = header.findIndex(h => ['name', 'nom'].includes(h));
    const emailIdx = header.findIndex(h => ['email', 'e-mail', 'mail'].includes(h));
    const typeIdx = header.findIndex(h => ['type', 'catégorie', 'categorie'].includes(h));
    const locationIdx = header.findIndex(h => ['location', 'localisation', 'ville', 'département'].includes(h));
    const specialtyIdx = header.findIndex(h => ['specialty', 'spécialité', 'specialite', 'pathologie'].includes(h));
    const notesIdx = header.findIndex(h => ['notes', 'commentaire'].includes(h));

    if (nameIdx === -1 || emailIdx === -1) {
      return NextResponse.json({ error: 'CSV must have name and email columns' }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const email = cols[emailIdx];
      if (!email || !email.includes('@')) { skipped++; continue; }

      const typeMap: Record<string, string> = {
        pharmacy: 'PHARMACY', pharmacie: 'PHARMACY',
        association: 'ASSOCIATION', asso: 'ASSOCIATION',
        press: 'PRESS', presse: 'PRESS', media: 'PRESS', média: 'PRESS',
      };
      const rawType = typeIdx >= 0 ? cols[typeIdx]?.toLowerCase() : '';
      const type = typeMap[rawType] || 'OTHER';

      try {
        await prisma.outreachContact.upsert({
          where: { email },
          create: {
            name: cols[nameIdx] || email.split('@')[0],
            email,
            type: type as 'PHARMACY' | 'ASSOCIATION' | 'PRESS' | 'OTHER',
            location: locationIdx >= 0 ? cols[locationIdx] || null : null,
            specialty: specialtyIdx >= 0 ? cols[specialtyIdx] || null : null,
            notes: notesIdx >= 0 ? cols[notesIdx] || null : null,
          },
          update: {
            name: cols[nameIdx] || undefined,
            type: type as 'PHARMACY' | 'ASSOCIATION' | 'PRESS' | 'OTHER',
            location: locationIdx >= 0 ? cols[locationIdx] || undefined : undefined,
            specialty: specialtyIdx >= 0 ? cols[specialtyIdx] || undefined : undefined,
          },
        });
        imported++;
      } catch {
        skipped++;
      }
    }

    return NextResponse.json({ imported, skipped, total: lines.length - 1 });
  }

  // Single contact create
  const body = await req.json();
  const { name, email, type, location, specialty, notes } = body;

  if (!name || !email) {
    return NextResponse.json({ error: 'name and email required' }, { status: 400 });
  }

  const contact = await prisma.outreachContact.create({
    data: { name, email, type: type || 'OTHER', location, specialty, notes },
  });

  return NextResponse.json(contact, { status: 201 });
}

// DELETE — Delete a contact
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  await prisma.outreachContact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PATCH — Update a contact
export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const contact = await prisma.outreachContact.update({
    where: { id },
    data,
  });
  return NextResponse.json(contact);
}
