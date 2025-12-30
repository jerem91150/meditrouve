import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Demo medications for when database is not available
const DEMO_MEDICATIONS = [
  { id: "1", cisCode: "60001234", name: "OZEMPIC 0,25 mg", laboratory: "NOVO NORDISK", status: "RUPTURE", activeIngredient: "Semaglutide", lastChecked: new Date().toISOString() },
  { id: "2", cisCode: "60001235", name: "OZEMPIC 0,5 mg", laboratory: "NOVO NORDISK", status: "RUPTURE", activeIngredient: "Semaglutide", lastChecked: new Date().toISOString() },
  { id: "3", cisCode: "60001236", name: "OZEMPIC 1 mg", laboratory: "NOVO NORDISK", status: "TENSION", activeIngredient: "Semaglutide", lastChecked: new Date().toISOString() },
  { id: "4", cisCode: "60002001", name: "DOLIPRANE 500 mg", laboratory: "SANOFI", status: "AVAILABLE", activeIngredient: "Paracetamol", lastChecked: new Date().toISOString() },
  { id: "5", cisCode: "60002002", name: "DOLIPRANE 1000 mg", laboratory: "SANOFI", status: "AVAILABLE", activeIngredient: "Paracetamol", lastChecked: new Date().toISOString() },
  { id: "6", cisCode: "60003001", name: "AMOXICILLINE BIOGARAN 500 mg", laboratory: "BIOGARAN", status: "TENSION", activeIngredient: "Amoxicilline", lastChecked: new Date().toISOString() },
  { id: "7", cisCode: "60003002", name: "AMOXICILLINE SANDOZ 1g", laboratory: "SANDOZ", status: "AVAILABLE", activeIngredient: "Amoxicilline", lastChecked: new Date().toISOString() },
  { id: "8", cisCode: "60004001", name: "IBUPROFENE MYLAN 400 mg", laboratory: "MYLAN", status: "AVAILABLE", activeIngredient: "Ibuprofene", lastChecked: new Date().toISOString() },
  { id: "9", cisCode: "60005001", name: "VENTOLINE 100 mcg", laboratory: "GLAXOSMITHKLINE", status: "TENSION", activeIngredient: "Salbutamol", lastChecked: new Date().toISOString() },
  { id: "10", cisCode: "60006001", name: "LEVOTHYROX 75 mcg", laboratory: "MERCK", status: "RUPTURE", activeIngredient: "Levothyroxine", lastChecked: new Date().toISOString() },
  { id: "11", cisCode: "60006002", name: "LEVOTHYROX 100 mcg", laboratory: "MERCK", status: "TENSION", activeIngredient: "Levothyroxine", lastChecked: new Date().toISOString() },
  { id: "12", cisCode: "60007001", name: "MOUNJARO 2,5 mg", laboratory: "ELI LILLY", status: "RUPTURE", activeIngredient: "Tirzepatide", lastChecked: new Date().toISOString() },
  { id: "13", cisCode: "60008001", name: "WEGOVY 0,25 mg", laboratory: "NOVO NORDISK", status: "RUPTURE", activeIngredient: "Semaglutide", lastChecked: new Date().toISOString() },
  { id: "14", cisCode: "60009001", name: "METFORMINE 500 mg", laboratory: "BIOGARAN", status: "AVAILABLE", activeIngredient: "Metformine", lastChecked: new Date().toISOString() },
  { id: "15", cisCode: "60009002", name: "METFORMINE 1000 mg", laboratory: "SANDOZ", status: "AVAILABLE", activeIngredient: "Metformine", lastChecked: new Date().toISOString() },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    try {
      const where = status ? { status: status as any } : {};

      const [medications, total] = await Promise.all([
        prisma.medication.findMany({
          where,
          orderBy: [{ status: "asc" }, { name: "asc" }],
          skip,
          take: limit
        }),
        prisma.medication.count({ where })
      ]);

      return NextResponse.json({
        medications,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      });
    } catch {
      // Database not available, use demo data
      console.log("Using demo data (database unavailable)");
      let filtered = DEMO_MEDICATIONS;
      if (status) {
        filtered = filtered.filter(m => m.status === status);
      }
      const total = filtered.length;
      const paginated = filtered.slice(skip, skip + limit);

      return NextResponse.json({
        medications: paginated,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      });
    }
  } catch (error) {
    console.error("GET medications error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
