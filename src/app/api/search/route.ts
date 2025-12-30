import { NextRequest, NextResponse } from "next/server";
import { searchMedications } from "@/lib/ansm-scraper";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ error: "Recherche trop courte (min 2 caracteres)" }, { status: 400 });
    }

    const medications = await searchMedications(query);

    return NextResponse.json({ medications, query });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
