import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, profileId } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "URL image requise" }, { status: 400 });
    }

    // Créer l'ordonnance en statut PROCESSING
    const ordonnance = await prisma.ordonnance.create({
      data: {
        userId: session.user.id,
        profileId,
        imageUrl,
        status: "PROCESSING",
      },
    });

    try {
      // Appel GPT-4 Vision pour extraire les médicaments
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Tu es un assistant spécialisé dans l'extraction de données d'ordonnances médicales françaises.
Extrait les informations suivantes de l'ordonnance :
- Nom du médecin (si visible)
- Date de prescription (si visible)
- Liste des médicaments avec pour chacun :
  - Nom du médicament
  - Dosage (ex: 500mg, 1g)
  - Fréquence de prise (ex: 2x/jour, matin et soir)
  - Durée du traitement (si précisée)

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "doctorName": "string ou null",
  "prescriptionDate": "YYYY-MM-DD ou null",
  "medications": [
    {
      "name": "Nom du médicament",
      "dosage": "dosage ou null",
      "frequency": "fréquence ou null",
      "duration": "durée ou null"
    }
  ]
}`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
              {
                type: "text",
                text: "Extrait les informations de cette ordonnance médicale.",
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Pas de réponse de l'IA");
      }

      // Parser le JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Format de réponse invalide");
      }

      const ocrResult = JSON.parse(jsonMatch[0]);

      // Enrichir les médicaments avec les données de la BDD
      const extractedMedications = await Promise.all(
        (ocrResult.medications || []).map(async (med: { name: string; dosage?: string; frequency?: string; duration?: string }) => {
          // Rechercher le médicament dans la base
          const dbMedication = await prisma.medication.findFirst({
            where: {
              OR: [
                { name: { contains: med.name, mode: "insensitive" } },
                { activeIngredient: { contains: med.name, mode: "insensitive" } },
              ],
            },
          });

          return {
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            matched: !!dbMedication,
            medicationId: dbMedication?.id,
            status: dbMedication?.status,
          };
        })
      );

      // Mettre à jour l'ordonnance
      const updatedOrdonnance = await prisma.ordonnance.update({
        where: { id: ordonnance.id },
        data: {
          status: "COMPLETED",
          ocrResult: ocrResult,
          extractedMedications: extractedMedications,
          doctorName: ocrResult.doctorName,
          prescriptionDate: ocrResult.prescriptionDate
            ? new Date(ocrResult.prescriptionDate)
            : null,
          processedAt: new Date(),
        },
      });

      return NextResponse.json({
        id: updatedOrdonnance.id,
        imageUrl: updatedOrdonnance.imageUrl,
        status: updatedOrdonnance.status,
        extractedMedications,
        doctorName: updatedOrdonnance.doctorName,
        prescriptionDate: updatedOrdonnance.prescriptionDate?.toISOString(),
        createdAt: updatedOrdonnance.createdAt.toISOString(),
      });
    } catch (ocrError) {
      console.error("Erreur OCR:", ocrError);

      // Marquer l'ordonnance comme échouée
      await prisma.ordonnance.update({
        where: { id: ordonnance.id },
        data: {
          status: "FAILED",
          errorMessage: ocrError instanceof Error ? ocrError.message : "Erreur inconnue",
        },
      });

      return NextResponse.json(
        { error: "Erreur lors de l'analyse de l'ordonnance" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur traitement ordonnance:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const ordonnances = await prisma.ordonnance.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json(
      ordonnances.map((o) => ({
        id: o.id,
        imageUrl: o.imageUrl,
        status: o.status,
        extractedMedications: o.extractedMedications,
        doctorName: o.doctorName,
        prescriptionDate: o.prescriptionDate?.toISOString(),
        createdAt: o.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Erreur récupération ordonnances:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
