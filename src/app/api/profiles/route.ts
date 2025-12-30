import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const profiles = await prisma.profile.findMany({
      where: { userId: session.user.id },
      include: {
        medications: {
          include: {
            medication: true,
          },
        },
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });

    const profilesWithStats = profiles.map((profile) => {
      const alertsCount = profile.medications.filter(
        (um) =>
          um.medication.status === "RUPTURE" || um.medication.status === "TENSION"
      ).length;

      return {
        id: profile.id,
        name: profile.name,
        relation: profile.relation,
        isPrimary: profile.isPrimary,
        birthDate: profile.birthDate?.toISOString(),
        medicationsCount: profile.medications.length,
        alertsCount,
      };
    });

    return NextResponse.json(profilesWithStats);
  } catch (error) {
    console.error("Erreur récupération profils:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name, relation, birthDate } = body;

    if (!name) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    // Vérifier le nombre de profils (limite plan)
    const existingProfiles = await prisma.profile.count({
      where: { userId: session.user.id },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    const maxProfiles =
      user?.plan === "FAMILLE" ? 5 : user?.plan === "PREMIUM" ? 3 : 1;

    if (existingProfiles >= maxProfiles) {
      return NextResponse.json(
        {
          error: `Limite de ${maxProfiles} profil(s) atteinte. Passez au plan supérieur.`,
        },
        { status: 403 }
      );
    }

    // Définir si c'est le profil principal (premier profil)
    const isPrimary = existingProfiles === 0;

    const profile = await prisma.profile.create({
      data: {
        userId: session.user.id,
        name,
        relation: relation || "self",
        isPrimary,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error("Erreur création profil:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
