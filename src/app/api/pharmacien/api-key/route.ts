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
    });

    if (!account || account.status !== "VERIFIED") {
      return null;
    }

    return account;
  } catch {
    return null;
  }
}

// GET - Recuperer l'API key actuelle (masquee)
export async function GET() {
  try {
    const account = await getPharmacyAccount();

    if (!account) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    return NextResponse.json({
      hasApiKey: !!account.apiKey,
      apiEnabled: account.apiEnabled,
      apiKeyPreview: account.apiKey
        ? `${account.apiKey.substring(0, 8)}...${account.apiKey.substring(account.apiKey.length - 4)}`
        : null,
    });
  } catch (error) {
    console.error("Get API key error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Generer une nouvelle API key
export async function POST() {
  try {
    const account = await getPharmacyAccount();

    if (!account) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    // Generer une nouvelle cle API
    const apiKey = `mt_${crypto.randomBytes(32).toString("hex")}`;

    await prisma.pharmacyAccount.update({
      where: { id: account.id },
      data: {
        apiKey,
        apiEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      apiKey, // On retourne la cle complete une seule fois
      message: "Conservez cette cle en lieu sur, elle ne sera plus affichee.",
    });
  } catch (error) {
    console.error("Generate API key error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation" },
      { status: 500 }
    );
  }
}

// DELETE - Revoquer l'API key
export async function DELETE() {
  try {
    const account = await getPharmacyAccount();

    if (!account) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await prisma.pharmacyAccount.update({
      where: { id: account.id },
      data: {
        apiKey: null,
        apiEnabled: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "API key revoquee",
    });
  } catch (error) {
    console.error("Revoke API key error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la revocation" },
      { status: 500 }
    );
  }
}
