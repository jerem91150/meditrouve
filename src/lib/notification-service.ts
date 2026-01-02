import { prisma } from "@/lib/prisma";
import { sendMedicationStatusAlert } from "@/lib/firebase-admin";
import { MedicationStatus } from "@prisma/client";

export async function notifyUsersOfStatusChange(
  medicationId: string,
  newStatus: MedicationStatus,
  medicationName: string
): Promise<{ notifiedUsers: number; successfulNotifications: number }> {
  // Find all active alerts for this medication
  const alerts = await prisma.alert.findMany({
    where: {
      medicationId,
      isActive: true,
    },
    include: {
      user: {
        include: {
          pushTokens: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  if (alerts.length === 0) {
    return { notifiedUsers: 0, successfulNotifications: 0 };
  }

  // Filter users based on their notification preferences and alert type
  const usersToNotify = alerts.filter((alert) => {
    const user = alert.user;
    if (!user.notifyPush) return false;

    // Check if alert type matches the status change
    switch (alert.type) {
      case "AVAILABLE":
        return newStatus === "AVAILABLE";
      case "RUPTURE":
        return newStatus === "RUPTURE";
      case "TENSION":
        return newStatus === "TENSION";
      case "ANY_CHANGE":
        return true;
      default:
        return true;
    }
  });

  if (usersToNotify.length === 0) {
    return { notifiedUsers: 0, successfulNotifications: 0 };
  }

  // Collect all push tokens
  const allTokens: string[] = [];
  const tokenToUserId: Map<string, string> = new Map();

  for (const alert of usersToNotify) {
    for (const pushToken of alert.user.pushTokens) {
      allTokens.push(pushToken.token);
      tokenToUserId.set(pushToken.token, alert.user.id);
    }
  }

  if (allTokens.length === 0) {
    return { notifiedUsers: usersToNotify.length, successfulNotifications: 0 };
  }

  // Send notifications
  const statusForNotification = newStatus as "AVAILABLE" | "TENSION" | "RUPTURE" | "UNKNOWN";
  await sendMedicationStatusAlert(
    allTokens,
    medicationName,
    statusForNotification,
    medicationId
  );

  // Update lastNotified for all alerts
  await prisma.alert.updateMany({
    where: {
      id: { in: usersToNotify.map((a) => a.id) },
    },
    data: {
      lastNotified: new Date(),
    },
  });

  // Create notification records
  for (const alert of usersToNotify) {
    await prisma.notification.create({
      data: {
        userId: alert.userId,
        type: statusToNotificationType(newStatus),
        title: getNotificationTitle(newStatus),
        message: `${medicationName} - ${getStatusMessage(newStatus)}`,
        data: {
          medicationId,
          status: newStatus,
        },
        sentPush: true,
      },
    });
  }

  return {
    notifiedUsers: usersToNotify.length,
    successfulNotifications: allTokens.length,
  };
}

function statusToNotificationType(status: MedicationStatus) {
  switch (status) {
    case "AVAILABLE":
      return "AVAILABLE_ALERT";
    case "TENSION":
      return "TENSION_ALERT";
    case "RUPTURE":
      return "RUPTURE_ALERT";
    default:
      return "AVAILABLE_ALERT";
  }
}

function getNotificationTitle(status: MedicationStatus): string {
  switch (status) {
    case "AVAILABLE":
      return "Médicament disponible";
    case "TENSION":
      return "Tension d'approvisionnement";
    case "RUPTURE":
      return "Rupture de stock";
    default:
      return "Mise à jour de statut";
  }
}

function getStatusMessage(status: MedicationStatus): string {
  switch (status) {
    case "AVAILABLE":
      return "est de nouveau disponible";
    case "TENSION":
      return "est en tension d'approvisionnement";
    case "RUPTURE":
      return "est en rupture de stock";
    default:
      return "statut mis à jour";
  }
}

// Batch process to check for status changes and send notifications
export async function processStatusChangesAndNotify(): Promise<{
  medicationsChecked: number;
  notificationsSent: number;
}> {
  // Get medications that changed status in the last hour
  const recentChanges = await prisma.statusHistory.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      },
    },
    include: {
      medication: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    distinct: ["medicationId"],
  });

  let notificationsSent = 0;

  for (const change of recentChanges) {
    const result = await notifyUsersOfStatusChange(
      change.medicationId,
      change.status,
      change.medication.name
    );
    notificationsSent += result.successfulNotifications;
  }

  return {
    medicationsChecked: recentChanges.length,
    notificationsSent,
  };
}
