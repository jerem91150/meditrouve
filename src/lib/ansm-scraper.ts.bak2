import * as fs from "fs";
import * as path from "path";
import prisma from "./prisma";

// BDPM data directory (local open data files)
const DATA_DIR = path.join(process.cwd(), "data");

interface BDPMMedication {
  cisCode: string;
  name: string;
  form?: string;
  route?: string;
  status?: string;
  laboratory?: string;
}

interface ShortageInfo {
  cisCode: string;
  level: number;
  statusText: string;
  startDate: string;
  endDate: string;
  url?: string;
}

function log(msg: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
  const ts = new Date().toISOString();
  const prefix = { INFO: 'ℹ', WARN: '⚠', ERROR: '✗' }[level];
  console.log(`[${ts}] ${prefix} [ANSM-SCRAPER] ${msg}`);
}

// Parse CIS_bdpm.txt - Main medications database
function parseCISFile(content: string): Map<string, BDPMMedication> {
  const medications = new Map<string, BDPMMedication>();
  const lines = content.split("\n");
  let parsed = 0;
  let skipped = 0;

  for (const line of lines) {
    // Skip empty lines and whitespace-only lines
    if (!line.trim()) continue;

    try {
      const parts = line.split("\t");
      if (parts.length < 2) {
        skipped++;
        continue;
      }

      const cisCode = parts[0]?.trim();
      const name = parts[1]?.trim();

      // Validate required fields
      if (!cisCode || !name) {
        skipped++;
        continue;
      }

      // Validate CIS code format (should be numeric, typically 8 digits)
      if (!/^\d+$/.test(cisCode)) {
        skipped++;
        continue;
      }

      const form = parts[2]?.trim() || undefined;
      const route = parts[3]?.trim() || undefined;
      const status = parts[4]?.trim() || undefined;
      const laboratory = parts[10]?.trim() || undefined;

      medications.set(cisCode, { cisCode, name, form, route, status, laboratory });
      parsed++;
    } catch (err) {
      skipped++;
      log(`Erreur parsing ligne CIS: ${err}`, 'WARN');
    }
  }

  log(`CIS_bdpm.txt: ${parsed} médicaments parsés, ${skipped} lignes ignorées`);
  return medications;
}

// Parse CIS_CIP_Dispo_Spec.txt - Shortages/tensions
function parseShortagesFile(content: string): Map<string, ShortageInfo> {
  const shortages = new Map<string, ShortageInfo>();
  const lines = content.split("\n");
  let parsed = 0;
  let skipped = 0;

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const parts = line.split("\t");
      if (parts.length < 4) {
        skipped++;
        continue;
      }

      const cisCode = parts[0]?.trim();
      if (!cisCode || !/^\d+$/.test(cisCode)) {
        skipped++;
        continue;
      }

      const level = parseInt(parts[2]) || 0;
      const statusText = (parts[3]?.trim() || '').toLowerCase();
      const startDate = parts[4]?.trim() || "";
      const endDate = parts[5]?.trim() || "";
      const url = parts[7]?.trim() || undefined;

      shortages.set(cisCode, { cisCode, level, statusText, startDate, endDate, url });
      parsed++;
    } catch (err) {
      skipped++;
      log(`Erreur parsing ligne shortage: ${err}`, 'WARN');
    }
  }

  log(`CIS_CIP_Dispo_Spec.txt: ${parsed} entrées parsées, ${skipped} lignes ignorées`);
  return shortages;
}

// Read a local BDPM file with latin1 encoding
function readBDPMFile(filename: string): string {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier BDPM introuvable: ${filePath}. Lancez d'abord: npx tsx scripts/update-bdpm.ts`);
  }
  log(`Lecture de ${filename}...`);
  const content = fs.readFileSync(filePath, "latin1");
  const lineCount = content.split('\n').filter(l => l.trim()).length;
  log(`${filename}: ${lineCount} lignes, ${(Buffer.byteLength(content, 'latin1') / 1024).toFixed(1)} Ko`);
  return content;
}

// Determine medication status from shortage info
function getStatus(info: ShortageInfo): "RUPTURE" | "TENSION" {
  if (info.statusText.includes("rupture")) {
    return "RUPTURE";
  }
  return "TENSION";
}

