import admin from "firebase-admin";

// Initialize Firebase Admin SDK
// You'll need to add FIREBASE_SERVICE_ACCOUNT_KEY to your environment variables
// containing the JSON content of your Firebase service account key

let firebaseApp: admin.app.App | null = null;

function getFirebaseApp(): admin.app.App | null {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    console.warn("Firebase Admin SDK not configured: FIREBASE_SERVICE_ACCOUNT_KEY not set");
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return firebaseApp;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    return null;
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export async function sendPushNotification(
  tokens: string[],
  payload: PushNotificationPayload
): Promise<{ successCount: number; failureCount: number; failedTokens: string[] }> {
  const app = getFirebaseApp();

  if (!app) {
    console.warn("Firebase not configured, skipping push notification");
    return { successCount: 0, failureCount: tokens.length, failedTokens: tokens };
  }

  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, failedTokens: [] };
  }

  const message: admin.messaging.MulticastMessage = {
    notification: {
      title: payload.title,
      body: payload.body,
      imageUrl: payload.imageUrl,
    },
    data: payload.data,
    tokens,
    android: {
      priority: "high",
      notification: {
        channelId: "medication_alerts",
        priority: "high",
        defaultSound: true,
        defaultVibrateTimings: true,
      },
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: payload.title,
            body: payload.body,
          },
          sound: "default",
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    const failedTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(tokens[idx]);
        console.error(`Failed to send to token ${idx}:`, resp.error);
      }
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens,
    };
  } catch (error) {
    console.error("Error sending push notifications:", error);
    return { successCount: 0, failureCount: tokens.length, failedTokens: tokens };
  }
}

export async function sendMedicationStatusAlert(
  tokens: string[],
  medicationName: string,
  status: "AVAILABLE" | "TENSION" | "RUPTURE" | "UNKNOWN",
  medicationId: string
): Promise<void> {
  const statusMessages: Record<string, { title: string; body: string }> = {
    AVAILABLE: {
      title: "Médicament de nouveau disponible",
      body: `${medicationName} est de nouveau disponible en pharmacie.`,
    },
    TENSION: {
      title: "Tension d'approvisionnement",
      body: `${medicationName} est en tension d'approvisionnement. Contactez votre pharmacien.`,
    },
    RUPTURE: {
      title: "Rupture de stock",
      body: `${medicationName} est en rupture de stock. Demandez des alternatives à votre médecin.`,
    },
    UNKNOWN: {
      title: "Statut mis à jour",
      body: `Le statut de ${medicationName} a été mis à jour.`,
    },
  };

  const message = statusMessages[status] || statusMessages.UNKNOWN;

  await sendPushNotification(tokens, {
    title: message.title,
    body: message.body,
    data: {
      type: "MEDICATION_STATUS",
      medicationId,
      status,
      medicationName,
    },
  });
}
