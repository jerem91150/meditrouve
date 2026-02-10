# 🔍 AUDIT COMPLET — MediTrouve
**Date :** 10 février 2026  
**Auditeur :** Audit automatisé senior full-stack  
**Scope :** Sécurité, Performance, Code Quality, SEO, UX, Infra  
**Stack :** Next.js 15+, TypeScript, Prisma, PostgreSQL, Stripe, Resend, Vercel

---

## Score Global : 52/100

> Projet ambitieux avec de bonnes bases mais des failles de sécurité critiques qui BLOQUENT le lancement.

---

## 1. 🔒 SÉCURITÉ (Score : 35/100)

### 🔴 CRITIQUE — Routes admin outreach sans AUCUNE authentification

**Fichiers :** `src/app/api/admin/outreach/campaigns/route.ts`, `src/app/api/admin/outreach/contacts/route.ts` et toutes les routes sous `/api/admin/outreach/`

**Problème :** Aucun check d'authentification ni de rôle admin. N'importe qui peut :
- Lister/créer/supprimer des contacts outreach
- Créer des campagnes d'emailing
- Envoyer des emails en masse
- Importer des CSV de contacts

```typescript
// campaigns/route.ts — AUCUN auth check
export async function GET() {
  const campaigns = await prisma.outreachCampaign.findMany({...});
  return NextResponse.json(enriched);
}
```

**Fix :** Ajouter un middleware admin avec vérification de session + rôle admin. Ajouter un champ `role` au modèle User.

---

### 🔴 CRITIQUE — Pages admin outreach accessibles sans auth

**Fichiers :** `src/app/admin/outreach/page.tsx`, `src/app/admin/outreach/contacts/page.tsx`, `src/app/admin/outreach/campaigns/[id]/page.tsx`

**Problème :** Pas de protection côté client ni serveur. Tout visiteur peut accéder à `/admin/outreach`.

**Fix :** Ajouter un layout admin avec guard d'authentification + vérification rôle.

---

### 🔴 CRITIQUE — XSS dans le formulaire de contact

**Fichier :** `src/app/api/contact/route.ts`

```typescript
html: `<p>${message.replace(/\n/g, '<br>')}</p>`
```

**Problème :** Le message utilisateur est injecté directement dans du HTML sans sanitization. Un attaquant peut injecter du JavaScript via le formulaire de contact qui sera exécuté quand l'admin ouvre l'email.

**Fix :** Utiliser `sanitizeHtml()` de `validation.ts` avant injection dans le template email, ou utiliser une lib comme DOMPurify côté serveur.

---

### 🔴 CRITIQUE — Rate limiting in-memory (non-persistant, bypassable)

**Fichier :** `src/middleware.ts`

```typescript
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
```

**Problème :** 
- En-mémoire = reset à chaque redéploiement Vercel
- Vercel = serverless = chaque instance a sa propre Map = rate limit inefficace
- Un attaquant peut brute-force les mots de passe sans limite réelle

**Fix :** Utiliser Vercel KV (Redis) ou Upstash pour le rate limiting. Ou au minimum `@vercel/edge-config`.

---

### 🔴 CRITIQUE — Pas de vérification d'email à l'inscription

**Fichier :** `src/app/api/auth/register/route.ts`

**Problème :** L'utilisateur est créé sans vérification d'email. Le champ `emailVerified` reste `null`. N'importe qui peut s'inscrire avec une fausse adresse et spammer le système.

**Fix :** Envoyer un email de vérification avec un token unique. Bloquer l'accès au dashboard tant que l'email n'est pas vérifié.

---

### 🟡 IMPORTANT — CSP trop permissif

```
script-src 'self' 'unsafe-inline' 'unsafe-eval'
```

**Problème :** `unsafe-inline` et `unsafe-eval` annulent une grande partie de la protection CSP contre les XSS.

**Fix :** Utiliser des nonces pour les scripts inline. Supprimer `unsafe-eval` si possible.

---

### 🟡 IMPORTANT — Encryption key fallback sur JWT_SECRET

**Fichier :** `src/lib/jwt-secret.ts`

```typescript
export function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn("[SECURITY] ENCRYPTION_KEY not set — falling back to JWT_SECRET.");
    return getRequiredEnv("JWT_SECRET");
  }
  return key;
}
```

