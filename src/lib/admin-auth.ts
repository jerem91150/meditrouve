import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }), session: null };
  }

  const email = session.user.email.toLowerCase();

  // Check ADMIN_EMAILS env var or fall back to first user created
  let isAdmin = ADMIN_EMAILS.includes(email);

  if (!isAdmin && ADMIN_EMAILS.length === 0) {
    // Fallback: first user in DB is admin
    const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" }, select: { email: true } });
    isAdmin = firstUser?.email === email;
  }

  if (!isAdmin) {
    return { error: NextResponse.json({ error: "Accès admin requis" }, { status: 403 }), session: null };
  }

  return { error: null, session };
}
