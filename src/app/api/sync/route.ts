import { NextRequest, NextResponse } from "next/server";
import { syncMedications } from "@/lib/ansm-scraper";

// This endpoint should be protected and called by a cron job
export async function POST(request: NextRequest) {
  try {
    // In production, verify API key or admin auth
    const authHeader = request.headers.get("authorization");
    const expectedKey = process.env.SYNC_API_KEY;

    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const result = await syncMedications();

    return NextResponse.json({
      success: result.errors.length === 0,
      updated: result.updated,
      created: result.created,
      errors: result.errors
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Erreur synchronisation" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const lastSync = await (await import("@/lib/prisma")).default.syncLog.findFirst({
      orderBy: { startedAt: "desc" }
    });

    return NextResponse.json({ lastSync });
  } catch (error) {
    console.error("GET sync error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
