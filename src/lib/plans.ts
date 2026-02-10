// Configuration des plans d'abonnement MediTrouve
// Philosophie : FREE généreux, PREMIUM pour les power users, FAMILLE pour les aidants

export type AlertFrequency = 'daily' | 'realtime';

export const PLANS = {
  FREE: {
    id: 'FREE',
    name: 'Gratuit',
    price: 0,
    priceId: null, // Pas de Stripe pour le gratuit
    description: 'Tout ce qu\'il faut pour suivre vos médicaments',
    features: {
      // Alertes
      alerts: {
        unlimited: true,
        types: ['RUPTURE', 'TENSION', 'AVAILABLE'], // Tous les types d'alertes
        alertFrequency: 'daily' as AlertFrequency, // Digest quotidien
      },
      // Profils
      profiles: {
        max: 1,
        description: '1 profil personnel',
      },
      // Recherche
      search: {
        unlimited: true,
        history: 30, // 30 jours d'historique
      },
      // Pharmacies
      pharmacies: {
        nearby: true,
        reports: true,
      },
      // Rappels de prise
      reminders: {
        enabled: true,
        max: 5, // 5 rappels max
        advanced: false, // Pas de gestion de stock
      },
      // OCR Ordonnance
      ocr: {
        enabled: true,
        monthlyLimit: 1, // 1 scan par mois
      },
      // Prédictions IA
      predictions: {
        enabled: false,
      },
      // Export données
      dataExport: {
        enabled: false,
      },
      // Historique complet
      fullHistory: {
        enabled: false,
      },
      // Publicités
      ads: true,
    },
  },

  PREMIUM: {
    id: 'PREMIUM',
    name: 'Premium',
    price: 2.99,
    priceYearly: 29.99, // ~2 mois offerts
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    priceIdYearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    description: 'Pour ceux qui veulent aller plus loin',
    features: {
      // Alertes
      alerts: {
        unlimited: true,
        types: ['RUPTURE', 'TENSION', 'AVAILABLE', 'PREDICTION', 'ANY_CHANGE'],
        predictions: true, // Alertes prédictives
        alertFrequency: 'realtime' as AlertFrequency, // Alertes temps réel
      },
      // Profils
      profiles: {
        max: 1,
        description: '1 profil personnel',
      },
      // Recherche
      search: {
        unlimited: true,
        history: -1, // Illimité
      },
      // Pharmacies
      pharmacies: {
        nearby: true,
        reports: true,
        priority: true, // Signalements prioritaires
      },
      // Rappels de prise
      reminders: {
        enabled: true,
        max: -1, // Illimité
        advanced: true, // Gestion de stock, alertes stock bas
      },
      // OCR Ordonnance
      ocr: {
        enabled: true,
        monthlyLimit: -1, // Illimité
      },
      // Prédictions IA
      predictions: {
        enabled: true,
      },
      // Export données
      dataExport: {
        enabled: true,
        formats: ['PDF', 'CSV', 'JSON'],
      },
      // Historique complet
      fullHistory: {
        enabled: true,
      },
      // Publicités
      ads: false,
    },
  },

  FAMILLE: {
    id: 'FAMILLE',
    name: 'Famille',
    price: 6.99,
    priceYearly: 69.99, // ~2 mois offerts
    priceId: process.env.STRIPE_FAMILLE_PRICE_ID,
    priceIdYearly: process.env.STRIPE_FAMILLE_YEARLY_PRICE_ID,
    description: 'Prenez soin de toute la famille',
    features: {
      // Alertes
      alerts: {
        unlimited: true,
        types: ['RUPTURE', 'TENSION', 'AVAILABLE', 'PREDICTION', 'ANY_CHANGE'],
        predictions: true,
        alertFrequency: 'realtime' as AlertFrequency, // Alertes temps réel
      },
      // Profils - La vraie différence
      profiles: {
        max: 5,
        description: 'Jusqu\'à 5 profils (parents, enfants...)',
        sharing: true, // Partage avec d'autres utilisateurs
        roles: ['viewer', 'editor'], // Rôles pour les aidants
      },
      // Invitations famille
      familyInvites: {
        enabled: true,
        max: 5, // 5 personnes peuvent voir/gérer
      },
      // Rappels
      reminders: {
        enabled: true,
        max: -1,
        advanced: true,
        familyNotifications: true, // Notifier les aidants
      },
      // OCR
      ocr: {
        enabled: true,
        monthlyLimit: -1,
      },
      // Prédictions
      predictions: {
        enabled: true,
      },
      // Export
      dataExport: {
        enabled: true,
        formats: ['PDF', 'CSV', 'JSON'],
        familyReport: true, // Rapport famille consolidé
      },
      // Historique
      fullHistory: {
        enabled: true,
      },
      // Publicités
      ads: false,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = typeof PLANS[PlanId];

// Limites par défaut pour vérification rapide
export const PLAN_LIMITS = {
  FREE: {
    maxProfiles: 1,
    maxReminders: 5,
    maxFamilyInvites: 0,
    searchHistoryDays: 30,
    hasOcr: true,
    maxOcrPerMonth: 1,
    alertFrequency: 'daily' as AlertFrequency,
    hasPredictions: false,
    hasDataExport: false,
    hasFullHistory: false,
    hasAds: true,
    hasFamilySharing: false,
    hasAdvancedReminders: false,
  },
  PREMIUM: {
    maxProfiles: 1,
    maxReminders: -1, // Illimité
    maxFamilyInvites: 0,
    searchHistoryDays: -1, // Illimité
    hasOcr: true,
    maxOcrPerMonth: -1, // Illimité
    alertFrequency: 'realtime' as AlertFrequency,
    hasPredictions: true,
    hasDataExport: true,
    hasFullHistory: true,
    hasAds: false,
    hasFamilySharing: false,
    hasAdvancedReminders: true,
  },
  FAMILLE: {
    maxProfiles: 5,
    maxReminders: -1,
    maxFamilyInvites: 5,
    searchHistoryDays: -1,
    hasOcr: true,
    maxOcrPerMonth: -1, // Illimité
    alertFrequency: 'realtime' as AlertFrequency,
    hasPredictions: true,
    hasDataExport: true,
    hasFullHistory: true,
    hasAds: false,
    hasFamilySharing: true,
    hasAdvancedReminders: true,
  },
} as const;

// Helper pour obtenir les limites d'un plan
export function getPlanLimits(plan: PlanId) {
  return PLAN_LIMITS[plan];
}

// Helper pour obtenir les infos d'un plan
export function getPlanInfo(plan: PlanId) {
  return PLANS[plan];
}

// Helper pour vérifier si une feature est disponible
export function hasFeature(plan: PlanId, feature: keyof typeof PLAN_LIMITS.FREE): boolean {
  const limits = PLAN_LIMITS[plan];
  const value = limits[feature];

  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return false;
}

// Helper pour vérifier une limite numérique
export function checkLimit(plan: PlanId, feature: keyof typeof PLAN_LIMITS.FREE, currentCount: number): boolean {
  const limits = PLAN_LIMITS[plan];
  const limit = limits[feature];

  if (typeof limit !== 'number') {
    return true;
  }
  if (limit === -1) {
    return true; // Illimité
  }
  return currentCount < limit;
}

// Comparaison des plans pour upgrade
export const PLAN_HIERARCHY: PlanId[] = ['FREE', 'PREMIUM', 'FAMILLE'];

export function canUpgrade(currentPlan: PlanId, targetPlan: PlanId): boolean {
  const currentIndex = PLAN_HIERARCHY.indexOf(currentPlan);
  const targetIndex = PLAN_HIERARCHY.indexOf(targetPlan);
  return targetIndex > currentIndex;
}

export function getUpgradeOptions(currentPlan: PlanId): PlanId[] {
  const currentIndex = PLAN_HIERARCHY.indexOf(currentPlan);
  return PLAN_HIERARCHY.slice(currentIndex + 1);
}
