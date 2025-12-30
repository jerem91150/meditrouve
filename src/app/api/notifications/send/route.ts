import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail, generateAlertEmail } from "@/lib/email";

// This endpoint checks for medication status changes and sends notifications
// Should be called by a cron job (e.g., every hour)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    // Get medications that changed status recently (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentChanges = await prisma.statusHistory.findMany({
      where: {
        createdAt: { gte: oneHourAgo }
      },
      include: {
        medication: {
          include: {
            alerts: {
              where: { isActive: true },
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    let sentCount = 0;
    const errors: string[] = [];

    for (const change of recentChanges) {
      const medication = change.medication;

      for (const alert of medication.alerts) {
        const user = alert.user;

        // Check if user wants email notifications
        if (!user.notifyEmail) continue;

        // Check alert type matches
        if (alert.type === "AVAILABLE" && change.status !== "AVAILABLE") continue;
        if (alert.type === "RUPTURE" && change.status !== "RUPTURE") continue;

        // Check if already notified recently
        if (alert.lastNotified && alert.lastNotified > oneHourAgo) continue;

        try {
          const emailHtml = generateAlertEmail(
            user.name || "",
            medication.name,
            change.status,
            medication.laboratory || undefined
          );

          const result = await sendEmail({
            to: user.email,
            subject: `[AlerteMedicaments] ${medication.name} - ${change.status === "AVAILABLE" ? "Disponible" : change.status === "TENSION" ? "En tension" : "En rupture"}`,
            html: emailHtml
          });

          if (result.success) {
            // Update lastNotified
            await prisma.alert.update({
              where: { id: alert.id },
              data: { lastNotified: new Date() }
            });
            sentCount++;
          } else {
            errors.push(`Failed to send to ${user.email}`);
          }
        } catch (error) {
          errors.push(`Error for ${user.email}: ${error}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
