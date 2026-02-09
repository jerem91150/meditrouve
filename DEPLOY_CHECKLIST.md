# ✅ Checklist de déploiement — MediTrouve

## 🎯 Résumé des changements

### Corrections de sécurité critiques
- ✅ **15 fichiers** corrigés (secrets JWT hardcodés)
- ✅ **5 fichiers** corrigés (Prisma singleton)
- ✅ Scraper ANSM **réécrit** (fichiers BDPM locaux)

### Nouveau système de blog automatique
- ✅ **15 fichiers** créés (pipeline complet)
- ✅ Double version (Grand Public + Professionnels)
- ✅ Validation croisée (Opus + Gemini Pro)
- ✅ Cron quotidien (9h UTC)

**Total** : 40 fichiers modifiés, 2420 lignes ajoutées ✨

---

## 📋 Checklist pré-déploiement

### ☐ 1. Base de données PostgreSQL
- [ ] Créer DB sur Vercel Postgres OU Supabase
- [ ] Copier `DATABASE_URL`

### ☐ 2. Variables d'environnement Vercel
Dashboard Vercel → Settings → Environment Variables :

#### Obligatoires pour l'app
- [ ] `DATABASE_URL` = <de la DB créée>
- [ ] `JWT_SECRET` = `AR2966r4VFOHFJYFJkIZSUhBiQVuliapEwyn7L1Vz7VbQMLPH1pKFrRu5Tnn2yMP`
- [ ] `NEXTAUTH_SECRET` = `AR2966r4VFOHFJYFJkIZSUhBiQVuliapEwyn7L1Vz7VbQMLPH1pKFrRu5Tnn2yMP`
- [ ] `NEXTAUTH_URL` = `https://ton-app.vercel.app`

#### Obligatoires pour le blog auto
- [ ] `CRON_SECRET` = `eDLtZsA+ljWkdpEdixOkentYFNjct28khCWUpowllfVCZLHpm9wPVSg8PuNUTX7e`
- [ ] `ANTHROPIC_API_KEY` = <ta clé Claude Max>
- [ ] `GOOGLE_API_KEY` = <ta clé Google AI Studio>

#### Optionnels (si utilisés)
- [ ] `STRIPE_SECRET_KEY` = <si paiements>
- [ ] `STRIPE_WEBHOOK_SECRET` = <si webhooks Stripe>
- [ ] `RESEND_API_KEY` = <si emails>
- [ ] `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` = <si push notifications>

### ☐ 3. Migration Prisma

Option A : Avant le deploy (recommandé)
```bash
cd ~/projects/alertemedicaments
vercel env pull .env.local
npx prisma db push
```

Option B : Pendant le build (Build Command dans Vercel)
```bash
npx prisma generate && npx prisma db push --accept-data-loss && next build
```

### ☐ 4. Deploy
- [ ] Push sur `master` (déjà fait ✅)
- [ ] Vercel déploie automatiquement
- [ ] Vérifier le déploiement dans Dashboard Vercel

### ☐ 5. Vérifications post-déploiement

#### Page d'accueil
- [ ] `https://ton-app.vercel.app/` charge correctement
- [ ] Recherche de médicaments fonctionne
- [ ] Pas d'erreur console

#### Authentification
- [ ] Inscription fonctionne
- [ ] Login fonctionne
- [ ] Pas d'erreur "JWT_SECRET not found"

#### Blog
- [ ] `https://ton-app.vercel.app/blog` charge
- [ ] Liste vide (normal si pas encore d'articles)
- [ ] Pas d'erreur 500

#### Cron (le lendemain à 9h UTC)
- [ ] Dashboard Vercel → Cron Jobs → Vérifier l'exécution
- [ ] Logs de fonction `/api/cron/generate-blog`
- [ ] Premier article publié automatiquement

### ☐ 6. Test manuel du cron (optionnel)
```bash
curl -X GET https://ton-app.vercel.app/api/cron/generate-blog \
  -H "Authorization: Bearer eDLtZsA+ljWkdpEdixOkentYFNjct28khCWUpowllfVCZLHpm9wPVSg8PuNUTX7e"
```

⏱️ Temps d'exécution : 5-8 minutes  
📄 Résultat : 1 article publié avec 2 versions

---

## 🎉 Résultat attendu après activation

### Avant (sans le système)
- Blog avec 1 article statique hardcodé
- Mise à jour manuelle uniquement
- Pas de version professionnelle

### Après (avec le système activé)
- **1 nouvel article par jour** automatiquement à 9h UTC
- **2 versions** par article :
  - 👥 **Grand Public** : 800-1000 mots, vulgarisé
  - 🩺 **Professionnels de Santé** : 1500-2000 mots, technique
- **Min 5 sources** institutionnelles par article
- **Validation automatique** (score >= 80/100)
- **Toggle frontend** pour changer de version
- **SEO optimisé** (structured data, metadata)

### Exemples de sujets d'articles générés
- "Nouveau traitement pour le diabète : ce qui change pour vous"
- "Rupture d'Ozempic : alternatives et solutions"
- "Antibiotiques en tension : comprendre la situation"
- "Levothyrox : mise à jour 2025"

---

## 🐛 Problèmes courants

### Build échoue avec "Environment variable not found: DATABASE_URL"
→ Ajouter `DATABASE_URL` dans Settings → Environment Variables

### "Prisma Client not generated"
→ Modifier Build Command : `npx prisma generate && next build`

### Cron ne s'exécute pas
→ Vérifier dans Dashboard → Cron Jobs (visible seulement sur Hobby/Pro)
→ Si tu as déjà un cron (sync ANSM), désactive-le ou upgrade vers Pro

### Articles ne s'affichent pas après le cron
→ Vérifier les logs : Functions → `/api/cron/generate-blog`
→ Vérifier que `ANTHROPIC_API_KEY` et `GOOGLE_API_KEY` sont définis

---

## 📞 Support & Documentation

- **Guide setup complet** : `VERCEL_SETUP.md`
- **Documentation pipeline** : `scripts/auto-blog/README.md`
- **Analyse complète** : `ANALYSE_OPUS.md`
- **Rapport corrections** : `FIX_REPORT.md`

---

**Dernière mise à jour :** 2026-02-09  
**Version :** 1.1.0 (blog auto + security fixes)
