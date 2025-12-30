import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Calcul de la distance en mètres entre deux points GPS (formule de Haversine)
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Rayon de la Terre en mètres
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const onDuty = searchParams.get("onDuty") === "true";
    const medicationId = searchParams.get("medicationId");
    const radius = parseFloat(searchParams.get("radius") || "10000"); // 10km par défaut

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "Coordonnées GPS requises" },
        { status: 400 }
      );
    }

    // Récupérer toutes les pharmacies (on filtrera par distance après)
    const pharmacies = await prisma.pharmacy.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        ...(onDuty && { isOnDuty: true }),
      },
      include: {
        reports: medicationId
          ? {
              where: {
                medicationId,
                expiresAt: { gt: new Date() },
              },
              orderBy: { createdAt: "desc" },
              take: 1,
            }
          : false,
      },
    });

    // Filtrer par distance et ajouter la distance
    const nearbyPharmacies = pharmacies
      .map((pharmacy) => {
        const distance = haversineDistance(
          lat,
          lng,
          pharmacy.latitude!,
          pharmacy.longitude!
        );
        return {
          id: pharmacy.id,
          name: pharmacy.name,
          address: pharmacy.address,
          city: pharmacy.city,
          postalCode: pharmacy.postalCode,
          phone: pharmacy.phone,
          isOnDuty: pharmacy.isOnDuty,
          distance: Math.round(distance),
          availability:
            medicationId && pharmacy.reports && pharmacy.reports.length > 0
              ? {
                  status: pharmacy.reports[0].status,
                  reportedAt: pharmacy.reports[0].createdAt.toISOString(),
                  verifiedBy: pharmacy.reports[0].verifiedBy,
                }
              : undefined,
        };
      })
      .filter((p) => p.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 50); // Limiter à 50 résultats

    return NextResponse.json(nearbyPharmacies);
  } catch (error) {
    console.error("Erreur recherche pharmacies:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
