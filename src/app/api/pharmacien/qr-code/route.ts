import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import crypto from "crypto";

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

// GET - Recuperer le QR code unique de la pharmacie
export async function GET() {
  try {
    const account = await getPharmacyAccount();

    if (!account) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    // Generer un code unique si n'existe pas
    let trackingCode = account.apiKey?.substring(3, 11); // Utiliser une partie de l'API key

    if (!trackingCode) {
      trackingCode = crypto.randomBytes(4).toString("hex");
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://meditrouve.fr";
    const qrUrl = `${baseUrl}/r/${trackingCode}`;

    // URLs pour les stores
    const appStoreUrl = `${baseUrl}/r/${trackingCode}?platform=ios`;
    const playStoreUrl = `${baseUrl}/r/${trackingCode}?platform=android`;

    return NextResponse.json({
      trackingCode,
      qrUrl,
      appStoreUrl,
      playStoreUrl,
      pharmacyName: account.pharmacyName,
      // Stats de tracking
      stats: {
        totalScans: 0, // TODO: Implementer le tracking
        thisWeek: 0,
        thisMonth: 0,
      },
    });
  } catch (error) {
    console.error("QR code error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
