import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    const date = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Récupérer les profils de l'utilisateur
    const profiles = await prisma.profile.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    });
    const profileIds = profiles.map(p => p.id);

    // Récupérer les rappels du jour
    const reminders = await prisma.reminder.findMany({
      where: {
        profileId: { in: profileIds },
        scheduledTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        profile: {
          select: { name: true },
        },
        userMedication: {
          include: {
            medication: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { scheduledTime: "asc" },
    });

    // Transformer les données pour le frontend
    const formattedReminders = reminders.map(r => ({
      id: r.id,
      scheduledTime: r.scheduledTime.toISOString(),
      status: r.status,
      medication: {
        id: r.userMedication.medication.id,
        name: r.userMedication.medication.name,
        dosage: r.userMedication.dosage || "",
      },
      profile: {
        name: r.profile.name,
      },
    }));

    // Calculer les stats
    const stats = {
      total: reminders.length,
      taken: reminders.filter(r => r.status === "TAKEN").length,
      pending: reminders.filter(r => r.status === "PENDING" || r.status === "SENT").length,
      skipped: reminders.filter(r => r.status === "SKIPPED").length,
    };

    return NextResponse.json({ reminders: formattedReminders, stats });
  } catch (error) {
    console.error("Erreur récupération rappels:", error);
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
    const { profileId, userMedicationId, scheduledTime } = body;

    // Vérifier que le profil appartient à l'utilisateur
    const profile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        userId: session.user.id,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    const reminder = await prisma.reminder.create({
      data: {
        profileId,
        userMedicationId,
        scheduledTime: new Date(scheduledTime),
        status: "PENDING",
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error("Erreur création rappel:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
