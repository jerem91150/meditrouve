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
    const { pharmacyId, medicationId } = body;

    if (!pharmacyId || !medicationId) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    // Trouver le signalement le plus récent non expiré
    const report = await prisma.pharmacyReport.findFirst({
      where: {
        pharmacyId,
        medicationId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Aucun signalement actif trouvé" },
        { status: 404 }
      );
    }

    // Empêcher l'utilisateur de vérifier son propre signalement
    if (report.userId === user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas confirmer votre propre signalement" },
        { status: 400 }
      );
    }

    // Incrémenter le compteur de vérifications
    const updatedReport = await prisma.pharmacyReport.update({
      where: { id: report.id },
      data: {
        verifiedBy: { increment: 1 },
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      verifiedBy: updatedReport.verifiedBy,
    });
  } catch (error) {
    console.error("Erreur vérification:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
