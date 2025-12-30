import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json(
        { error: "Requête trop courte (min 2 caractères)" },
        { status: 400 }
      );
    }

    const pharmacies = await prisma.pharmacy.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { postalCode: { startsWith: q } },
          { address: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 50,
      orderBy: { name: "asc" },
    });

    const results = pharmacies.map((pharmacy) => ({
      id: pharmacy.id,
      name: pharmacy.name,
      address: pharmacy.address,
      city: pharmacy.city,
      postalCode: pharmacy.postalCode,
      phone: pharmacy.phone,
      isOnDuty: pharmacy.isOnDuty,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Erreur recherche pharmacies:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
