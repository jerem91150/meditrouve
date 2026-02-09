import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { guardFeature } from "@/lib/plan-guard";
import { PlanId } from "@/lib/plans";
import jwt from "jsonwebtoken";

import { getJwtSecret } from "@/lib/jwt-secret";

const JWT_SECRET = getJwtSecret();

// Get user ID from session or JWT token
async function getUserId(request: NextRequest): Promise<string | null> {
  // Try session first
  const session = await getServerSession();
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    return user?.id || null;
  }

  // Try JWT token
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch {
      return null;
    }
  }

  return null;
}

// GDPR Data Export - Right to Portability (Art. 20 RGPD)
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Fetch all user data
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profiles: {
          include: {
            medications: true,
            reminders: true,
          },
        },
        alerts: {
          include: {
            medication: {
              select: {
                name: true,
                cisCode: true,
                laboratory: true,
              },
            },
          },
        },
        searches: {
          select: {
            query: true,
            createdAt: true,
          },
        },
        ordonnances: {
          select: {
            id: true,
            status: true,
            extractedMedications: true,
            createdAt: true,
          },
        },
        pushTokens: {
          select: {
            platform: true,
            createdAt: true,
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Remove sensitive data
    const { password, ...safeUserData } = userData;

    // Format the export
    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: "1.0",
      user: {
        id: safeUserData.id,
        email: safeUserData.email,
        name: safeUserData.name,
        phone: safeUserData.phone,
        plan: safeUserData.plan,
        notificationPreferences: {
          email: safeUserData.notifyEmail,
          push: safeUserData.notifyPush,
          sms: safeUserData.notifySMS,
        },
        createdAt: safeUserData.createdAt,
      },
      profiles: safeUserData.profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        relation: profile.relation,
        isPrimary: profile.isPrimary,
        birthDate: profile.birthDate,
        createdAt: profile.createdAt,
        medications: profile.medications.map((med) => ({
          customName: med.customName,
          dosage: med.dosage,
          frequency: med.frequency,
          reminderEnabled: med.reminderEnabled,
          reminderTimes: med.reminderTimes,
          startDate: med.startDate,
          endDate: med.endDate,
        })),
        reminders: profile.reminders.map((rem) => ({
          scheduledTime: rem.scheduledTime,
          status: rem.status,
        })),
      })),
      alerts: safeUserData.alerts.map((alert) => ({
        id: alert.id,
        medication: alert.medication,
        type: alert.type,
        isActive: alert.isActive,
        createdAt: alert.createdAt,
      })),
      searchHistory: safeUserData.searches,
      prescriptionScans: safeUserData.ordonnances.map((ord) => ({
        id: ord.id,
        status: ord.status,
        extractedMedications: ord.extractedMedications,
        createdAt: ord.createdAt,
      })),
      devices: safeUserData.pushTokens.map((token) => ({
        platform: token.platform,
        registeredAt: token.createdAt,
      })),
    };

    // Log the export for audit
    await prisma.notification.create({
      data: {
        userId,
        type: "AVAILABLE_ALERT", // Using available type for audit
        title: "Export de données RGPD",
        message: `Export de données effectué le ${new Date().toLocaleDateString("fr-FR")}`,
        data: { action: "DATA_EXPORT", ip: request.headers.get("x-forwarded-for") || "unknown" },
        read: true,
      },
    });

    // Return as JSON with download headers
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="meditrouve-data-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export des données" },
      { status: 500 }
    );
  }
}
