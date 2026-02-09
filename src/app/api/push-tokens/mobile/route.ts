import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/jwt-secret";

const JWT_SECRET = getJwtSecret();

function getUserIdFromToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// POST - Register or update push token
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { token, platform, deviceId } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token requis" },
        { status: 400 }
      );
    }

    // Normalize platform
    const normalizedPlatform = (platform?.toUpperCase() || "ANDROID") as "ANDROID" | "IOS" | "WEB";
    if (!["ANDROID", "IOS", "WEB"].includes(normalizedPlatform)) {
      return NextResponse.json(
        { error: "Platform invalide" },
        { status: 400 }
      );
    }

    // Upsert the token (create if not exists, update if exists)
    await prisma.pushToken.upsert({
      where: { token },
      update: {
        userId,
        platform: normalizedPlatform,
        deviceId,
        isActive: true,
        lastUsed: new Date(),
      },
      create: {
        userId,
        token,
        platform: normalizedPlatform,
        deviceId,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error registering push token:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement du token" },
      { status: 500 }
    );
  }
}

// DELETE - Unregister push token
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token requis" },
        { status: 400 }
      );
    }

    // Deactivate the token instead of deleting (soft delete)
    await prisma.pushToken.updateMany({
      where: {
        token,
        userId,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting push token:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du token" },
      { status: 500 }
    );
  }
}
