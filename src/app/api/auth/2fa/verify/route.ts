// API Route pour vérifier le 2FA lors de la connexion
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyTwoFactor } from '@/lib/two-factor';
import { logAuditEvent, getRequestInfo } from '@/lib/audit-log';
import jwt from 'jsonwebtoken';

import { getJwtSecret } from "@/lib/jwt-secret";

const JWT_SECRET = getJwtSecret();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token } = body;

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'ID utilisateur et code requis' },
        { status: 400 }
      );
    }

    // Get user with 2FA info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        backupCodes: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA non activé pour cet utilisateur' },
        { status: 400 }
      );
    }

    // Verify the token
    const verifyResult = verifyTwoFactor(
      token,
      user.twoFactorSecret!,
      user.backupCodes
    );

    const requestInfo = getRequestInfo(request);

    if (!verifyResult.valid) {
      // Log failed attempt
      await logAuditEvent({
        action: 'LOGIN_FAILED',
        userId: user.id,
        email: user.email,
        success: false,
        errorMessage: 'Invalid 2FA token',
        ...requestInfo,
      });

      return NextResponse.json(
        { error: 'Code invalide' },
        { status: 401 }
      );
    }

    // If backup code was used, update remaining codes
    if (verifyResult.method === 'backup' && verifyResult.remainingBackupCodes) {
      await prisma.user.update({
        where: { id: user.id },
        data: { backupCodes: verifyResult.remainingBackupCodes },
      });
    }

    // Log successful 2FA verification
    await logAuditEvent({
      action: 'LOGIN_SUCCESS',
      userId: user.id,
      email: user.email,
      success: true,
      details: { method: verifyResult.method, twoFactor: true },
      ...requestInfo,
    });

    // Generate a temporary token for completing login
    const verificationToken = jwt.sign(
      { userId: user.id, twoFactorVerified: true },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    return NextResponse.json({
      success: true,
      verificationToken,
      method: verifyResult.method,
      backupCodesRemaining: verifyResult.method === 'backup'
        ? verifyResult.remainingBackupCodes?.length
        : undefined,
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}