**Problème :** Si `ENCRYPTION_KEY` n'est pas défini, les données de santé chiffrées utilisent la même clé que les JWT. Compromission d'un = compromission de tout.

**Fix :** Rendre `ENCRYPTION_KEY` obligatoire en production (throw au lieu de fallback).

---

### 🟡 IMPORTANT — Sel de dérivation de clé hardcodé

**Fichier :** `src/lib/encryption.ts`

```typescript
return scryptSync(secret, "meditrouve-salt", 32);
```

**Problème :** Le sel est statique et hardcodé. Réduit la résistance aux attaques par rainbow table.

**Fix :** Générer un sel aléatoire par opération de chiffrement et le stocker avec les données chiffrées.

---

### 🟡 IMPORTANT — Deux fichiers de validation dupliqués

**Fichiers :** `src/lib/validation.ts` ET `src/lib/validations.ts`

**Problème :** Duplication de code avec des règles différentes (ex: le mot de passe dans `validation.ts` exige un caractère spécial, pas dans `validations.ts`). Confusion sur lequel utiliser. Le fichier `register/route.ts` utilise directement zod au lieu de l'un ou l'autre.

**Fix :** Fusionner en un seul fichier. Utiliser les schémas centralisés partout.

---

### 🟡 IMPORTANT — CRON_SECRET optionnel

**Fichier :** `src/app/api/cron/sync/route.ts`

```typescript
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
```

**Problème :** Si `CRON_SECRET` n'est pas défini, le endpoint est accessible sans auth. N'importe qui peut déclencher une synchro ANSM.

**Fix :** Rendre CRON_SECRET obligatoire. Vercel envoie automatiquement un header `Authorization` pour les crons configurés.

---

### 🟢 OK — Stripe webhook signature verification

La vérification de signature Stripe est correctement implémentée avec `stripe.webhooks.constructEvent()`.

### 🟢 OK — Bcrypt pour les mots de passe (cost factor 12)

### 🟢 OK — Prisma (pas d'injection SQL directe possible)

### 🟢 OK — RGPD : suppression de compte et export de données implémentés

### 🟢 OK — Headers de sécurité (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)

### 🟢 OK — Cookie consent en place

---

## 2. ⚡ PERFORMANCE (Score : 55/100)

### 🟡 IMPORTANT — Page d'accueil entièrement client-side ("use client")

**Fichier :** `src/app/page.tsx`

**Problème :** La homepage est un composant client avec `"use client"`. Tout le contenu SEO-critique (recherche, liste de médicaments) est rendu côté client uniquement. Cela impacte :
- Le FCP (First Contentful Paint)
- Le LCP (Largest Contentful Paint)
- Le SEO (le contenu initial est vide pour les crawlers)

**Fix :** Extraire les parties statiques (hero, features, footer) en Server Components. Garder `"use client"` uniquement pour la barre de recherche interactive.

---

### 🟡 IMPORTANT — Pas de caching des requêtes Prisma

**Problème :** Aucune stratégie de cache visible pour les requêtes fréquentes (liste de médicaments, statuts). Chaque visite génère des requêtes DB.

**Fix :** Utiliser `unstable_cache` de Next.js ou ISR avec `revalidate` pour les pages de médicaments. Ajouter un cache Redis pour les recherches fréquentes.

---

### 🟡 IMPORTANT — N+1 potentiel dans outreach campaigns

**Fichier :** `src/app/api/admin/outreach/campaigns/route.ts`

```typescript
const enriched = await Promise.all(
  campaigns.map(async (c) => {
    const stats = await prisma.outreachEmail.groupBy({...});
  })
);
```

**Problème :** Une requête par campagne pour les stats. Si 100 campagnes = 101 requêtes.

**Fix :** Faire un seul `groupBy` avec tous les campaignIds et restructurer côté serveur.

---

### 🟢 OK — Prisma singleton correctement implémenté (pas de connection pool leak en dev)

### 🟢 OK — Indexes Prisma bien placés sur les champs de recherche

---

## 3. 🧹 CODE QUALITY (Score : 50/100)

### 🔴 CRITIQUE — ZÉRO test

**Problème :** Aucun fichier `.test.ts`, `.spec.ts`, ni configuration de test (pas de Jest, Vitest, Playwright, Cypress). Zéro couverture.

