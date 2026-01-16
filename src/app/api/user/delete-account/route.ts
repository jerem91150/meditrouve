import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { stripe, isStripeConfigured, getActiveSubscription } from "@/lib/stripe";
import { logAuditEvent } from "@/lib/audit-log";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "meditrouve-jwt-secret-2024";

// Get user from session or JWT token
async function getUser(request: NextRequest) {
  // Try session first
  const session = await getServerSession();
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    return user;
  }

  // Try JWT token
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
      return user;
    } catch {
      return null;
    }
  }

  return null;
}

// GDPR Right to Erasure / Right to be Forgotten (Art. 17 RGPD)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Require password confirmation for security
    const body = await request.json().catch(() => ({}));
    const { password, confirmPhrase } = body;

    // Verify confirmation phrase
    if (confirmPhrase !== "SUPPRIMER MON COMPTE") {
      return NextResponse.json(
        { error: "Veuillez confirmer la suppression en tapant 'SUPPRIMER MON COMPTE'" },
        { status: 400 }
      );
    }

    // Verify password if user has one
    if (user.password) {
      if (!password) {
        return NextResponse.json(
          { error: "Mot de passe requis pour confirmer la suppression" },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "Mot de passe incorrect" },
          { status: 401 }
        );
      }
    }

    // Log deletion for legal compliance (anonymized)
    const deletionLog = {
      action: "ACCOUNT_DELETION",
      userId: user.id, // Will be deleted
      email: user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // Partially anonymized
      timestamp: new Date().toISOString(),
      ip: request.headers.get("x-forwarded-for") || "unknown",
    };

    console.log("Account deletion requested:", deletionLog);

    // Annuler l'abonnement Stripe si existant
    if (user.stripeCustomerId && isStripeConfigured && stripe) {
      try {
        const subscription = await getActiveSubscription(user.stripeCustomerId);
        if (subscription) {
          await stripe.subscriptions.cancel(subscription.id);
          console.log("Stripe subscription cancelled:", subscription.id);
        }
        // Supprimer le customer Stripe
        await stripe.customers.del(user.stripeCustomerId);
      } catch (stripeError) {
        console.error("Error cancelling Stripe subscription:", stripeError);
        // Continue avec la suppression même si Stripe échoue
      }
    }

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: 'ACCOUNT_DELETED',
      resource: 'user',
      details: {
        email: deletionLog.email,
        ip: deletionLog.ip,
      },
    });

    // Deactivate push tokens first (soft delete)
    await prisma.pushToken.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    // Delete all user data in order (respecting foreign keys)
    // Prisma cascade will handle most relations, but we do it explicitly for clarity

    // 1. Delete notifications
    await prisma.notification.deleteMany({
      where: { userId: user.id },
    });

    // 2. Delete reminders (through profiles)
    const profiles = await prisma.profile.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    for (const profile of profiles) {
      await prisma.reminder.deleteMany({
        where: { profileId: profile.id },
      });
      await prisma.userMedication.deleteMany({
        where: { profileId: profile.id },
      });
    }

    // 3. Delete ordonnances
    await prisma.ordonnance.deleteMany({
      where: { userId: user.id },
    });

    // 4. Delete profiles
    await prisma.profile.deleteMany({
      where: { userId: user.id },
    });

    // 5. Delete alerts
    await prisma.alert.deleteMany({
      where: { userId: user.id },
    });

    // 6. Delete search history
    await prisma.searchHistory.deleteMany({
      where: { userId: user.id },
    });

    // 7. Delete pharmacy reports
    await prisma.pharmacyReport.deleteMany({
      where: { userId: user.id },
    });

    // 8. Delete family invites
    await prisma.familyInvite.deleteMany({
      where: { OR: [{ invitedById: user.id }, { invitedUserId: user.id }] },
    });

    // 9. Delete push tokens
    await prisma.pushToken.deleteMany({
      where: { userId: user.id },
    });

    // 10. Finally, delete the user
    await prisma.user.delete({
      where: { id: user.id },
    });

    // Store anonymized deletion record for compliance (3 years retention)
    // In production, you'd store this in a separate audit log

    return NextResponse.json({
      success: true,
      message: "Votre compte et toutes vos données ont été supprimés définitivement.",
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du compte" },
      { status: 500 }
    );
  }
}

// Get account deletion confirmation requirements
export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  return NextResponse.json({
    requiresPassword: !!user.password,
    confirmPhrase: "SUPPRIMER MON COMPTE",
    warning: "Cette action est irréversible. Toutes vos données seront définitivement supprimées.",
    dataToDelete: [
      "Profil et informations personnelles",
      "Médicaments suivis et alertes",
      "Historique de recherche",
      "Ordonnances scannées",
      "Préférences de notification",
      "Tous les profils famille",
    ],
  });
}