export async function syncMedications(): Promise<{
  updated: number;
  created: number;
  errors: string[];
}> {
  log('=== Début de la synchronisation BDPM ===');

  let log_id: string | undefined;
  const errors: string[] = [];
  let updated = 0;
  let created = 0;

  try {
    const logEntry = await prisma.syncLog.create({
      data: { startedAt: new Date() },
    });
    log_id = logEntry.id;
  } catch (err) {
    log(`Impossible de créer le syncLog: ${err}`, 'WARN');
  }

  try {
    // Read local BDPM files
    const cisContent = readBDPMFile("CIS_bdpm.txt");
    const shortagesContent = readBDPMFile("CIS_CIP_Dispo_Spec.txt");

    const allMedications = parseCISFile(cisContent);
    const shortages = parseShortagesFile(shortagesContent);

    log(`Données chargées: ${allMedications.size} médicaments, ${shortages.size} ruptures/tensions`);

    const processedCodes = new Set<string>();

    // Process shortages (ruptures + tensions)
    for (const [cisCode, info] of shortages) {
      if (processedCodes.has(cisCode)) continue;
      processedCodes.add(cisCode);

      const medInfo = allMedications.get(cisCode);
      const name = medInfo?.name || `Médicament CIS ${cisCode}`;
      const laboratory = medInfo?.laboratory;
      const newStatus = getStatus(info);

      try {
        const existing = await prisma.medication.findUnique({
          where: { cisCode },
        });

        if (existing) {
          if (existing.status !== newStatus) {
            log(`Changement de statut: ${name} (${cisCode}) ${existing.status} → ${newStatus}`);
            await prisma.statusHistory.create({
              data: {
                medicationId: existing.id,
                status: newStatus,
                source: "BDPM",
                details: info.statusText,
              },
            });
          }

          await prisma.medication.update({
            where: { cisCode },
            data: {
              name,
              laboratory,
              status: newStatus,
              lastChecked: new Date(),
            },
          });
          updated++;
        } else {
          log(`Nouveau médicament en ${newStatus}: ${name} (${cisCode})`);
          const newMed = await prisma.medication.create({
            data: {
              cisCode,
              name,
              laboratory,
              status: newStatus,
              lastChecked: new Date(),
            },
          });

          await prisma.statusHistory.create({
            data: {
              medicationId: newMed.id,
              status: newStatus,
              source: "BDPM",
            },
          });
          created++;
        }
      } catch (err) {
        const msg = `Erreur traitement ${cisCode} (${name}): ${err}`;
        errors.push(msg);
        log(msg, 'ERROR');
      }
    }

    // Mark medications not in shortage lists as AVAILABLE
    const shortageCodes = Array.from(shortages.keys());
    try {
      const result = await prisma.medication.updateMany({
        where: {
          cisCode: { notIn: shortageCodes },
          status: { not: "AVAILABLE" },
        },
        data: { status: "AVAILABLE", lastChecked: new Date() },
      });
      if (result.count > 0) {
        log(`${result.count} médicament(s) repassé(s) en AVAILABLE`);
      }
    } catch (err) {
      const msg = `Erreur mise à jour AVAILABLE: ${err}`;
      errors.push(msg);
      log(msg, 'ERROR');
    }

    if (log_id) {
      await prisma.syncLog.update({
        where: { id: log_id },
        data: {
          completedAt: new Date(),
          medicationsUpdated: updated,
          newMedications: created,
          errors,
          success: true,
        },
      }).catch(err => log(`Erreur mise à jour syncLog: ${err}`, 'WARN'));
    }
  } catch (err) {
    const msg = `Sync échouée: ${err}`;
    errors.push(msg);
    log(msg, 'ERROR');

    if (log_id) {
      await prisma.syncLog.update({
        where: { id: log_id },
        data: {
          completedAt: new Date(),
          errors,
          success: false,
        },
      }).catch(e => log(`Erreur mise à jour syncLog: ${e}`, 'WARN'));
    }
  }

  log(`=== Sync terminée: ${created} créés, ${updated} mis à jour, ${errors.length} erreurs ===`);
  return { updated, created, errors };
}

