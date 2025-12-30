import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const alert = await prisma.alert.findUnique({
      where: { id }
    });

    if (!alert || alert.userId !== session.user.id) {
      return NextResponse.json({ error: "Alerte non trouvee" }, { status: 404 });
    }

    await prisma.alert.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE alert error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { id } = await params;
    const { isActive } = await request.json();

    // Verify ownership
    const alert = await prisma.alert.findUnique({
      where: { id }
    });

    if (!alert || alert.userId !== session.user.id) {
      return NextResponse.json({ error: "Alerte non trouvee" }, { status: 404 });
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: { isActive },
      include: { medication: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH alert error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
