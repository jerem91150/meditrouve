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

// Parse CIS_bdpm.txt - Main medications database
function parseCISFile(content: string): Map<string, BDPMMedication> {
  const medications = new Map<string, BDPMMedication>();
  const lines = content.split("\n").filter((line) => line.trim());

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length < 2) continue;

    const cisCode = parts[0].trim();
    const name = parts[1]?.trim() || "";
    const form = parts[2]?.trim() || undefined;
    const route = parts[3]?.trim() || undefined;
    const status = parts[4]?.trim() || undefined;
    const laboratory = parts[10]?.trim() || undefined;

    if (cisCode && name) {
      medications.set(cisCode, { cisCode, name, form, route, status, laboratory });
    }
  }

  return medications;
}

// Parse CIS_CIP_Dispo_Spec.txt - Shortages/tensions
function parseShortagesFile(content: string): Map<string, ShortageInfo> {
  const shortages = new Map<string, ShortageInfo>();
  const lines = content.split("\n").filter((line) => line.trim());

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length < 4) continue;

    const cisCode = parts[0].trim();
    const level = parseInt(parts[2]) || 0;
    const statusText = parts[3].trim().toLowerCase();
    const startDate = parts[4]?.trim() || "";
    const endDate = parts[5]?.trim() || "";
    const url = parts[7]?.trim() || undefined;

    if (cisCode) {
      shortages.set(cisCode, { cisCode, level, statusText, startDate, endDate, url });
    }
  }

  return shortages;
}

// Read a local BDPM file with latin1 encoding
function readBDPMFile(filename: string): string {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`BDPM file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, "latin1");
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
  const log = await prisma.syncLog.create({
    data: { startedAt: new Date() },
  });

  const errors: string[] = [];
  let updated = 0;
  let created = 0;

  try {
    // Read local BDPM files
    const cisContent = readBDPMFile("CIS_bdpm.txt");
    const shortagesContent = readBDPMFile("CIS_CIP_Dispo_Spec.txt");

    const allMedications = parseCISFile(cisContent);
    const shortages = parseShortagesFile(shortagesContent);

    console.log(`[SYNC] Loaded ${allMedications.size} medications, ${shortages.size} shortages from local BDPM files`);

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
        errors.push(`Error processing ${cisCode}: ${err}`);
      }
    }

    // Mark medications not in shortage lists as AVAILABLE
    const shortageCodes = Array.from(shortages.keys());
    await prisma.medication.updateMany({
      where: {
        cisCode: { notIn: shortageCodes },
        status: { not: "AVAILABLE" },
      },
      data: { status: "AVAILABLE", lastChecked: new Date() },
    });

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        completedAt: new Date(),
        medicationsUpdated: updated,
        newMedications: created,
        errors,
        success: true,
      },
    });
  } catch (err) {
    errors.push(`Sync failed: ${err}`);
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        completedAt: new Date(),
        errors,
        success: false,
      },
    });
  }

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
        .catch(() => {});
    }

    return medications;
  } catch (error) {
    console.log("Using demo data (database unavailable)");
    const lowerQuery = query.toLowerCase();
    return DEMO_MEDICATIONS.filter(
      (med) =>
        med.name.toLowerCase().includes(lowerQuery) ||
        med.activeIngredient.toLowerCase().includes(lowerQuery) ||
        med.cisCode.includes(query)
    );
  }
}
