# 🔍 Audit Complet — MediTrouve

**Date** : 2026-02-09
**Auditeur** : Claude Opus 4.6
**Durée** : ~15 minutes
**Fichiers analysés** : 136 fichiers TS/TSX (~9 149 lignes)

## 📊 Résumé Exécutif

- **Score global** : 58/100
- **Urgences critiques** : 5
- **Problèmes importants** : 9
- **Améliorations recommandées** : 14

---

## 🚨 Urgences Critiques (à corriger immédiatement)

### 1. 23 vulnérabilités npm (22 high, 1 moderate)
- **Sévérité** : 🔴 Critique
- **Impact** : Next.js 16.1.1 vulnérable à DoS (Image Optimizer, PPR Resume, HTTP deserialization). Preact JSON VNode Injection. Undici decompression chain.
- **Fix** : `npm audit fix --force` → mettre à jour Next.js vers ≥16.1.6, Preact, et Undici

### 2. Build cassé — DB connection au build time
- **Sévérité** : 🔴 Critique
- **Impact** : Le site ne se déploie pas sur Vercel. Le `sitemap.ts` fait un appel Prisma au build, ce qui nécessite DATABASE_URL au build time.
- **Localisation** : `src/app/sitemap.ts`
- **Fix** : Wrapper le try/catch existant pour retourner uniquement les pages statiques si DB indisponible, OU configurer `DATABASE_URL` dans les env vars Vercel (build + runtime). Également ajouter `?pgbouncer=true&connection_limit=1` à l'URL Supabase.

### 3. Route register n'utilise PAS les validations Zod
- **Sévérité** : 🔴 Critique
- **Impact** : `src/app/api/auth/register/route.ts` accepte un mot de passe de 6 chars sans validation forte, alors que `validations.ts` exige 8+ chars avec majuscule/minuscule/chiffre/spécial. Incohérence critique.
- **Localisation** : `src/app/api/auth/register/route.ts` (ligne `password.length < 6`)
- **Fix** : Remplacer la validation manuelle par `registerSchema.safeParse(body)` depuis `src/lib/validations.ts`

### 4. dangerouslySetInnerHTML sur contenu blog sans sanitization
- **Sévérité** : 🔴 Critique
- **Impact** : XSS potentiel. `BlogArticleContent.tsx` injecte du HTML via `markdownToHtml()` sans sanitization (DOMPurify absent). Le contenu vient de l'IA mais passe par la DB.
- **Localisation** : `src/app/blog/[slug]/BlogArticleContent.tsx:115`, `src/app/blog/page.tsx:122`, `src/app/medicament/[slug]/page.tsx:510`
- **Fix** : Installer `dompurify` + `@types/dompurify`, sanitizer tout HTML avant injection : `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(markdownToHtml(content)) }}`

### 5. CryptoJS pour le chiffrement (bibliothèque obsolète et faible)
- **Sévérité** : 🔴 Critique
- **Impact** : `crypto-js` est abandonné et a des faiblesses connues. Utilisé pour chiffrer les secrets 2FA et données de santé. Le mode AES avec string key (pas de vrai KDF) est vulnérable.
- **Localisation** : `src/lib/encryption.ts`
- **Fix** : Migrer vers `crypto` natif de Node.js (webcrypto API). Utiliser `crypto.subtle.encrypt` avec PBKDF2 pour dériver la clé. Ou utiliser `@noble/ciphers`.

---

## 🟡 Problèmes Importants (court terme)

### 6. Fichiers de validation dupliqués
- **Sévérité** : 🟡 Important
- **Impact** : `src/lib/validation.ts` ET `src/lib/validations.ts` coexistent avec des schémas similaires mais différents (ex: password min 8 vs 8+spécial). Confusion sur lequel utiliser.
- **Fix** : Fusionner en un seul fichier `validations.ts`, supprimer `validation.ts`, mettre à jour les imports.

### 7. Rate limiting en mémoire (Map) — ne scale pas
- **Sévérité** : 🟡 Important
- **Impact** : `middleware.ts` utilise un `Map` en mémoire pour le rate limiting. En serverless (Vercel), chaque invocation a sa propre mémoire → le rate limit ne fonctionne PAS. Le `setInterval` pour cleanup ne fonctionne pas non plus en serverless.
- **Localisation** : `src/middleware.ts`
- **Fix** : Utiliser Vercel KV (Redis) ou Upstash Redis pour le rate limiting. Alternative : utiliser `@vercel/edge-config` ou un middleware Vercel Edge avec `@upstash/ratelimit`.

