import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { getJwtSecretBytes } from "@/lib/jwt-secret";

const JWT_SECRET = getJwtSecretBytes();

// Inscription pharmacien
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      pharmacyName,
      finess,
      siret,
      ownerName,
      phone,
      address,
      city,
      postalCode,
    } = body;

    // Validation
    if (!email || !password || !pharmacyName || !finess || !ownerName || !phone || !address || !city || !postalCode) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent etre remplis" },
        { status: 400 }
      );
    }

    // Verifier si l'email existe deja
    const existingEmail = await prisma.pharmacyAccount.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Cet email est deja utilise" },
        { status: 400 }
      );
    }

    // Verifier si le FINESS existe deja
    const existingFiness = await prisma.pharmacyAccount.findUnique({
      where: { finess },
    });

    if (existingFiness) {
      return NextResponse.json(
        { error: "Ce numero FINESS est deja enregistre" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Chercher ou creer la pharmacie dans la base
    let pharmacy = await prisma.pharmacy.findFirst({
      where: {
        OR: [
          { name: { contains: pharmacyName, mode: "insensitive" } },
          { address: { contains: address, mode: "insensitive" }, postalCode },
        ],
      },
    });

    if (!pharmacy) {
      pharmacy = await prisma.pharmacy.create({
        data: {
          name: pharmacyName,
          address,
          city,
          postalCode,
          phone,
        },
      });
    }

    // Creer le compte pharmacien
    const account = await prisma.pharmacyAccount.create({
      data: {
        email,
        password: hashedPassword,
        pharmacyName,
        finess,
        siret: siret || null,
        ownerName,
        phone,
        address,
        city,
        postalCode,
        pharmacyId: pharmacy.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Compte cree avec succes. Vous recevrez un email de validation sous 24-48h.",
      accountId: account.id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}

// Connexion pharmacien
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const account = await prisma.pharmacyAccount.findUnique({
      where: { email },
      include: {
        pharmacy: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, account.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    if (account.status === "PENDING") {
      return NextResponse.json(
        { error: "Votre compte est en attente de validation" },
        { status: 403 }
      );
    }

    if (account.status === "REJECTED") {
      return NextResponse.json(
        { error: "Votre demande a ete rejetee. Contactez le support." },
        { status: 403 }
      );
    }

    if (account.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Votre compte est suspendu. Contactez le support." },
        { status: 403 }
      );
    }

    // Creer le token JWT
    const token = await new SignJWT({
      accountId: account.id,
      email: account.email,
      pharmacyId: account.pharmacyId,
      pharmacyName: account.pharmacyName,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    // Stocker le token dans un cookie HttpOnly
    const cookieStore = await cookies();
    cookieStore.set("pharmacien_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: "/",
    });

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        email: account.email,
        pharmacyName: account.pharmacyName,
        ownerName: account.ownerName,
        pharmacy: account.pharmacy,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    );
  }
}

// Deconnexion
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("pharmacien_token");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la deconnexion" },
      { status: 500 }
    );
  }
}

// Verifier la session
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("pharmacien_token");

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { payload } = await jwtVerify(token.value, JWT_SECRET);

    const account = await prisma.pharmacyAccount.findUnique({
      where: { id: payload.accountId as string },
      include: {
        pharmacy: true,
      },
    });

    if (!account || account.status !== "VERIFIED") {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      account: {
        id: account.id,
        email: account.email,
        pharmacyName: account.pharmacyName,
        ownerName: account.ownerName,
        pharmacy: account.pharmacy,
        apiEnabled: account.apiEnabled,
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
