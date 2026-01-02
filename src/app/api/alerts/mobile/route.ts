import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

function getUserIdFromToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// GET - List user's alerts
export async function GET(request: Request) {
  const userId = getUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const alerts = await prisma.alert.findMany({
      where: { userId },
      include: { medication: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Create new alert
export async function POST(request: Request) {
  const userId = getUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { medicationId, notifyOnAvailable, notifyOnTension, notifyOnRupture } = await request.json();

    if (!medicationId) {
      return NextResponse.json({ error: "ID médicament requis" }, { status: 400 });
    }

    // Check if alert already exists
    const existingAlert = await prisma.alert.findFirst({
      where: { userId, medicationId },
    });

    if (existingAlert) {
      return NextResponse.json({ error: "Alerte déjà existante" }, { status: 400 });
    }

    const alert = await prisma.alert.create({
      data: {
        userId,
        medicationId,
        notifyOnAvailable: notifyOnAvailable ?? true,
        notifyOnTension: notifyOnTension ?? true,
        notifyOnRupture: notifyOnRupture ?? true,
      },
      include: { medication: true },
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Remove alert
export async function DELETE(request: Request) {
  const userId = getUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("id");

    if (!alertId) {
      return NextResponse.json({ error: "ID alerte requis" }, { status: 400 });
    }

    const alert = await prisma.alert.findFirst({
      where: { id: alertId, userId },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alerte non trouvée" }, { status: 404 });
    }

    await prisma.alert.delete({ where: { id: alertId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
