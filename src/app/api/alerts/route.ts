import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const alerts = await prisma.alert.findMany({
      where: { userId: session.user.id },
      include: {
        medication: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("GET alerts error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { medicationId, type } = await request.json();

    if (!medicationId) {
      return NextResponse.json({ error: "Donnees manquantes" }, { status: 400 });
    }

    // Check if alert already exists
    const existing = await prisma.alert.findUnique({
      where: { userId_medicationId: { userId: session.user.id, medicationId } }
    });

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        const updated = await prisma.alert.update({
          where: { id: existing.id },
          data: { isActive: true, type: type || "AVAILABLE" },
          include: { medication: true }
        });
        return NextResponse.json(updated);
      }
      return NextResponse.json({ error: "Alerte deja active" }, { status: 400 });
    }

    const alert = await prisma.alert.create({
      data: {
        userId: session.user.id,
        medicationId,
        type: type || "AVAILABLE"
      },
      include: { medication: true }
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("POST alert error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