### 8. CSP trop permissive : `unsafe-inline` et `unsafe-eval`
- **Sévérité** : 🟡 Important
- **Impact** : `script-src 'unsafe-inline' 'unsafe-eval'` annule largement la protection CSP contre les XSS.
- **Localisation** : `src/middleware.ts`
- **Fix** : Utiliser des nonces pour les scripts inline (`'nonce-xxx'`). Retirer `unsafe-eval` (nécessaire uniquement si dev tools). Next.js supporte les nonces CSP nativement.

### 9. Prisma sans connection pooling
- **Sévérité** : 🟡 Important
- **Impact** : Pas de `?pgbouncer=true` dans DATABASE_URL pour Supabase. En serverless, chaque requête crée une nouvelle connexion → épuisement du pool.
- **Localisation** : `src/lib/prisma.ts`, `.env.local`
- **Fix** : Ajouter `?pgbouncer=true&connection_limit=1` à DATABASE_URL. Configurer aussi `DIRECT_URL` dans le schema Prisma pour les migrations.

### 10. Pas de tests — 0% coverage
- **Sévérité** : 🟡 Important
- **Impact** : Aucun fichier de test trouvé. Pas de Jest, Vitest, ou Playwright configuré. Risque de régressions élevé.
- **Fix** : Installer Vitest + React Testing Library. Commencer par les routes API critiques (auth, stripe webhook, CRUD). Objectif initial : 40% coverage.

### 11. Google Verification placeholder
- **Sévérité** : 🟡 Important
- **Impact** : `verification.google: "VOTRE_CODE_VERIFICATION_GOOGLE"` dans le layout. Le site n'est pas vérifié dans Google Search Console.
- **Localisation** : `src/app/layout.tsx`
- **Fix** : Créer/vérifier le site dans Google Search Console et remplacer par le vrai code.

### 12. Pas de Sentry / error tracking
- **Sévérité** : 🟡 Important
- **Impact** : Les erreurs en production ne sont pas trackées. Les `console.error` disparaissent dans les logs Vercel (retention limitée).
- **Fix** : Installer `@sentry/nextjs`, configurer dans `next.config.ts`, ajouter `Sentry.init()` dans `instrumentation.ts`.

### 13. Pas de NEXT_PUBLIC_APP_URL en env
- **Sévérité** : 🟡 Important
- **Impact** : Le sitemap utilise `process.env.NEXT_PUBLIC_APP_URL || "https://www.meditrouve.fr"` comme fallback. Mais si variable absente, les URLs OG pourraient être incorrectes dans d'autres contextes.
- **Fix** : Ajouter `NEXT_PUBLIC_APP_URL=https://www.meditrouve.fr` dans les env vars Vercel.

### 14. Encryption key = JWT_SECRET (fallback dangereux)
- **Sévérité** : 🟡 Important
- **Impact** : `getEncryptionKey()` retombe sur JWT_SECRET si ENCRYPTION_KEY n'est pas défini. Les clés de chiffrement et de signature JWT devraient être distinctes.
- **Localisation** : `src/lib/jwt-secret.ts`
- **Fix** : Ajouter une variable `ENCRYPTION_KEY` séparée dans les env vars.

---

## 🟢 Améliorations (moyen/long terme)

### 15. Ajouter ISR/revalidation sur les pages médicaments
- **Catégorie** : Performance
- **Impact estimé** : -50% temps de chargement pages médicaments
- **Effort** : Faible
- **Recommandation** : Ajouter `export const revalidate = 3600` sur les pages dynamiques de médicaments et la page ruptures.

### 16. next.config.ts vide — optimisations manquantes
- **Catégorie** : Performance
- **Impact estimé** : Réduction bundle, meilleure perf
- **Effort** : Faible
- **Recommandation** : Ajouter `images.remotePatterns`, `experimental.optimizeCss`, `compress: true`, `poweredByHeader: false`.

### 17. Blog : markdownToHtml côté client
- **Catégorie** : Performance / SEO
- **Impact estimé** : Meilleur SEO, moins de JS client
- **Effort** : Moyen
- **Recommandation** : Convertir le markdown en HTML côté serveur (dans le composant Server de la page blog) plutôt que côté client. Le contenu serait immédiatement indexable.