// Demo medications for when database is not available
const DEMO_MEDICATIONS = [
  { id: "1", cisCode: "60001234", name: "OZEMPIC 0,25 mg", laboratory: "NOVO NORDISK", status: "RUPTURE", activeIngredient: "Semaglutide", lastChecked: new Date().toISOString() },
  { id: "2", cisCode: "60001235", name: "OZEMPIC 0,5 mg", laboratory: "NOVO NORDISK", status: "RUPTURE", activeIngredient: "Semaglutide", lastChecked: new Date().toISOString() },
  { id: "3", cisCode: "60001236", name: "OZEMPIC 1 mg", laboratory: "NOVO NORDISK", status: "TENSION", activeIngredient: "Semaglutide", lastChecked: new Date().toISOString() },
  { id: "4", cisCode: "60002001", name: "DOLIPRANE 500 mg", laboratory: "SANOFI", status: "AVAILABLE", activeIngredient: "Paracetamol", lastChecked: new Date().toISOString() },
  { id: "5", cisCode: "60002002", name: "DOLIPRANE 1000 mg", laboratory: "SANOFI", status: "AVAILABLE", activeIngredient: "Paracetamol", lastChecked: new Date().toISOString() },
  { id: "6", cisCode: "60003001", name: "AMOXICILLINE BIOGARAN 500 mg", laboratory: "BIOGARAN", status: "TENSION", activeIngredient: "Amoxicilline", lastChecked: new Date().toISOString() },
  { id: "7", cisCode: "60003002", name: "AMOXICILLINE SANDOZ 1g", laboratory: "SANDOZ", status: "AVAILABLE", activeIngredient: "Amoxicilline", lastChecked: new Date().toISOString() },
  { id: "8", cisCode: "60004001", name: "IBUPROFENE MYLAN 400 mg", laboratory: "MYLAN", status: "AVAILABLE", activeIngredient: "Ibuprofene", lastChecked: new Date().toISOString() },
  { id: "9", cisCode: "60005001", name: "VENTOLINE 100 mcg", laboratory: "GLAXOSMITHKLINE", status: "TENSION", activeIngredient: "Salbutamol", lastChecked: new Date().toISOString() },
  { id: "10", cisCode: "60006001", name: "LEVOTHYROX 75 mcg", laboratory: "MERCK", status: "RUPTURE", activeIngredient: "Levothyroxine", lastChecked: new Date().toISOString() },
  { id: "11", cisCode: "60006002", name: "LEVOTHYROX 100 mcg", laboratory: "MERCK", status: "TENSION", activeIngredient: "Levothyroxine", lastChecked: new Date().toISOString() },
  { id: "12", cisCode: "60007001", name: "MOUNJARO 2,5 mg", laboratory: "ELI LILLY", status: "RUPTURE", activeIngredient: "Tirzepatide", lastChecked: new Date().toISOString() },
  { id: "13", cisCode: "60008001", name: "WEGOVY 0,25 mg", laboratory: "NOVO NORDISK", status: "RUPTURE", activeIngredient: "Semaglutide", lastChecked: new Date().toISOString() },
];

export async function searchMedications(query: string, userId?: string) {
  try {
    const medications = await prisma.medication.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { activeIngredient: { contains: query, mode: "insensitive" } },
          { cisCode: { contains: query } },
        ],
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      take: 50,
    });

    if (userId) {
      await prisma.searchHistory
        .create({
          data: { userId, query, results: medications.length },
        })
        .catch((err) => {
          log(`Erreur sauvegarde historique recherche: ${err}`, 'WARN');
        });
    }

    log(`Recherche "${query}": ${medications.length} résultats`);
    return medications;
  } catch (error) {
    log(`Base de données indisponible, utilisation des données démo: ${error}`, 'WARN');
    const lowerQuery = query.toLowerCase();
    return DEMO_MEDICATIONS.filter(
      (med) =>
        med.name.toLowerCase().includes(lowerQuery) ||
        med.activeIngredient.toLowerCase().includes(lowerQuery) ||
        med.cisCode.includes(query)
    );
  }
}
