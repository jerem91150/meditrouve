import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Vérifier que le rappel appartient à un profil de l'utilisateur
    const reminder = await prisma.reminder.findFirst({
      where: { id },
      include: {
        profile: true,
      },
    });

    if (!reminder || reminder.profile.userId !== session.user.id) {
      return NextResponse.json({ error: "Rappel non trouvé" }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "take":
        updateData = {
          status: "TAKEN",
          takenAt: new Date(),
        };
        break;
      case "skip":
        updateData = {
          status: "SKIPPED",
        };
        break;
      case "postpone":
        // Reporter de 30 minutes
        const postponedTo = new Date(reminder.scheduledTime);
        postponedTo.setMinutes(postponedTo.getMinutes() + 30);
        updateData = {
          status: "POSTPONED",
          postponedTo,
        };
        break;
      default:
        return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedReminder);
  } catch (error) {
    console.error("Erreur mise à jour rappel:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que le rappel appartient à un profil de l'utilisateur
    const reminder = await prisma.reminder.findFirst({
      where: { id },
      include: {
        profile: true,
      },
    });

    if (!reminder || reminder.profile.userId !== session.user.id) {
      return NextResponse.json({ error: "Rappel non trouvé" }, { status: 404 });
    }

    await prisma.reminder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression rappel:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