### 18. Sitemap incomplet — ne liste pas les articles de blog dynamiques
- **Catégorie** : SEO
- **Impact estimé** : +30% pages indexées
- **Effort** : Faible
- **Recommandation** : Ajouter une requête `prisma.blogPost.findMany()` dans `sitemap.ts` pour inclure tous les articles de blog.

### 19. Pages SEO statiques (ozempic-rupture, etc.) — DRY violation
- **Catégorie** : Code Quality
- **Impact estimé** : Maintenabilité
- **Effort** : Moyen
- **Recommandation** : Créer un template dynamique `[medication]-rupture` plutôt que des pages statiques dupliquées.

### 20. OCR désactivé — feature promise non livrée
- **Catégorie** : Fonctionnel
- **Impact estimé** : Feature clé manquante pour les utilisateurs premium
- **Effort** : Élevé
- **Recommandation** : Soit implémenter avec un hébergeur HDS (OVH HDS, Scaleway), soit retirer de l'UI/pricing pour ne pas tromper les utilisateurs.

### 21. Prédictions ML — modèle inexistant
- **Catégorie** : Fonctionnel
- **Impact estimé** : Feature promise non livrée
- **Effort** : Élevé
- **Recommandation** : Le modèle `Prediction` existe en DB mais aucune logique de prédiction n'est implémentée. Soit construire un modèle simple (régression sur historique ANSM), soit retirer du plan Premium.

### 22. Analytics manquants
- **Catégorie** : Business
- **Impact estimé** : Impossible de mesurer conversions/rétention
- **Effort** : Faible
- **Recommandation** : Intégrer Plausible (RGPD-friendly) ou Vercel Analytics. Tracker : recherches, inscriptions, conversions premium, activations alertes.

### 23. Cookie consent stocké en localStorage uniquement
- **Catégorie** : RGPD
- **Impact estimé** : Non conforme aux guidelines CNIL
- **Effort** : Faible
- **Recommandation** : Stocker aussi le consentement côté serveur (cookie HTTP ou DB) pour preuve de consentement. Ajouter un lien vers les paramètres cookies dans le footer.

### 24. Pas de page DPO / exercice des droits
- **Catégorie** : RGPD
- **Impact estimé** : Non-conformité RGPD
- **Effort** : Faible
- **Recommandation** : Ajouter une page dédiée "Exercer vos droits" avec formulaire de contact DPO, liens vers export/suppression de données.

### 25. ANSM scraper lit des fichiers locaux, pas de download automatique
- **Catégorie** : Infrastructure
- **Impact estimé** : Les données peuvent devenir stales
- **Effort** : Faible (déjà implémenté dans le cron)
- **Recommandation** : Le cron `/api/cron/sync` télécharge depuis l'URL BDPM, mais `ansm-scraper.ts` lit des fichiers locaux. Unifier vers le cron qui télécharge.

### 26. Stripe price IDs non configurés
- **Catégorie** : Business
- **Impact estimé** : Les paiements ne fonctionnent pas sans les price IDs
- **Effort** : Faible
- **Recommandation** : Créer les produits/prix dans le dashboard Stripe et ajouter `STRIPE_PREMIUM_MONTHLY_PRICE_ID`, etc. dans les env vars Vercel.

### 27. Cron sync sans notification aux utilisateurs
- **Catégorie** : Fonctionnel
- **Impact estimé** : Les alertes ne sont pas envoyées lors des changements de statut
- **Effort** : Moyen
- **Recommandation** : Après la sync, comparer les anciens/nouveaux statuts et envoyer les notifications (email/push) aux utilisateurs ayant des alertes actives.

### 28. Email de bienvenue / vérification manquant
- **Catégorie** : UX/Sécurité
- **Impact estimé** : Comptes non vérifiés, risque d'abus
- **Effort** : Moyen
- **Recommandation** : Implémenter la vérification email lors de l'inscription. Le champ `emailVerified` existe mais n'est jamais utilisé.

---

## 📈 Scores par Catégorie

