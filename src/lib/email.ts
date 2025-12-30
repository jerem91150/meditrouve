import nodemailer from "nodemailer";

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"AlerteMedicaments" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error };
  }
}

export function generateAlertEmail(
  userName: string,
  medicationName: string,
  newStatus: string,
  laboratory?: string
) {
  const statusLabels: Record<string, { label: string; color: string }> = {
    AVAILABLE: { label: "Disponible", color: "#10b981" },
    TENSION: { label: "En tension", color: "#f59e0b" },
    RUPTURE: { label: "En rupture", color: "#ef4444" },
  };

  const status = statusLabels[newStatus] || { label: newStatus, color: "#6b7280" };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerte Medicament</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">AlerteMedicaments</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Changement de disponibilite</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
        Bonjour ${userName || ""},
      </p>

      <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
        Un medicament que vous suivez a change de statut :
      </p>

      <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
        <h2 style="color: #111827; font-size: 20px; margin: 0 0 8px;">${medicationName}</h2>
        ${laboratory ? `<p style="color: #6b7280; font-size: 14px; margin: 0 0 16px;">${laboratory}</p>` : ""}
        <div style="display: inline-block; background: ${status.color}20; border: 1px solid ${status.color}40; border-radius: 9999px; padding: 8px 16px;">
          <span style="color: ${status.color}; font-weight: 600;">${status.label}</span>
        </div>
      </div>

      <a href="${process.env.NEXTAUTH_URL || "http://localhost:3001"}/dashboard"
         style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 16px;">
        Voir mes alertes
      </a>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        Vous recevez cet email car vous avez active une alerte sur AlerteMedicaments.
        <br>
        <a href="${process.env.NEXTAUTH_URL || "http://localhost:3001"}/profile" style="color: #14b8a6;">Gerer mes preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateWelcomeEmail(userName: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur AlerteMedicaments</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Bienvenue sur AlerteMedicaments !</h1>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
        Bonjour ${userName || ""},
      </p>

      <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
        Votre compte a ete cree avec succes. Vous pouvez maintenant :
      </p>

      <ul style="color: #374151; font-size: 16px; margin: 0 0 24px; padding-left: 24px;">
        <li style="margin-bottom: 8px;">Rechercher des medicaments</li>
        <li style="margin-bottom: 8px;">Creer des alertes personnalisees</li>
        <li style="margin-bottom: 8px;">Recevoir des notifications par email</li>
      </ul>

      <a href="${process.env.NEXTAUTH_URL || "http://localhost:3001"}/medications"
         style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 16px;">
        Commencer a rechercher
      </a>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        AlerteMedicaments - Suivi des ruptures de medicaments en France
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
