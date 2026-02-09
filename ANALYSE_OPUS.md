# 🔬 Analyse Approfondie — AlerteMedicaments (MediTrouve)

**Date :** 9 février 2026
**Analyste :** Claude Opus 4
**Repo :** https://github.com/jerem91150/alertemedicaments
**Version analysée :** 1.0.0

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture technique](#2-architecture-technique)
3. [Modèle de données](#3-modèle-de-données)
4. [API Endpoints](#4-api-endpoints)
5. [Flux utilisateur](#5-flux-utilisateur)
6. [Sécurité & RGPD](#6-sécurité--rgpd)
7. [Business Model](#7-business-model-freemium)
8. [Points forts](#8-points-forts)
9. [Faiblesses & Dettes techniques](#9-faiblesses--dettes-techniques)
10. [Recommandations techniques](#10-recommandations-techniques)
11. [Opportunités de croissance](#11-opportunités-de-croissance)
12. [Roadmap suggérée](#12-roadmap-suggérée)

---

## 1. Vue d'ensemble

### Pitch
MediTrouve est une application web de suivi des ruptures de médicaments en France, alimentée par les données de l'ANSM. Elle permet aux patients de rechercher des médicaments, recevoir des alertes de changement de statut, localiser des pharmacies, et gérer leurs traitements.

### Chiffres clés
| Métrique | Valeur |
|----------|--------|
| Fichiers TS/TSX | 134 |
| Lignes de code | ~22 270 |
| Modèles Prisma | 22 |
| API Routes | 51 fichiers |
| Lib/services | 17 fichiers |
| Pages frontend | ~30 |

### Stack technique
- **Frontend :** Next.js 16.1 (App Router), React 19, Tailwind CSS 4, Radix UI, Lucide icons
- **Backend :** Next.js API Routes (serverless), NextAuth 4 (JWT)
- **Base de données :** PostgreSQL via Prisma 5.22
- **Paiement :** Stripe (checkout, portal, webhooks)
- **Notifications :** Firebase Cloud Messaging (push), Nodemailer (email), Resend
- **Sécurité :** bcrypt, CryptoJS (AES-256), OTPAuth (2FA TOTP)
- **Scraping :** Cheerio (ANSM)
- **Déploiement :** Vercel

---

## 2. Architecture technique

### 2.1 Architecture globale

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  Next.js App Router (SSR/CSR)                   │
│  ├── Pages publiques (SEO: /, /ruptures, etc.)  │
│  ├── Dashboard utilisateur (/dashboard/*)       │
│  ├── Espace pharmacien (/pharmacien/*)          │
│  └── Pages légales (/cgu, /privacy, etc.)       │
└────────────────┬────────────────────────────────┘
                 │ API Routes
┌────────────────▼────────────────────────────────┐
│                   Backend                        │
│  51 API Routes (Next.js Route Handlers)         │
│  ├── /api/auth/*        (NextAuth + JWT mobile) │
│  ├── /api/medications/* (CRUD + recherche)      │
│  ├── /api/alerts/*      (gestion alertes)       │
│  ├── /api/pharmacies/*  (géoloc + signalements) │
│  ├── /api/stripe/*      (checkout + webhooks)   │
│  ├── /api/gamification/*(points + leaderboard)  │
│  ├── /api/pharmacien/*  (B2B)                   │
│  ├── /api/ocr/*         (ordonnance - disabled) │
│  ├── /api/reminders/*   (rappels de prise)      │
│  └── /api/user/*        (RGPD export/delete)    │
└────────────────┬────────────────────────────────┘
                 │ Prisma ORM
┌────────────────▼────────────────────────────────┐
│              PostgreSQL                          │
│  22 tables, relations cascadées                 │
└─────────────────────────────────────────────────┘

Services externes :
  ├── ANSM (scraping ruptures/tensions)
  ├── Stripe (paiements)
  ├── Firebase (push notifications)
  ├── Nominatim/OpenStreetMap (géocodage)
  └── Resend/Nodemailer (emails)
```

### 2.2 Organisation du code

```
src/
├── app/
│   ├── (auth)/           # Login, register
│   ├── (dashboard)/      # Pages protégées (alertes, profil, rappels, etc.)
│   ├── (legal)/          # CGU, mentions légales, confidentialité
│   ├── api/              # 51 route handlers
│   ├── medicament/[slug] # Page SEO dynamique par médicament
│   ├── pharmacien/       # Espace B2B pharmaciens
│   ├── pour-pharmaciens/ # Landing B2B
│   ├── r/[code]/         # Parrainage
│   └── *-rupture/        # Pages SEO statiques (Ozempic, Doliprane, Amoxicilline)
├── components/           # Composants réutilisables
├── lib/                  # Services métier (17 fichiers)
├── providers/            # SessionProvider (NextAuth)
└── types/                # Types Next-Auth augmentés
```

### 2.3 Patterns architecturaux

- **Dual auth** : NextAuth (sessions web) + JWT custom (mobile)
- **Plan guard pattern** : Middleware vérifiant les limites du plan avant chaque action payante
- **Fallback gracieux** : Données de démo si la DB est indisponible
- **Rate limiting** : In-memory Map dans le middleware (pas Redis)
- **Audit logging** : Événements de sécurité loggés en DB (via table Notification)

---

## 3. Modèle de données

### 3.1 Diagramme des relations

```
User (1) ──── (N) Profile ──── (N) UserMedication ──── (1) Medication
  │                 │                    │
  │                 └── (N) Reminder     │
  │                 └── (N) Ordonnance   │
  │                                      │
  ├── (N) Alert ────────────────────── (1) Medication
  ├── (N) SearchHistory                  │
  ├── (N) PharmacyReport ──────────── (1) Medication
  │        └── (1) Pharmacy              │
  ├── (N) FamilyInvite                   ├── (N) StatusHistory
  ├── (N) PushToken                      └── (N) PharmacyReport
  ├── (1) UserPoints
  │        └── (N) UserReward ── (1) Reward
  └── (N) Notification

PharmacyAccount ──── (1?) Pharmacy
Prediction (standalone, lié par medicationId)
SyncLog (standalone)
CityCache (standalone)
```

### 3.2 Modèles clés

**22 modèles** organisés en 8 domaines :

| Domaine | Modèles | Description |
|---------|---------|-------------|
| **Utilisateurs** | `User`, `Profile` | Auth + mode famille (relation self/parent/child) |
| **Médicaments** | `Medication`, `StatusHistory`, `UserMedication` | Données ANSM + suivi personnel |
| **Alertes** | `Alert`, `Notification` | Alertes par type (rupture/tension/dispo) |
| **Pharmacies** | `Pharmacy`, `PharmacyReport`, `PharmacyAccount` | Géoloc + signalements communautaires + B2B |
| **Rappels** | `Reminder` | Rappels de prise avec statut (taken/skipped/postponed) |
| **OCR** | `Ordonnance` | Scan d'ordonnance (désactivé) |
| **Gamification** | `UserPoints`, `Reward`, `UserReward` | Points, niveaux, récompenses |
| **Infrastructure** | `SyncLog`, `CityCache`, `PushToken`, `Prediction` | Logs, cache, notifications, ML |

### 3.3 Enums remarquables

```prisma
enum MedicationStatus { AVAILABLE, TENSION, RUPTURE, UNKNOWN }
enum SubscriptionPlan { FREE, PREMIUM, FAMILLE }
enum UserLevel { NEWBIE, CONTRIBUTOR, SUPER_CONTRIBUTOR, AMBASSADOR, LEGEND }
enum AlertType { RUPTURE, TENSION, AVAILABLE, PREDICTION, ANY_CHANGE }
enum ReminderStatus { PENDING, SENT, TAKEN, SKIPPED, POSTPONED }
```

### 3.4 Observations sur le schéma

- **Bonne utilisation des index** : Index sur les FK, champs de recherche, et statuts
- **Contraintes d'unicité** bien placées : `[userId, medicationId]` sur Alert, `[profileId, medicationId]` sur UserMedication
- **Cascade delete** : Bien configuré depuis User → enfants
- **⚠️ Pas de soft delete** : Suppression physique partout
- **⚠️ Notification comme fourre-tout** : La table Notification est utilisée aussi pour l'audit log

---

## 4. API Endpoints

### 4.1 Inventaire complet (51 routes)

#### Authentification (8 routes)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth (login/session web) |
| POST | `/api/auth/register` | Inscription web |
| POST | `/api/auth/mobile/login` | Login mobile (JWT) |
| POST | `/api/auth/mobile/register` | Inscription mobile (JWT) |
| GET | `/api/auth/profile` | Profil utilisateur |
| POST | `/api/auth/2fa/setup` | Configuration 2FA |
| POST | `/api/auth/2fa/verify` | Vérification TOTP |
| POST | `/api/auth/2fa/disable` | Désactivation 2FA |
| GET | `/api/auth/2fa/backup-codes` | Codes de secours |

#### Médicaments (5 routes)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/medications` | Liste + recherche |
| GET | `/api/medications/[id]` | Détail d'un médicament |
| GET | `/api/medications/[id]/alternatives` | Alternatives thérapeutiques |
| GET | `/api/medications/trending` | Médicaments tendance |
| GET | `/api/search` | Recherche full-text |
| GET | `/api/suggestions` | Auto-complétion |

#### Alertes (3 routes)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET/POST | `/api/alerts` | CRUD alertes |
| DELETE | `/api/alerts/[id]` | Suppression alerte |
| GET/POST | `/api/alerts/mobile` | Alertes (auth JWT) |

#### Pharmacies (4 routes)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/pharmacies/search` | Recherche par ville |
| GET | `/api/pharmacies/nearby` | Géolocalisation |
| POST | `/api/pharmacies/report` | Signalement communautaire |
| POST | `/api/pharmacies/verify` | Vérification de signalement |

#### Pharmacien B2B (6 routes)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/pharmacien/auth` | Auth pharmacien |
| GET | `/api/pharmacien/stats` | Statistiques |
| GET/POST | `/api/pharmacien/ruptures` | Gestion des ruptures |
| GET | `/api/pharmacien/mes-signalements` | Mes signalements |
| POST | `/api/pharmacien/api-key` | Génération clé API |
| GET | `/api/pharmacien/qr-code` | QR code pharmacie |
| POST | `/api/pharmacien/demo-request` | Demande de démo |

#### Paiement (4 routes)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/stripe/checkout` | Création session checkout |
| POST | `/api/stripe/portal` | Portail client Stripe |
| POST | `/api/stripe/webhook` | Webhooks Stripe |
| GET | `/api/subscription/status` | Statut abonnement |

#### Gamification (3 routes)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/gamification/points` | Points utilisateur |
| GET | `/api/gamification/leaderboard` | Classement |
| POST | `/api/gamification/rewards` | Réclamer récompense |

#### Autres (6+ routes)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/ocr/ordonnance` | OCR (désactivé - 503) |
| GET/POST | `/api/reminders` | Rappels de prise |
| DELETE | `/api/reminders/[id]` | Suppression rappel |
| GET/POST | `/api/profiles` | Gestion profils |
| GET | `/api/user/data-export` | Export RGPD |
| DELETE | `/api/user/delete-account` | Suppression compte |
| GET | `/api/cron/sync` | Sync ANSM |
| GET | `/api/health` | Health check |
| POST | `/api/contact` | Formulaire contact |
| POST | `/api/referral` | Parrainage |
| GET | `/api/geocode/cities` | Géocodage villes |
| GET | `/api/v1/pharmacies` | API publique v1 |

---

## 5. Flux utilisateur

### 5.1 Flux principal — Recherche de médicament

```
Utilisateur → Page d'accueil → Saisie dans la barre de recherche
  ↓
Auto-complétion (/api/suggestions) → Affichage suggestions temps réel
  ↓
Sélection/Validation → /api/search → Résultats avec statut (🟢 Disponible / 🟡 Tension / 🔴 Rupture)
  ↓
Clic sur un médicament → /medicament/[slug] (page SEO)
  ├── Alternatives thérapeutiques (/api/medications/[id]/alternatives)
  ├── Pharmacies à proximité (/api/pharmacies/nearby)
  └── Bouton "Créer une alerte" → /api/alerts (POST)
```

### 5.2 Flux alertes

```
Création d'alerte (type: RUPTURE | TENSION | AVAILABLE | ANY_CHANGE)
  ↓
Cron job (/api/cron/sync) → Scraping ANSM (toutes les X heures)
  ↓
Changement de statut détecté → StatusHistory créé
  ↓
notifyUsersOfStatusChange() → Filtrage par type d'alerte + préférences
  ↓
Firebase Push + Notification en DB → Notification utilisateur
```

### 5.3 Flux pharmacien B2B

```
Inscription → /pharmacien/inscription (email + FINESS + SIRET)
  ↓
Vérification manuelle (status: PENDING → VERIFIED)
  ↓
Dashboard → /pharmacien/dashboard
  ├── Statistiques (/api/pharmacien/stats)
  ├── Signaler ruptures (/api/pharmacien/ruptures)
  ├── Générer clé API (/api/pharmacien/api-key)
  └── Kit communication + QR code
```

### 5.4 Flux gamification

```
Signalement communautaire (report pharmacy availability)
  ↓
processSignalPoints() → Attribution points de base (5-10 pts)
  ├── Bonus premier du jour (+3 pts)
  ├── Bonus streak 7j (+20 pts) / 30j (+100 pts)
  └── Bonus vérification par pair (+5 pts)
  ↓
Calcul niveau → NEWBIE (0) → CONTRIBUTOR (50) → SUPER_CONTRIBUTOR (200) → AMBASSADOR (500) → LEGEND (1000)
  ↓
Échange points contre récompenses (semaines/mois Premium, badges)
```

### 5.5 Flux Stripe (abonnement)

```
/pricing → Choix plan (Premium 3.99€/mois | Famille 7.99€/mois)
  ↓
/api/stripe/checkout → Stripe Checkout Session (locale FR, promo codes)
  ↓
Paiement réussi → Webhook customer.subscription.created
  ↓
handleSubscriptionCreated() → Mise à jour User.plan en DB
  ↓
Gestion → /api/stripe/portal (annulation, changement, factures)
  ↓
Annulation → Webhook customer.subscription.deleted → Plan → FREE
```

---

## 6. Sécurité & RGPD

### 6.1 Mesures de sécurité implémentées

| Mesure | Implémentation | Qualité |
|--------|----------------|---------|
| **Hashing mots de passe** | bcrypt | ✅ Solide |
| **JWT sessions** | NextAuth JWT strategy | ✅ Standard |
| **2FA TOTP** | OTPAuth + QR code + backup codes | ✅ Complet |
| **Chiffrement au repos** | CryptoJS AES-256 (données santé) | ⚠️ Voir remarques |
| **Rate limiting** | In-memory Map dans middleware | ⚠️ Non distribué |
| **CSP headers** | Content-Security-Policy complet | ✅ Bon |
| **HSTS** | max-age=31536000 + preload | ✅ Excellent |
| **Protection XSS** | X-XSS-Protection + CSP | ✅ |
| **Protection clickjacking** | X-Frame-Options: DENY | ✅ |
| **Referrer Policy** | strict-origin-when-cross-origin | ✅ |
| **Permissions Policy** | Camera self, geo self, micro off | ✅ |
| **Audit logging** | Events sécurité → DB | ⚠️ Via table Notification |
| **Validation input** | Zod schemas (validations.ts - 239 lignes) | ✅ |
| **Stripe webhook** | Signature verification | ✅ |

### 6.2 Conformité RGPD

| Droit RGPD | Implémentation | Statut |
|-------------|---------------|--------|
| **Droit d'accès (Art. 15)** | `/api/user/data-export` | ✅ |
| **Droit de portabilité (Art. 20)** | Export JSON complet | ✅ |
| **Droit à l'effacement (Art. 17)** | `/api/user/delete-account` avec confirmation | ✅ |
| **Registre des traitements (Art. 30)** | `docs/REGISTRE_TRAITEMENTS_RGPD.md` | ✅ |
| **Consentement cookies** | `CookieConsent` component | ✅ |
| **Mentions légales** | Pages dédiées (CGU, confidentialité) | ✅ |
| **Base légale santé (Art. 9.2.a)** | Consentement explicite documenté | ✅ |
| **DPO désigné** | dpo@alertemedicaments.fr (à compléter) | ⚠️ |
| **Notification violation** | Non implémenté | ❌ |

### 6.3 Points de vigilance sécurité

1. **JWT Secret en dur** : `"meditrouve-jwt-secret-2024"` comme fallback — risque critique en prod
2. **Encryption key fallback** : `ENCRYPTION_KEY` tombe sur `JWT_SECRET` puis sur un défaut
3. **CryptoJS côté serveur** : Préférer `crypto` natif de Node.js (plus performant, audité)
4. **Rate limiting en mémoire** : Perdu au redéploiement Vercel (serverless = pas de state)
5. **CSP avec `unsafe-inline` + `unsafe-eval`** : Affaiblit la protection XSS
6. **OCR désactivé** : Bonne décision — nécessite hébergement HDS (Hébergeur Données de Santé)

---

## 7. Business Model (Freemium)

### 7.1 Plans tarifaires

| Feature | FREE | PREMIUM (3.99€/mois) | FAMILLE (7.99€/mois) |
|---------|------|----------------------|----------------------|
| Alertes illimitées | ✅ | ✅ | ✅ |
| Types d'alertes | 3 types | 5 types + prédictif | 5 types + prédictif |
| Profils | 1 | 1 | **5** |
| Rappels de prise | 5 max | ♾️ | ♾️ |
| Gestion de stock | ❌ | ✅ | ✅ |
| OCR ordonnance | ❌ | ✅ | ✅ |
| Prédictions IA | ❌ | ✅ | ✅ |
| Export données | ❌ | ✅ | ✅ |
| Historique complet | ❌ | ✅ | ✅ |
| Partage famille | ❌ | ❌ | ✅ (5 aidants) |
| Publicités | ✅ | ❌ | ❌ |
| Prix annuel | - | 39.99€ (~2 mois offerts) | 79.99€ |

### 7.2 Analyse du modèle

**Forces :**
- FREE très généreux (alertes illimitées) → acquisition facile
- Différenciation claire PREMIUM vs FAMILLE (profils = killer feature pour aidants)
- Prix annuel avec ~2 mois offerts → bonne incitation
- Gamification qui offre du Premium → viralité
- Codes promo activés dans Stripe Checkout

**Faiblesses :**
- Pas de trial Premium pour convertir les free users
- Pas de plan B2B pharmacien tarifé (potentiel revenu important)
- Les prédictions IA ne sont pas encore implémentées (promesse sans livraison)
- L'OCR est désactivé — 2 features premium sur 3 sont absentes

### 7.3 Revenue streams potentiels

1. **B2C Abonnements** : Premium + Famille
2. **B2B Pharmaciens** : Dashboard, API, kit communication (non tarifé actuellement)
3. **Publicité** : Affichée aux free users (non implémenté)
4. **API v1** : `/api/v1/pharmacies` — potentiel API payante

---

## 8. Points forts

### 🏗️ Architecture
- **App Router Next.js** bien structuré avec route groups `(auth)`, `(dashboard)`, `(legal)`
- **Séparation claire** frontend/API/services métier
- **Plan guard pattern** élégant pour le freemium
- **SEO-first** : pages statiques par médicament populaire, sitemap, robots.txt, OpenGraph, structured data

### 🔒 Sécurité
- **2FA complet** avec TOTP + backup codes + chiffrement des secrets
- **Headers de sécurité** exhaustifs (CSP, HSTS, etc.)
- **Suppression de compte** rigoureuse avec confirmation phrase + password + annulation Stripe
- **Export RGPD** bien implémenté avec anonymisation

### 📊 Données
- **Import BDPM** (Base de Données Publique des Médicaments) avec fichiers de données inclus
- **Scraping ANSM** automatisé avec historique de statut
- **Signalements communautaires** avec vérification par pairs et expiration 24h

### 🎮 Engagement
- **Gamification bien pensée** : points, niveaux, streaks, leaderboard, récompenses Premium
- **Parrainage** avec codes personnalisés
- **Mode famille** pour les aidants (cas d'usage différenciant)

### 📱 Mobile-ready
- **Dual auth** (NextAuth web + JWT mobile)
- **Push notifications** Firebase multi-plateforme (Android, iOS, Web)
- **API mobile** dédiées (`/api/alerts/mobile`, `/api/auth/mobile/*`)

---

## 9. Faiblesses & Dettes techniques

### 🔴 Critiques

1. **Rate limiting volatil** — In-memory Map perdu à chaque cold start Vercel. Inutile en production serverless.

2. **Secrets en dur en fallback** :
   ```typescript
   const JWT_SECRET = process.env.JWT_SECRET || "meditrouve-jwt-secret-2024";
   const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "default-encryption-key-change-me";
   ```
   → En cas d'env var manquante, n'importe qui peut forger des JWT.

3. **Prisma Client instancié dans auth.ts** :
   ```typescript
   const prisma = new PrismaClient(); // Nouveau client à chaque import
   ```
   Alors qu'un singleton existe dans `lib/prisma.ts`. Risque de connection pool exhaustion.

4. **Audit log dans la table Notification** — Mélange d'événements de sécurité et de notifications utilisateur. Impossible à requêter proprement.

### 🟡 Importants

5. **Scraping ANSM fragile** — Les sélecteurs CSS (`".medication-row, .rupture-item, tr[data-medication]"`) sont génériques et probablement pas alignés avec le DOM réel de l'ANSM. Le scraper retournerait 0 résultats.

6. **Pas de tests** — Aucun fichier de test trouvé (pas de Jest, Vitest, Playwright, etc.)

7. **Pas de CI/CD** — Pas de `.github/workflows/`, pas de tests automatisés

8. **Email service dual** — `Resend` et `Nodemailer` dans les dépendances, logique de choix peu claire

9. **Features premium non livrées** :
   - OCR ordonnance → 503 "bientôt disponible"
   - Prédictions IA → Modèle `Prediction` en DB mais aucune logique ML
   - Publicités → `ads: true` dans le plan FREE mais pas d'implémentation

10. **Pas de cache** — Aucun Redis, aucun ISR/revalidation configuré. Chaque recherche frappe la DB.

### 🟢 Mineurs

11. **`next: "16.1.1"`** dans package.json mais le brief mentionne Next.js 15 — version incohérente
12. **CryptoJS** (bibliothèque JS pure) utilisé côté serveur au lieu de `node:crypto`
13. **Pas de pagination** sur les endpoints de liste
14. **Pas de Dockerfile** — Dépendance totale à Vercel
15. **Stripe API version** `2025-12-15.clover` — version très récente, vérifier la stabilité

---

## 10. Recommandations techniques

### Priorité 1 — Sécurité (immédiat)

```typescript
// ❌ Avant
const JWT_SECRET = process.env.JWT_SECRET || "meditrouve-jwt-secret-2024";

// ✅ Après — Fail fast si pas configuré
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");
```

```typescript
// ❌ Avant (auth.ts)
const prisma = new PrismaClient();

// ✅ Après — Utiliser le singleton
import prisma from "@/lib/prisma";
```

- **Remplacer le rate limiting** par Vercel Edge Config ou Upstash Redis
- **Migrer CryptoJS** vers `node:crypto` natif
- **Créer une table AuditLog** dédiée (séparée de Notification)

### Priorité 2 — Fiabilité (court terme)

- **Remplacer le scraping ANSM** par l'API officielle de la BDPM ou les fichiers open data ANSM (déjà présents dans `/data/`)
- **Ajouter des tests** : au minimum tests API avec Vitest + supertest
- **CI/CD** : GitHub Actions (lint + type-check + tests + deploy preview)
- **Ajouter du cache** : `unstable_cache` Next.js ou Redis pour les recherches fréquentes

### Priorité 3 — Fonctionnel (moyen terme)

- **Implémenter l'OCR** via un provider HDS (OVHcloud Healthcare, Clever Cloud)
- **Modèle de prédiction** : commencer par un heuristique simple (saisonnalité + historique) avant du vrai ML
- **Notifications email** : consolider sur Resend (plus fiable que Nodemailer en serverless)
- **Pagination** sur tous les endpoints de liste
- **API versionnée** : étendre `/api/v1/` pour tous les endpoints publics

### Priorité 4 — Performance (long terme)

- **ISR (Incremental Static Regeneration)** pour les pages médicaments populaires
- **Connection pooling** : PgBouncer ou Prisma Accelerate
- **Edge runtime** pour les endpoints de recherche
- **Soft delete** sur les entités critiques (User, Alert)

---

## 11. Opportunités de croissance

### 11.1 B2B Pharmaciens (revenu majeur potentiel)

L'espace pharmacien est construit mais pas monétisé. Opportunités :
- **Abonnement Pro** : 49-149€/mois (dashboard analytics, signalements prioritaires, API)
- **Référencement prioritaire** : pharmacies payantes affichées en premier
- **API pour logiciels de pharmacie** : intégration avec les LGO (Winpharma, LGPI, etc.)

### 11.2 Partenariats institutionnels

- **ANSM** : devenir relai officiel (au lieu de scraper)
- **ARS (Agences Régionales de Santé)** : données de terrain via les signalements
- **Assurance maladie** : intégration avec Mon Espace Santé

### 11.3 Extension géographique

- **Belgique, Suisse, Luxembourg** (francophonie + réglementations proches)
- **Europe** : EMA (European Medicines Agency) a des données similaires

### 11.4 App mobile native

- Les API mobiles sont prêtes (JWT, push tokens)
- React Native ou Expo pour capitaliser sur le code existant
- Les pharmacies de proximité + rappels de prise sont des use cases naturellement mobiles

### 11.5 Données et analytics

- **Vente de données agrégées anonymisées** aux laboratoires pharmaceutiques
- **Tableau de bord public** des ruptures (type data.gouv.fr)
- **Prédictions ML** valorisables auprès des grossistes-répartiteurs

---

## 12. Roadmap suggérée

### Phase 1 — Stabilisation (0-3 mois) 🔧

- [ ] Corriger les failles de sécurité (secrets, singleton Prisma)
- [ ] Remplacer le scraping par l'API/open data ANSM
- [ ] Ajouter Upstash Redis (rate limiting + cache)
- [ ] Tests unitaires et d'intégration (couverture >60%)
- [ ] CI/CD GitHub Actions
- [ ] Table AuditLog dédiée
- [ ] Monitoring (Sentry ou équivalent)

### Phase 2 — Complétion MVP (3-6 mois) 🚀

- [ ] OCR ordonnance (hébergeur HDS certifié)
- [ ] Prédictions simples (heuristiques saisonnières)
- [ ] App mobile (Expo/React Native)
- [ ] Notifications email fonctionnelles (Resend)
- [ ] Trial 7 jours Premium (conversion free → paid)
- [ ] Affichage publicités pour free users (Google AdSense ou Criteo Santé)

### Phase 3 — Monétisation B2B (6-12 mois) 💰

- [ ] Plan Pharmacien Pro (SaaS tarifé)
- [ ] API publique v1 documentée (Swagger)
- [ ] Intégration LGO (logiciels de gestion officine)
- [ ] Kit widget embarquable pour sites pharmacies
- [ ] Premiers partenariats institutionnels

### Phase 4 — Scale (12-24 mois) 📈

- [ ] Extension Belgique/Suisse
- [ ] ML prédictif (TensorFlow.js ou API Python)
- [ ] Tableau de bord public open data
- [ ] API payante pour laboratoires
- [ ] Certification ISO 27001 / HDS complète

---

## Conclusion

MediTrouve est un projet **ambitieux et bien conçu** avec une vision produit claire. Le schéma de données est riche et bien pensé, le modèle freemium est équilibré, et les fondations sécurité/RGPD sont sérieuses.

Les principales urgences sont :
1. **Sécurité** : supprimer les secrets en fallback, fixer le singleton Prisma
2. **Fiabilité** : le scraper ANSM est probablement non fonctionnel
3. **Tests** : zéro couverture = risque de régressions à chaque changement

Le potentiel de croissance est réel, notamment sur le **B2B pharmacien** (marché estimé à ~22 000 pharmacies en France) et l'**app mobile** (les API sont déjà prêtes).

**Score global : 7/10** — Excellentes fondations, mais plusieurs features premium promues ne sont pas encore livrées, et des vulnérabilités de sécurité doivent être corrigées avant mise en production.

---

*Rapport généré le 9 février 2026 par Claude Opus 4*
