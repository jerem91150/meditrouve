import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

import { getJwtSecretBytes } from "@/lib/jwt-secret";

const JWT_SECRET = getJwtSecretBytes();

async function getPharmacyAccount() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pharmacien_token");

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    const account = await prisma.pharmacyAccount.findUnique({
      where: { id: payload.accountId as string },
      include: { pharmacy: true },
    });

    if (!account || account.status !== "VERIFIED") {
      return null;
    }

    return account;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const account = await getPharmacyAccount();

    if (!account) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    if (!account.pharmacyId) {
      return NextResponse.json(
        { error: "Pharmacie non liee au compte" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // week, month, year, all

    // Calculer les dates
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // Tout temps
    }

    // Statistiques des signalements
    const totalReports = await prisma.pharmacyReport.count({
      where: {
        pharmacyId: account.pharmacyId,
        createdAt: { gte: startDate },
      },
    });

    const activeReports = await prisma.pharmacyReport.count({
      where: {
        pharmacyId: account.pharmacyId,
        expiresAt: { gt: now },
      },
    });

    const availableReports = await prisma.pharmacyReport.count({
      where: {
        pharmacyId: account.pharmacyId,
        status: "AVAILABLE",
        expiresAt: { gt: now },
      },
    });

    // Verifications recues (confiance)
    const verificationsReceived = await prisma.pharmacyReport.aggregate({
      where: {
        pharmacyId: account.pharmacyId,
        createdAt: { gte: startDate },
      },
      _sum: {
        verifiedBy: true,
      },
    });

    // Calculer les redirections estimees
    // Estimation: chaque signalement "disponible" genere ~3-5 redirections
    const estimatedRedirections = availableReports * 4;

    // Temps economise estime (minutes)
    // Estimation: chaque redirection evite 5-10 min de questions
    const timeSavedMinutes = estimatedRedirections * 7;

    // Top medicaments signales
    const topMedications = await prisma.pharmacyReport.groupBy({
      by: ["medicationId"],
      where: {
        pharmacyId: account.pharmacyId,
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    // Recuperer les noms des medicaments
    const medicationIds = topMedications.map((t) => t.medicationId);
    const medications = await prisma.medication.findMany({
      where: { id: { in: medicationIds } },
      select: { id: true, name: true },
    });

    const topMedsWithNames = topMedications.map((t) => ({
      medication: medications.find((m) => m.id === t.medicationId),
      count: t._count.id,
    }));

    // Evolution sur les 7 derniers jours
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await prisma.pharmacyReport.count({
        where: {
          pharmacyId: account.pharmacyId,
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      last7Days.push({
        date: dayStart.toISOString().split("T")[0],
        day: dayStart.toLocaleDateString("fr-FR", { weekday: "short" }),
        count,
      });
    }

    return NextResponse.json({
      period,
      stats: {
        totalReports,
        activeReports,
        availableReports,
        verificationsReceived: verificationsReceived._sum.verifiedBy || 0,
        estimatedRedirections,
        timeSavedMinutes,
        timeSavedFormatted: formatTime(timeSavedMinutes),
      },
      topMedications: topMedsWithNames,
      evolution: last7Days,
      pharmacyName: account.pharmacyName,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des statistiques" },
      { status: 500 }
    );
  }
}

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h${mins}`;
}