**Fix :** Au minimum, ajouter des tests pour :
- Les routes API critiques (auth, Stripe webhook, alerts)
- Les fonctions de validation
- Les fonctions de chiffrement
- E2E pour le parcours inscription → alerte

---

### 🟡 IMPORTANT — Pas de migrations Prisma

**Problème :** Le dossier `prisma/migrations/` n'existe pas. Cela signifie que le schéma est probablement poussé via `prisma db push` (sans versioning des migrations).

**Risque :** Pas de rollback possible. Perte potentielle de données en cas de modification de schéma.

**Fix :** Passer à `prisma migrate dev` pour générer des migrations versionnées.

---

### 🟡 IMPORTANT — Import incohérent de Prisma

Certains fichiers utilisent `import prisma from "@/lib/prisma"` (default export) et d'autres `import { prisma } from "@/lib/prisma"` (named export). Le fichier exporte un default, donc le named import va crasher.

**Fichiers concernés :** `campaigns/route.ts`, `contacts/route.ts` utilisent `{ prisma }` au lieu de `prisma`.

**Fix :** Standardiser tous les imports sur le default export.

---

### 🟡 IMPORTANT — Deux versions de Zod importées

**Fichier :** `src/app/api/auth/register/route.ts` utilise `import { z } from "zod/v4"` tandis que les autres fichiers utilisent `import { z } from "zod"`. Le package.json a `zod@^4.3.4`. Potentiel conflit de versions.

---

### 🟡 IMPORTANT — Dead code / fichiers potentiellement inutilisés

- `src/lib/validation.ts` ET `src/lib/validations.ts` — duplication
- `src/lib/ansm-scraper.ts` — utilisé uniquement par l'API search, mais le cron sync fait son propre scraping
- `src/app/privacy/page.tsx` ET `src/app/(legal)/confidentialite/page.tsx` — doublons de page politique de confidentialité
- `src/app/terms/page.tsx` ET `src/app/(legal)/cgu/page.tsx` — doublons de CGU

---

### 🟡 IMPORTANT — Gestion d'erreurs incomplète

- Pas d'Error Boundary global côté client (le `error.tsx` existe mais pas de `global-error.tsx` fonctionnel vérifié)
- Les erreurs Prisma ne sont pas typées (catch générique partout)
- `console.error` partout au lieu d'un service de monitoring

---

### 🟢 OK — TypeScript bien configuré
### 🟢 OK — Zod pour la validation des inputs (quand utilisé)
### 🟢 OK — Structure de projet claire avec App Router

---

## 4. 🔍 SEO (Score : 72/100)

### 🟢 OK — Meta tags complets

Le `layout.tsx` racine a :
- Title avec template
- Description
- Keywords
- Open Graph (title, description, url, siteName, locale)
- Twitter Card
- Canonical URL
- Robots directives
- metadataBase

---

### 🟢 OK — Sitemap dynamique

Le `sitemap.ts` génère correctement les URLs statiques + les médicaments en rupture/tension depuis la DB.

### 🟢 OK — robots.txt

Correctement configuré avec blocage des `/api/`, `/dashboard/`, etc.

### 🟢 OK — Schema.org

`OrganizationSchema` et `WebSiteSchema` sont utilisés sur la homepage.

---

### 🟡 IMPORTANT — Google verification non configuré

```typescript
verification: {
  google: "VOTRE_CODE_VERIFICATION_GOOGLE",
},
```

Placeholder non remplacé. Google Search Console non connecté.

---

### 🟡 IMPORTANT — Homepage "use client" = SEO dégradé

Le contenu principal de la homepage est rendu côté client. Les crawlers qui n'exécutent pas JavaScript ne verront pas le contenu. Google exécute JS mais avec un délai (indexation de deuxième phase).

---

### 🟡 IMPORTANT — Pages dupliquées (privacy/terms)

`/privacy` et `/confidentialite` pointent probablement vers le même contenu → risque de duplicate content. Idem pour `/terms` et `/cgu`.

**Fix :** Supprimer les doublons ou mettre des redirects 301.

---

## 5. 🎯 UX / FONCTIONNEL (Score : 60/100)

### 🟢 OK — Parcours inscription → dashboard

