import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Cette route est appelée par un CRON job toutes les heures
// Pour Vercel: ajouter dans vercel.json: { "crons": [{ "path": "/api/cron/sync", "schedule": "0 * * * *" }] }

const BDPM_BASE_URL = "https://base-donnees-publique.medicaments.gouv.fr/download/file";

async function fetchBDPMFile(filename: string): Promise<string> {
  const response = await fetch(`${BDPM_BASE_URL}/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filename}: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  // Decode from Latin-1
  const decoder = new TextDecoder('latin1');
  return decoder.decode(buffer);
}

interface ShortageInfo {
  cisCode: string;
  level: number;
  status: string;
  startDate: string;
  endDate: string;
}

function parseShortages(content: string): Map<string, ShortageInfo> {
  const shortages = new Map<string, ShortageInfo>();
  const lines = content.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 5) continue;

    const cisCode = parts[0].trim();
    const level = parseInt(parts[2]) || 0;
    const status = parts[3].trim().toLowerCase();
    const startDate = parts[4].trim();
    const endDate = parts[5]?.trim() || '';

    shortages.set(cisCode, { cisCode, level, status, startDate, endDate });
  }

  return shortages;
}

export async function GET(request: NextRequest) {
  // Vérifier le secret pour sécuriser l'endpoint
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // En production, vérifier le secret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log("[CRON] Starting ANSM sync...");

    // Télécharger le fichier des ruptures
    const shortagesContent = await fetchBDPMFile("CIS_CIP_Dispo_Spec.txt");
    const shortages = parseShortages(shortagesContent);

    console.log(`[CRON] Found ${shortages.size} shortages`);

    // Récupérer tous les codes CIS en rupture/tension
    const shortagesCodes = Array.from(shortages.keys());

    // Mettre à jour les médicaments en rupture/tension
    let updatedToRupture = 0;
    let updatedToTension = 0;
    let updatedToAvailable = 0;

    // D'abord, remettre tous les médicaments à AVAILABLE
    await prisma.medication.updateMany({
      where: {
        status: { not: "AVAILABLE" },
        cisCode: { notIn: shortagesCodes }
      },
      data: {
        status: "AVAILABLE",
        lastChecked: new Date()
      }
    });

    // Ensuite, mettre à jour les médicaments en rupture/tension
    for (const [cisCode, info] of shortages) {
      let newStatus: "RUPTURE" | "TENSION" = "TENSION";

      if (info.status.includes("rupture")) {
        newStatus = "RUPTURE";
      }

      const result = await prisma.medication.updateMany({
        where: { cisCode },
        data: {
          status: newStatus,
          lastChecked: new Date()
        }
      });

      if (result.count > 0) {
        if (newStatus === "RUPTURE") updatedToRupture++;
        else updatedToTension++;
      }
    }

    // Créer un log de synchronisation
    const syncLog = await prisma.syncLog.create({
      data: {
        startedAt: new Date(startTime),
        completedAt: new Date(),
        medicationsUpdated: updatedToRupture + updatedToTension,
        newMedications: 0,
        errors: [],
        success: true
      }
    });

    const duration = Date.now() - startTime;

    console.log(`[CRON] Sync completed in ${duration}ms`);
    console.log(`[CRON] Updated: ${updatedToRupture} ruptures, ${updatedToTension} tensions`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      stats: {
        totalShortages: shortages.size,
        updatedToRupture,
        updatedToTension,
        syncLogId: syncLog.id
      }
    });

  } catch (error) {
    console.error("[CRON] Sync failed:", error);

    await prisma.syncLog.create({
      data: {
        startedAt: new Date(startTime),
        completedAt: new Date(),
        medicationsUpdated: 0,
        newMedications: 0,
        errors: [String(error)],
        success: false
      }
    });

    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
