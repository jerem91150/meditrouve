import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";

const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .trim()
    .optional(),
  email: z
    .email("Adresse email invalide")
    .max(255, "L'email ne doit pas dépasser 255 caractères")
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128, "Le mot de passe ne doit pas dépasser 128 caractères")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre"
    ),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.issues.map((i) => i.message);
      return NextResponse.json(
        { error: errors[0], errors },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Corps de requête invalide" },
        { status: 400 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
