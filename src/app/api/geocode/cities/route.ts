import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface GeoApiCity {
  nom: string;
  code: string;
  codesPostaux: string[];
  codeDepartement: string;
  departement?: { nom: string };
  region?: { nom: string };
  centre?: { coordinates: [number, number] };
  population?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ cities: [] });
    }

    // D'abord, chercher dans le cache
    const cachedCities = await prisma.cityCache.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      orderBy: { searchCount: "desc" },
      take: 8,
    });

    // Si on a assez de résultats en cache, les utiliser
    if (cachedCities.length >= 5) {
      // Mettre à jour les compteurs de recherche en background
      updateSearchCounts(cachedCities.map((c) => c.id));

      return NextResponse.json({
        cities: cachedCities.map((city) => ({
          name: city.name,
          postalCode: city.postalCode,
          department: city.department,
          region: city.region,
          latitude: city.latitude,
          longitude: city.longitude,
          displayName: city.postalCode
            ? `${city.name} (${city.postalCode})`
            : city.name,
        })),
        source: "cache",
      });
    }

    // Sinon, appeler l'API gouvernementale
    const response = await fetch(
      `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux,codeDepartement,departement,region,centre,population&boost=population&limit=10`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data: GeoApiCity[] = await response.json();

    // Transformer et mettre en cache les résultats
    const cities = data
      .filter((city) => city.centre?.coordinates)
      .map((city) => {
        const [lng, lat] = city.centre!.coordinates;
        const postalCode = city.codesPostaux?.[0] || null;

        return {
          name: city.nom,
          postalCode,
          department: city.departement?.nom || null,
          region: city.region?.nom || null,
          latitude: lat,
          longitude: lng,
          displayName: postalCode ? `${city.nom} (${postalCode})` : city.nom,
        };
      });

    // Mettre en cache les nouvelles villes en background
    cacheCities(cities);

    return NextResponse.json({
      cities,
      source: "api",
    });
  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche de ville", cities: [] },
      { status: 500 }
    );
  }
}

// Fonction helper pour mettre à jour les compteurs (fire and forget)
async function updateSearchCounts(ids: string[]) {
  try {
    await prisma.$transaction(
      ids.map((id) =>
        prisma.cityCache.update({
          where: { id },
          data: {
            searchCount: { increment: 1 },
            lastUsed: new Date(),
          },
        })
      )
    );
  } catch (error) {
    console.error("Error updating search counts:", error);
  }
}

// Fonction helper pour mettre en cache les villes (fire and forget)
async function cacheCities(
  cities: {
    name: string;
    postalCode: string | null;
    department: string | null;
    region: string | null;
    latitude: number;
    longitude: number;
  }[]
) {
  try {
    for (const city of cities) {
      await prisma.cityCache.upsert({
        where: {
          name_postalCode: {
            name: city.name,
            postalCode: city.postalCode || "",
          },
        },
        update: {
          searchCount: { increment: 1 },
          lastUsed: new Date(),
        },
        create: {
          name: city.name,
          postalCode: city.postalCode,
          department: city.department,
          region: city.region,
          latitude: city.latitude,
          longitude: city.longitude,
        },
      });
    }
  } catch (error) {
    console.error("Error caching cities:", error);
  }
}
