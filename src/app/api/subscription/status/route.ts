// API Route pour vérifier le statut d'abonnement (utile pour sync mobile)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

import { getJwtSecret } from "@/lib/jwt-secret";

const JWT_SECRET = getJwtSecret();

export async function GET(request: NextRequest) {
  try {
    // Vérifier le token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: { userId?: string; sub?: string };

    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; sub?: string };
    } catch {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const userId = decoded.userId || decoded.sub;
    if (!userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        stripeCustomerId: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Calculer les limites du plan
    const planLimits = getPlanLimits(user.plan);

    return NextResponse.json({
      plan: user.plan,
      limits: planLimits,
      hasActiveSubscription: user.plan !== 'FREE',
      stripeCustomerId: user.stripeCustomerId ? true : false, // Ne pas exposer l'ID réel
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}

function getPlanLimits(plan: string) {
  switch (plan) {
    case 'PREMIUM':
      return {
        maxProfiles: 1,
        maxReminders: -1, // illimité
        hasOcr: true,
        hasPredictions: true,
        hasDataExport: true,
        hasFamilySharing: false,
      };
    case 'FAMILLE':
      return {
        maxProfiles: 5,
        maxReminders: -1,
        hasOcr: true,
        hasPredictions: true,
        hasDataExport: true,
        hasFamilySharing: true,
      };
    default: // FREE
      return {
        maxProfiles: 1,
        maxReminders: 5,
        hasOcr: false,
        hasPredictions: false,
        hasDataExport: false,
        hasFamilySharing: false,
      };
  }
}
