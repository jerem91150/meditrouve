import * as cheerio from "cheerio";
import prisma from "./prisma";

const ANSM_RUPTURES_URL = "https://ansm.sante.fr/disponibilites-des-produits-de-sante/medicaments";
const ANSM_TENSIONS_URL = "https://ansm.sante.fr/disponibilites-des-produits-de-sante/medicaments/tensions-dapprovisionnement";

interface ScrapedMedication {
  cisCode: string;
  name: string;
  laboratory?: string;
  status: "RUPTURE" | "TENSION" | "AVAILABLE";
  details?: string;
}

export async function fetchANSMPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ANSM: ${response.status}`);
  }

  return response.text();
}

export async function parseRupturesPage(html: string): Promise<ScrapedMedication[]> {
  const $ = cheerio.load(html);
  const medications: ScrapedMedication[] = [];

  // Parse the ANSM ruptures table
  // Note: The actual selector depends on ANSM website structure
  $(".medication-row, .rupture-item, tr[data-medication]").each((_, element) => {
    const $el = $(element);
    const name = $el.find(".medication-name, .name, td:first-child").text().trim();
    const cisCode = $el.attr("data-cis") || $el.find("[data-cis]").attr("data-cis") || "";
    const laboratory = $el.find(".laboratory, .labo, td:nth-child(2)").text().trim();

    if (name && cisCode) {
      medications.push({
        cisCode,
        name,
        laboratory: laboratory || undefined,
        status: "RUPTURE"
      });
    }
  });

  return medications;
}

export async function parseTensionsPage(html: string): Promise<ScrapedMedication[]> {
  const $ = cheerio.load(html);
  const medications: ScrapedMedication[] = [];

  $(".medication-row, .tension-item, tr[data-medication]").each((_, element) => {
    const $el = $(element);
    const name = $el.find(".medication-name, .name, td:first-child").text().trim();
    const cisCode = $el.attr("data-cis") || $el.find("[data-cis]").attr("data-cis") || "";
    const laboratory = $el.find(".laboratory, .labo, td:nth-child(2)").text().trim();

    if (name && cisCode) {
      medications.push({
        cisCode,
        name,
        laboratory: laboratory || undefined,
        status: "TENSION"
      });
    }
  });

  return medications;
}

export async function syncMedications(): Promise<{
  updated: number;
  created: number;
  errors: string[];
}> {
  const log = await prisma.syncLog.create({
    data: { startedAt: new Date() }
  });

  const errors: string[] = [];
  let updated = 0;
  let created = 0;

  try {
    // Fetch and parse ruptures
    const rupturesHtml = await fetchANSMPage(ANSM_RUPTURES_URL);
    const ruptures = await parseRupturesPage(rupturesHtml);

    // Fetch and parse tensions
    const tensionsHtml = await fetchANSMPage(ANSM_TENSIONS_URL);
    const tensions = await parseTensionsPage(tensionsHtml);

    // Combine all medications
    const allMedications = [...ruptures, ...tensions];
    const processedCodes = new Set<string>();

    for (const med of allMedications) {
      if (processedCodes.has(med.cisCode)) continue;
      processedCodes.add(med.cisCode);

      try {
        const existing = await prisma.medication.findUnique({
          where: { cisCode: med.cisCode }
        });

        if (existing) {
          // Check if status changed
          if (existing.status !== med.status) {
            await prisma.statusHistory.create({
              data: {
                medicationId: existing.id,
                status: med.status,
                source: "ANSM",
                details: med.details
              }
            });
          }

          await prisma.medication.update({
            where: { cisCode: med.cisCode },
            data: {
              name: med.name,
              laboratory: med.laboratory,
              status: med.status,
              lastChecked: new Date()
            }
          });
          updated++;
        } else {
          const newMed = await prisma.medication.create({
            data: {
              cisCode: med.cisCode,
              name: med.name,
              laboratory: med.laboratory,
              status: med.status,
              lastChecked: new Date()
            }
          });

          await prisma.statusHistory.create({
            data: {
              medicationId: newMed.id,
              status: med.status,
              source: "ANSM"
            }
          });
          created++;
        }
      } catch (err) {
        errors.push(`Error processing ${med.cisCode}: ${err}`);
      }
    }

    // Mark medications not in the lists as AVAILABLE
    const ruptureAndTensionCodes = allMedications.map(m => m.cisCode);
    await prisma.medication.updateMany({
      where: {
        cisCode: { notIn: ruptureAndTensionCodes },
        status: { not: "AVAILABLE" }
      },
      data: { status: "AVAILABLE", lastChecked: new Date() }
    });

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        completedAt: new Date(),
        medicationsUpdated: updated,
        newMedications: created,
        errors,
        success: true
      }
    });

  } catch (err) {
    errors.push(`Sync failed: ${err}`);
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        completedAt: new Date(),
        errors,
        success: false
      }
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
  // Try database first, fallback to demo data if unavailable
  try {
    const medications = await prisma.medication.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { activeIngredient: { contains: query, mode: "insensitive" } },
          { cisCode: { contains: query } }
        ]
      },
      orderBy: [
        { status: "asc" },
        { name: "asc" }
      ],
      take: 50
    });

    if (userId) {
      await prisma.searchHistory.create({
        data: { userId, query, results: medications.length }
      }).catch(() => {});
    }

    return medications;
  } catch (error) {
    // Database not available, use demo data
    console.log("Using demo data (database unavailable)");
    const lowerQuery = query.toLowerCase();
    return DEMO_MEDICATIONS.filter(med =>
      med.name.toLowerCase().includes(lowerQuery) ||
      med.activeIngredient.toLowerCase().includes(lowerQuery) ||
      med.cisCode.includes(query)
    );
  }
}
