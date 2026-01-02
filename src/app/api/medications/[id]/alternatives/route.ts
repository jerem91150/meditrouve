import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

// Cache pour les groupes de génériques (chargé une fois)
let genericGroupsCache: Map<string, string[]> | null = null;

// Charger les groupes de génériques depuis le fichier BDPM
function loadGenericGroups(): Map<string, string[]> {
  if (genericGroupsCache) return genericGroupsCache;

  const groups = new Map<string, string[]>();

  try {
    const iconv = require("iconv-lite");
    const filePath = path.join(process.cwd(), "data", "CIS_GENER_bdpm.txt");

    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const content = iconv.decode(buffer, "latin1");
      const lines = content.split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split("\t");
        if (parts.length >= 3) {
          const groupId = parts[0].trim();
          const cisCode = parts[2].trim();

          if (!groups.has(groupId)) {
            groups.set(groupId, []);
          }
          groups.get(groupId)!.push(cisCode);
        }
      }
    }
  } catch (error) {
    console.error("Error loading generic groups:", error);
  }

  genericGroupsCache = groups;
  return groups;
}

// Trouver le groupe d'un médicament
function findMedicationGroup(
  cisCode: string,
  groups: Map<string, string[]>
): string[] | null {
  for (const [groupId, cisCodes] of groups) {
    if (cisCodes.includes(cisCode)) {
      return cisCodes;
    }
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Récupérer le médicament source
    const medication = await prisma.medication.findUnique({
      where: { id },
    });

    if (!medication) {
      return NextResponse.json(
        { error: "Médicament non trouvé" },
        { status: 404 }
      );
    }

    const alternatives: Array<{
      id: string;
      cisCode: string;
      name: string;
      laboratory: string | null;
      activeIngredient: string | null;
      dosage: string | null;
      form: string | null;
      status: string;
      matchType: "generic" | "sameIngredient" | "similar";
    }> = [];

    const addedIds = new Set<string>();
    addedIds.add(medication.id); // Exclure le médicament source

    // 1. Chercher dans les groupes de génériques
    const genericGroups = loadGenericGroups();
    const group = findMedicationGroup(medication.cisCode, genericGroups);

    if (group && group.length > 1) {
      const genericMeds = await prisma.medication.findMany({
        where: {
          cisCode: {
            in: group.filter((cis) => cis !== medication.cisCode),
          },
        },
        orderBy: [{ status: "asc" }, { name: "asc" }],
      });

      for (const med of genericMeds) {
        if (!addedIds.has(med.id)) {
          alternatives.push({
            id: med.id,
            cisCode: med.cisCode,
            name: med.name,
            laboratory: med.laboratory,
            activeIngredient: med.activeIngredient,
            dosage: med.dosage,
            form: med.form,
            status: med.status,
            matchType: "generic",
          });
          addedIds.add(med.id);
        }
      }
    }

    // 2. Chercher par principe actif identique (DCI)
    if (medication.activeIngredient) {
      const sameIngredientMeds = await prisma.medication.findMany({
        where: {
          activeIngredient: medication.activeIngredient,
          id: { notIn: Array.from(addedIds) },
        },
        orderBy: [{ status: "asc" }, { name: "asc" }],
        take: 20, // Limiter pour ne pas surcharger
      });

      for (const med of sameIngredientMeds) {
        if (!addedIds.has(med.id)) {
          alternatives.push({
            id: med.id,
            cisCode: med.cisCode,
            name: med.name,
            laboratory: med.laboratory,
            activeIngredient: med.activeIngredient,
            dosage: med.dosage,
            form: med.form,
            status: med.status,
            matchType: "sameIngredient",
          });
          addedIds.add(med.id);
        }
      }
    }

    // 3. Chercher par principe actif similaire (contient le même mot-clé)
    if (medication.activeIngredient && alternatives.length < 10) {
      // Extraire le premier mot du principe actif (ex: "PARACETAMOL" de "PARACETAMOL, CODÉINE")
      const mainIngredient = medication.activeIngredient
        .split(/[,\s+]/)[0]
        .trim();

      if (mainIngredient.length > 3) {
        const similarMeds = await prisma.medication.findMany({
          where: {
            activeIngredient: {
              contains: mainIngredient,
              mode: "insensitive",
            },
            id: { notIn: Array.from(addedIds) },
          },
          orderBy: [{ status: "asc" }, { name: "asc" }],
          take: 10,
        });

        for (const med of similarMeds) {
          if (!addedIds.has(med.id)) {
            alternatives.push({
              id: med.id,
              cisCode: med.cisCode,
              name: med.name,
              laboratory: med.laboratory,
              activeIngredient: med.activeIngredient,
              dosage: med.dosage,
              form: med.form,
              status: med.status,
              matchType: "similar",
            });
            addedIds.add(med.id);
          }
        }
      }
    }

    // Trier: disponibles en premier, puis par type de match
    alternatives.sort((a, b) => {
      // Disponibles en premier
      if (a.status === "AVAILABLE" && b.status !== "AVAILABLE") return -1;
      if (a.status !== "AVAILABLE" && b.status === "AVAILABLE") return 1;

      // Puis par type de correspondance
      const matchOrder = { generic: 0, sameIngredient: 1, similar: 2 };
      return matchOrder[a.matchType] - matchOrder[b.matchType];
    });

    return NextResponse.json({
      medication: {
        id: medication.id,
        name: medication.name,
        activeIngredient: medication.activeIngredient,
        status: medication.status,
      },
      alternatives: alternatives.slice(0, 15), // Limiter à 15 alternatives
      total: alternatives.length,
    });
  } catch (error) {
    console.error("Alternatives error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche d'alternatives" },
      { status: 500 }
    );
  }
}
