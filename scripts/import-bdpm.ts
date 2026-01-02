import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const iconv = require('iconv-lite');

const prisma = new PrismaClient();

interface Medication {
  cisCode: string;
  name: string;
  form: string;
  route: string;
  laboratory: string;
  status: 'AVAILABLE' | 'TENSION' | 'RUPTURE';
  activeIngredient?: string;
  isMITM: boolean;
}

interface Shortage {
  cisCode: string;
  level: number;
  status: string;
  startDate: string;
  endDate: string;
}

interface Composition {
  cisCode: string;
  substance: string;
  dosage: string;
}

function parseFile(filename: string): string[] {
  const filepath = path.join(__dirname, '..', 'data', filename);
  const buffer = fs.readFileSync(filepath);
  const content = iconv.decode(buffer, 'latin1') as string;
  return content.split('\n').filter((line: string) => line.trim());
}

function parseMedications(): Map<string, Medication> {
  console.log('Parsing medications...');
  const lines = parseFile('CIS_bdpm.txt');
  const medications = new Map<string, Medication>();

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 11) continue;

    const cisCode = parts[0].trim();
    const name = parts[1].trim();
    const form = parts[2].trim();
    const route = parts[3].trim();
    const laboratory = parts[10].trim();

    medications.set(cisCode, {
      cisCode,
      name,
      form,
      route,
      laboratory,
      status: 'AVAILABLE',
      isMITM: false,
    });
  }

  console.log(`  Found ${medications.size} medications`);
  return medications;
}

function parseCompositions(): Map<string, string> {
  console.log('Parsing compositions...');
  const lines = parseFile('CIS_COMPO_bdpm.txt');
  const compositions = new Map<string, string>();

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 7) continue;

    const cisCode = parts[0].trim();
    const substance = parts[3].trim();
    const nature = parts[6].trim();

    // Only get active substances (SA)
    if (nature === 'SA' && !compositions.has(cisCode)) {
      compositions.set(cisCode, substance);
    }
  }

  console.log(`  Found ${compositions.size} compositions`);
  return compositions;
}

function parseShortages(): Map<string, Shortage> {
  console.log('Parsing shortages...');
  const lines = parseFile('CIS_CIP_Dispo_Spec.txt');
  const shortages = new Map<string, Shortage>();

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 5) continue;

    const cisCode = parts[0].trim();
    const level = parseInt(parts[2]) || 0;
    const status = parts[3].trim().toLowerCase();
    const startDate = parts[4].trim();
    const endDate = parts[5]?.trim() || '';

    shortages.set(cisCode, {
      cisCode,
      level,
      status,
      startDate,
      endDate,
    });
  }

  console.log(`  Found ${shortages.size} shortages`);
  return shortages;
}

async function importToDatabase(
  medications: Map<string, Medication>,
  compositions: Map<string, string>,
  shortages: Map<string, Shortage>
) {
  console.log('\nImporting to database...');

  // Clear existing demo medications
  await prisma.medication.deleteMany({
    where: {
      cisCode: {
        startsWith: 'DEMO',
      },
    },
  });
  console.log('  Cleared demo medications');

  let imported = 0;
  let updated = 0;
  const batchSize = 500;
  const medicationArray = Array.from(medications.values());

  for (let i = 0; i < medicationArray.length; i += batchSize) {
    const batch = medicationArray.slice(i, i + batchSize);

    for (const med of batch) {
      // Get active ingredient
      const activeIngredient = compositions.get(med.cisCode);

      // Get shortage status
      const shortage = shortages.get(med.cisCode);
      let status: 'AVAILABLE' | 'TENSION' | 'RUPTURE' = 'AVAILABLE';

      if (shortage) {
        if (shortage.status.includes('rupture')) {
          status = 'RUPTURE';
        } else if (shortage.status.includes('tension')) {
          status = 'TENSION';
        }
      }

      try {
        const existing = await prisma.medication.findUnique({
          where: { cisCode: med.cisCode },
        });

        if (existing) {
          await prisma.medication.update({
            where: { cisCode: med.cisCode },
            data: {
              name: med.name,
              form: med.form,
              laboratory: med.laboratory,
              activeIngredient: activeIngredient || existing.activeIngredient,
              status,
              lastChecked: new Date(),
            },
          });
          updated++;
        } else {
          await prisma.medication.create({
            data: {
              cisCode: med.cisCode,
              name: med.name,
              form: med.form,
              laboratory: med.laboratory,
              activeIngredient,
              status,
              lastChecked: new Date(),
            },
          });
          imported++;
        }
      } catch (error) {
        // Skip duplicates or errors
      }
    }

    const progress = Math.min(i + batchSize, medicationArray.length);
    const percent = Math.round((progress / medicationArray.length) * 100);
    process.stdout.write(`\r  Progress: ${progress}/${medicationArray.length} (${percent}%)`);
  }

  console.log(`\n\nImport complete!`);
  console.log(`  Created: ${imported}`);
  console.log(`  Updated: ${updated}`);

  // Count by status
  const counts = await prisma.medication.groupBy({
    by: ['status'],
    _count: true,
  });

  console.log('\nMedication counts by status:');
  for (const count of counts) {
    console.log(`  ${count.status}: ${count._count}`);
  }
}

async function main() {
  console.log('=================================');
  console.log('BDPM Database Import');
  console.log('=================================\n');

  const medications = parseMedications();
  const compositions = parseCompositions();
  const shortages = parseShortages();

  await importToDatabase(medications, compositions, shortages);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
