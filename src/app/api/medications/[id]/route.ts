import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const medication = await prisma.medication.findUnique({
      where: { id },
      include: {
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 20
        }
      }
    });

    if (!medication) {
      return NextResponse.json({ error: "Medicament non trouve" }, { status: 404 });
    }

    return NextResponse.json(medication);
  } catch (error) {
    console.error("GET medication error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