Le dashboard layout redirige correctement vers `/login` si non authentifié. Navigation mobile responsive avec barre de nav scrollable.

### 🟢 OK — Parcours Stripe

Checkout session, portal session, webhook bien implémentés. Gestion des événements (created, updated, deleted, payment_failed).

### 🟢 OK — Mobile responsive

Layout dashboard avec navigation adaptative. Tailwind CSS responsive classes utilisées.

---

### 🟡 IMPORTANT — Pas de vérification d'email → UX confuse

L'utilisateur peut s'inscrire et ne jamais vérifier son email. Pas de flow de confirmation.

---

### 🟡 IMPORTANT — Accessibilité (a11y)

- Pas d'attributs `aria-label` visibles sur les boutons d'icônes
- Pas de skip navigation link
- Les messages d'erreur ne semblent pas liés aux champs via `aria-describedby`
- Contraste non vérifié

---

### 🟡 IMPORTANT — Pas de feedback utilisateur sur les actions

Les appels API dans la homepage ne montrent pas clairement les états de loading/success/error pour toutes les interactions.

---

## 6. 🏗️ INFRA / DEVOPS (Score : 45/100)

### 🔴 CRITIQUE — Pas de monitoring/logging

**Problème :** Aucun service de monitoring configuré (pas de Sentry, LogRocket, Datadog, etc.). Les erreurs sont uniquement `console.error`. En production, ces logs sont perdus ou difficiles à retrouver dans les logs Vercel.

**Fix :** Intégrer Sentry (gratuit jusqu'à 5K events/mois) pour le tracking d'erreurs.

---

### 🔴 CRITIQUE — Pas de backup DB documenté

**Problème :** Aucune stratégie de backup PostgreSQL visible. Si la DB tombe, toutes les données sont perdues.

**Fix :** Configurer des backups automatiques (pg_dump cron ou service managé comme Supabase/Neon qui incluent les backups).

---

### 🟡 IMPORTANT — Pas de migrations versionnées (mentionné en Code Quality)

### 🟡 IMPORTANT — next.config.ts vide

```typescript
const nextConfig: NextConfig = {
  /* config options here */
};
```

**Manquant :**
- `images.remotePatterns` pour les images externes
- `experimental.serverActions` si utilisé
- Headers de sécurité supplémentaires (redondance avec middleware mais bonne pratique)

---

### 🟡 IMPORTANT — Vercel cron sans protection suffisante

Les crons Vercel appellent des endpoints HTTP publics. Sans `CRON_SECRET`, n'importe qui peut les déclencher.

---

### 🟢 OK — Vercel redirect www configuré
### 🟢 OK — Vercel crons configurés (sync quotidien + blog generation)

---

## 📊 RÉSUMÉ EXÉCUTIF

| Catégorie | Score | Statut |
|-----------|-------|--------|
| Sécurité | 35/100 | 🔴 Critique |
| Performance | 55/100 | 🟡 À améliorer |
| Code Quality | 50/100 | 🟡 À améliorer |
| SEO | 72/100 | 🟢 Correct |
| UX/Fonctionnel | 60/100 | 🟡 À améliorer |
| Infra/DevOps | 45/100 | 🔴 Insuffisant |
| **GLOBAL** | **52/100** | **🔴 Non prêt pour le lancement** |

---

## 🚨 TOP 5 — À fixer AVANT le lancement

1. **🔴 Routes admin outreach sans auth** — Faille exploitable immédiatement
2. **🔴 XSS dans le formulaire de contact** — Injection possible via email admin
3. **🔴 Rate limiting in-memory sur Vercel** — Inefficace en serverless
4. **🔴 Zéro test** — Aucune garantie de non-régression
5. **🔴 Pas de monitoring ni backup DB** — Aveugle en production

---

## ✅ Points positifs

- Architecture propre avec App Router Next.js
- Prisma bien utilisé avec indexes
- Validation Zod en place (même si pas systématique)
- Stripe correctement intégré avec webhook signature
- RGPD (export + suppression) implémenté
- Headers de sécurité solides
- SEO metadata complètes
- Chiffrement AES-256-GCM pour les données sensibles
- Schema Prisma riche et bien structuré

---

*Rapport généré le 10/02/2026. Audit basé sur l'analyse statique du code source.*
