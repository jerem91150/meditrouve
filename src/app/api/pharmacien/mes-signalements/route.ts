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

// Recuperer les signalements de ma pharmacie
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
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const where: any = {
      pharmacyId: account.pharmacyId,
    };

    if (activeOnly) {
      where.expiresAt = { gt: new Date() };
    }

    const reports = await prisma.pharmacyReport.findMany({
      where,
      include: {
        medication: {
          select: {
            id: true,
            name: true,
            cisCode: true,
            cip13: true,
            laboratory: true,
            dosage: true,
            form: true,
            status: true,
            isMITM: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Statistiques
    const stats = {
      total: reports.length,
      available: reports.filter((r) => r.status === "AVAILABLE").length,
      limited: reports.filter((r) => r.status === "LIMITED").length,
      unavailable: reports.filter((r) => r.status === "UNAVAILABLE").length,
      expired: reports.filter((r) => new Date(r.expiresAt) < new Date()).length,
    };

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        medication: r.medication,
        status: r.status,
        quantity: r.quantity,
        price: r.price,
        verifiedBy: r.verifiedBy,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
        isExpired: new Date(r.expiresAt) < new Date(),
      })),
      stats,
    });
  } catch (error) {
    console.error("Get my reports error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation" },
      { status: 500 }
    );
  }
}

// Mettre a jour en masse les signalements expires
export async function PUT(request: NextRequest) {
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
    const { reportIds } = body;

    if (!reportIds || !Array.isArray(reportIds)) {
      return NextResponse.json(
        { error: "reportIds requis (tableau)" },
        { status: 400 }
      );
    }

    // Renouveler les signalements (etendre de 24h)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const updated = await prisma.pharmacyReport.updateMany({
      where: {
        id: { in: reportIds },
        pharmacyId: account.pharmacyId,
      },
      data: {
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount: updated.count,
    });
  } catch (error) {
    console.error("Renew reports error:", error);
    return NextResponse.json(
      { error: "Erreur lors du renouvellement" },
      { status: 500 }
    );
  }
}
