import { NextRequest, NextResponse } from "next/server";
import { searchMedications } from "@/lib/ansm-scraper";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const medications = await searchMedications(query);

    // Limiter à 8 suggestions pour l'autocomplétion
    const suggestions = medications.slice(0, 8).map((med) => ({
      id: med.id,
      name: med.name,
      laboratory: med.laboratory,
      status: med.status,
      activeIngredient: med.activeIngredient,
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
