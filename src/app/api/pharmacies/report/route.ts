import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const { pharmacyId, medicationId, status, quantity, price } = body;

    if (!pharmacyId || !medicationId || !status) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    if (!["AVAILABLE", "UNAVAILABLE", "LIMITED"].includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide" },
        { status: 400 }
      );
    }

    // Vérifier que la pharmacie existe
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
    });

    if (!pharmacy) {
      return NextResponse.json(
        { error: "Pharmacie non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que le médicament existe
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
    });

    if (!medication) {
      return NextResponse.json(
        { error: "Médicament non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur a déjà fait un signalement récent pour ce couple pharmacie/médicament
    const recentReport = await prisma.pharmacyReport.findFirst({
      where: {
        pharmacyId,
        medicationId,
        userId: user.id,
        createdAt: {
          gt: new Date(Date.now() - 60 * 60 * 1000), // 1 heure
        },
      },
    });

    if (recentReport) {
      return NextResponse.json(
        { error: "Vous avez déjà signalé ce médicament dans cette pharmacie récemment" },
        { status: 429 }
      );
    }

    // Créer le signalement (expire après 24h)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const report = await prisma.pharmacyReport.create({
      data: {
        pharmacyId,
        medicationId,
        userId: user.id,
        status,
        quantity: quantity || null,
        price: price || null,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        status: report.status,
        createdAt: report.createdAt,
        expiresAt: report.expiresAt,
      },
    });
  } catch (error) {
    console.error("Erreur signalement:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
