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

// Recuperer les ruptures actuelles avec statistiques
export async function GET(request: NextRequest) {
  try {
    const account = await getPharmacyAccount();

    if (!account) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Recuperer les medicaments en rupture ou tension
    const ruptures = await prisma.medication.findMany({
      where: {
        status: { in: ["RUPTURE", "TENSION"] },
      },
      orderBy: [
        { status: "asc" }, // RUPTURE en premier
        { lastChecked: "desc" },
      ],
      take: limit,
      skip: offset,
      select: {
        id: true,
        cisCode: true,
        cip13: true,
        name: true,
        laboratory: true,
        activeIngredient: true,
        dosage: true,
        form: true,
        status: true,
        expectedReturn: true,
        lastChecked: true,
        isMITM: true,
        _count: {
          select: {
            pharmacyReports: {
              where: {
                status: "AVAILABLE",
                expiresAt: { gt: new Date() },
              },
            },
          },
        },
      },
    });

    // Compter le total
    const total = await prisma.medication.count({
      where: {
        status: { in: ["RUPTURE", "TENSION"] },
      },
    });

    // Statistiques globales
    const stats = await prisma.medication.groupBy({
      by: ["status"],
      _count: { id: true },
      where: {
        status: { in: ["RUPTURE", "TENSION", "AVAILABLE"] },
      },
    });

    const statsMap = {
      rupture: stats.find((s) => s.status === "RUPTURE")?._count.id || 0,
      tension: stats.find((s) => s.status === "TENSION")?._count.id || 0,
      available: stats.find((s) => s.status === "AVAILABLE")?._count.id || 0,
    };

    return NextResponse.json({
      ruptures: ruptures.map((r) => ({
        ...r,
        availableReports: r._count.pharmacyReports,
      })),
      total,
      stats: statsMap,
    });
  } catch (error) {
    console.error("Get ruptures error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation" },
      { status: 500 }
    );
  }
}

// Signaler la disponibilite dans sa pharmacie
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { medicationId, status, quantity, price } = body;

    if (!medicationId || !status) {
      return NextResponse.json(
        { error: "medicationId et status requis" },
        { status: 400 }
      );
    }

    // Verifier que le medicament existe
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
    });

    if (!medication) {
      return NextResponse.json(
        { error: "Medicament non trouve" },
        { status: 404 }
      );
    }

    // Creer ou mettre a jour le signalement
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Chercher un signalement existant recent
    const existingReport = await prisma.pharmacyReport.findFirst({
      where: {
        pharmacyId: account.pharmacyId,
        medicationId,
        expiresAt: { gt: new Date() },
      },
    });

    let report;

    if (existingReport) {
      // Mettre a jour le signalement existant
      report = await prisma.pharmacyReport.update({
        where: { id: existingReport.id },
        data: {
          status,
          quantity: quantity || null,
          price: price || null,
          expiresAt,
        },
        include: {
          pharmacy: true,
          medication: true,
        },
      });
    } else {
      // Creer un nouveau signalement (sans userId pour les pharmaciens)
      // On utilise un user systeme ou on rend userId optionnel
      report = await prisma.pharmacyReport.create({
        data: {
          pharmacyId: account.pharmacyId,
          medicationId,
          userId: account.id, // Utiliser l'ID du compte pharmacien comme reference
          status,
          quantity: quantity || null,
          price: price || null,
          expiresAt,
        },
        include: {
          pharmacy: true,
          medication: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        pharmacy: report.pharmacy.name,
        medication: report.medication.name,
        status: report.status,
        quantity: report.quantity,
        expiresAt: report.expiresAt,
      },
    });
  } catch (error) {
    console.error("Signal error:", error);
    return NextResponse.json(
      { error: "Erreur lors du signalement" },
      { status: 500 }
    );
  }
}

// Supprimer un signalement
export async function DELETE(request: NextRequest) {
  try {
    const account = await getPharmacyAccount();

    if (!account) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("reportId");

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId requis" },
        { status: 400 }
      );
    }

    const report = await prisma.pharmacyReport.findUnique({
      where: { id: reportId },
    });

    if (!report || report.pharmacyId !== account.pharmacyId) {
      return NextResponse.json(
        { error: "Signalement non trouve" },
        { status: 404 }
      );
    }

    await prisma.pharmacyReport.delete({
      where: { id: reportId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete report error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