| Catégorie | Score | Détails |
|-----------|-------|---------|
| Sécurité | 5/10 | Rate limit inefficace (serverless), CryptoJS obsolète, CSP unsafe-inline, pas de vérification email, validations incohérentes |
| Performance | 6/10 | Pas d'ISR, pas de connection pooling, next.config vide, markdown côté client |
| SEO | 7/10 | Bon metadata/OG, structured data présent, sitemap partiel, Google non vérifié, blog articles manquants dans sitemap |
| Code Quality | 5/10 | 0 tests, fichiers validation dupliqués, DRY violations (pages SEO statiques), bonne architecture globale |
| UX/UI | 6/10 | Cookie consent OK, search autocomplete, loading states présents, mais pas de vérification email, error states basiques |
| Fonctionnel | 4/10 | OCR désactivé, ML non implémenté, alertes non envoyées lors de sync, scraper dualité local/remote |
| Infrastructure | 5/10 | Build cassé, pas de Sentry, pas d'analytics, crons configurés mais DB issue, Stripe price IDs manquants |
| Business | 4/10 | Stripe non fonctionnel (price IDs manquants), pas d'analytics, conversion non mesurable |
| RGPD | 7/10 | Export/suppression données OK, cookie consent OK, registre traitements présent, mais pas de page DPO, consentement localStorage seul |
| Blog Auto | 7/10 | Pipeline bien structuré (research→validation→generation→publication), double version public/pro, cron 9h UTC, mais pas encore testé en prod |

---

## 🎯 Plan d'Action Priorisé

### Semaine 1 (urgent) — Débloquer le déploiement
- [ ] Fix build : configurer `DATABASE_URL` dans Vercel env vars (+ `?pgbouncer=true&connection_limit=1`)
- [ ] `npm audit fix --force` → mettre à jour Next.js 16.1.6+
- [ ] Remplacer validation manuelle dans register par `registerSchema` de Zod
- [ ] Installer `dompurify`, sanitizer tous les `dangerouslySetInnerHTML`
- [ ] Ajouter `ENCRYPTION_KEY` séparée dans les env vars
- [ ] Remplacer placeholder Google verification

### Semaine 2-4 (important)
- [ ] Migrer `crypto-js` → `crypto` natif (Node.js webcrypto)
- [ ] Fusionner `validation.ts` + `validations.ts` en un seul fichier
- [ ] Implémenter rate limiting avec Upstash Redis
- [ ] Corriger CSP : nonces au lieu de `unsafe-inline`
- [ ] Installer Sentry pour error tracking
- [ ] Ajouter Plausible/Vercel Analytics
- [ ] Ajouter les articles de blog dans le sitemap
- [ ] Setup Vitest + premiers tests (auth routes, stripe webhook)
- [ ] Configurer Stripe price IDs

### Mois 2-3 (optimisation)
- [ ] Implémenter l'envoi de notifications lors des syncs ANSM
- [ ] Ajouter ISR/revalidation sur pages dynamiques
- [ ] Implémenter vérification email à l'inscription
- [ ] Convertir markdown→HTML côté serveur (blog)
- [ ] Ajouter page DPO / exercice des droits
- [ ] Stocker consentement cookies côté serveur
- [ ] Refactorer pages SEO statiques en template dynamique
- [ ] Optimiser next.config.ts (images, compression, etc.)

### Mois 3-6 (features)
- [ ] Décider OCR : implémenter avec HDS ou retirer du plan
- [ ] Décider prédictions ML : modèle basique ou retirer
- [ ] Atteindre 40% test coverage
- [ ] Mettre en place CI/CD avec tests automatiques

---

## 📋 Estimation des temps

| Fix / Amélioration | Effort estimé |
|---|---|
| Fix build (env vars Vercel) | 15 min |
| npm audit fix | 10 min |
| Validation register + Zod | 30 min |
| DOMPurify sanitization | 1h |
| Encryption key séparée | 15 min |
| Google verification | 15 min |
| Migration crypto-js → natif | 3h |
| Fusion fichiers validation | 1h |
| Rate limiting Redis | 2h |
| CSP nonces | 2h |
| Sentry setup | 1h |
| Analytics setup | 30 min |
| Blog dans sitemap | 30 min |
| Vitest + premiers tests | 4h |
| Stripe price IDs config | 30 min |
| Notifications sync ANSM | 4h |
| ISR/revalidation | 1h |
| Vérification email | 3h |
| Page DPO | 2h |
