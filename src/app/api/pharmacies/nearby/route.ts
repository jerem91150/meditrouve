import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Recherche les pharmacies proches avec disponibilité d'un médicament
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const medicationId = searchParams.get("medicationId");
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseFloat(searchParams.get("radius") || "10"); // km

    if (!medicationId) {
      return NextResponse.json(
        { error: "medicationId requis" },
        { status: 400 }
      );
    }

    // Récupérer toutes les pharmacies
    const pharmacies = await prisma.pharmacy.findMany({
      include: {
        reports: {
          where: {
            medicationId,
            status: "AVAILABLE",
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // Calculer la distance et filtrer
    const pharmaciesWithDistance = pharmacies
      .map((pharmacy) => {
        let distance = null;
        if (pharmacy.latitude && pharmacy.longitude && lat && lng) {
          distance = calculateDistance(
            lat,
            lng,
            pharmacy.latitude,
            pharmacy.longitude
          );
        }

        const latestReport = pharmacy.reports[0];

        return {
          id: pharmacy.id,
          name: pharmacy.name,
          address: pharmacy.address,
          city: pharmacy.city,
          postalCode: pharmacy.postalCode,
          phone: pharmacy.phone,
          latitude: pharmacy.latitude,
          longitude: pharmacy.longitude,
          isOnDuty: pharmacy.isOnDuty,
          distance: distance ? Math.round(distance * 10) / 10 : null,
          availability: latestReport
            ? {
                status: latestReport.status,
                quantity: latestReport.quantity,
                price: latestReport.price,
                reportedAt: latestReport.createdAt,
                verifiedBy: latestReport.verifiedBy,
              }
            : null,
        };
      })
      .filter((p) => {
        if (lat && lng && p.distance !== null) {
          return p.distance <= radius;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.availability && !b.availability) return -1;
        if (!a.availability && b.availability) return 1;
        if (a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        return 0;
      });

    return NextResponse.json({
      pharmacies: pharmaciesWithDistance,
      total: pharmaciesWithDistance.length,
    });
  } catch (error) {
    console.error("Pharmacy search error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
}

// Formule de Haversine pour calculer la distance entre 2 points GPS
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
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

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
