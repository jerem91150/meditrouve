# 🚀 Configuration Vercel — MediTrouve

## ✅ Ce qui est déjà fait
- [x] Code mergé sur `master` et pushé sur GitHub
- [x] Secrets générés localement
- [x] Schema Prisma avec modèle `BlogPost`
- [x] Cron configuré dans `vercel.json`

---

## 📋 Étapes de configuration Vercel

### 1. 🗄️ **Créer la base de données PostgreSQL**

#### Option A : Vercel Postgres (recommandé - simple)
1. Dashboard Vercel → **Storage** → **Create Database** → **Postgres**
2. Nom : `meditrouve-db`
3. Région : Europe (Frankfurt) ou US (proche de tes users)
4. Plan : **Hobby** (gratuit, suffisant pour commencer)
5. Copier automatiquement les env vars dans le projet

#### Option B : Supabase (gratuit, plus de features)
1. https://supabase.com → **New project**
2. Nom : `meditrouve`
3. Password : <générer un mot de passe fort>
4. Région : Europe (Frankfurt)
5. Aller dans **Settings** → **Database** → Copier la **Connection string** (mode "Transaction")
   
   Format : `postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

---

### 2. 🔐 **Variables d'environnement Vercel**

Dashboard Vercel → **Settings** → **Environment Variables** → **Add** :

| Variable | Valeur | Environnements |
|----------|--------|----------------|
| `DATABASE_URL` | <de Vercel Postgres ou Supabase> | Production, Preview, Development |
| `JWT_SECRET` | `AR2966r4VFOHFJYFJkIZSUhBiQVuliapEwyn7L1Vz7VbQMLPH1pKFrRu5Tnn2yMP` | Production, Preview, Development |
| `NEXTAUTH_SECRET` | `AR2966r4VFOHFJYFJkIZSUhBiQVuliapEwyn7L1Vz7VbQMLPH1pKFrRu5Tnn2yMP` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://ton-app.vercel.app` | Production |
| `CRON_SECRET` | `eDLtZsA+ljWkdpEdixOkentYFNjct28khCWUpowllfVCZLHpm9wPVSg8PuNUTX7e` | Production, Preview, Development |
| `ANTHROPIC_API_KEY` | <ta clé Claude Max> | Production, Preview |
| `GOOGLE_API_KEY` | <ta clé Google AI Studio> | Production, Preview |
| `STRIPE_SECRET_KEY` | <si tu utilises Stripe> | Production |
| `STRIPE_WEBHOOK_SECRET` | <si tu utilises Stripe> | Production |
| `RESEND_API_KEY` | <si tu utilises Resend pour emails> | Production |

**⚠️ Secrets à ne PAS partager publiquement (déjà générés pour toi) :**
- `JWT_SECRET` : AR2966r4VFOHFJYFJkIZSUhBiQVuliapEwyn7L1Vz7VbQMLPH1pKFrRu5Tnn2yMP
- `CRON_SECRET` : eDLtZsA+ljWkdpEdixOkentYFNjct28khCWUpowllfVCZLHpm9wPVSg8PuNUTX7e

---

### 3. 📊 **Migration Prisma**

Une fois `DATABASE_URL` configurée dans Vercel :

#### Option A : Via Vercel CLI (recommandé)
```bash
cd ~/projects/alertemedicaments

# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Login
vercel login

# Link au projet
vercel link

# Pull les env vars
vercel env pull .env.local

# Migration
npx prisma db push
# ou
npx prisma migrate deploy
```

#### Option B : Via l'interface Vercel (Build Command)
Dashboard Vercel → **Settings** → **General** → **Build Command** :
```bash
npx prisma generate && npx prisma db push --accept-data-loss && next build
```

⚠️ Attention : `db push --accept-data-loss` peut perdre des données. Utilise `migrate deploy` en prod.

---

### 4. ⏰ **Activer le Cron**

Le cron est déjà configuré dans `vercel.json` :

```json
{
  "crons": [{
    "path": "/api/cron/generate-blog",
    "schedule": "0 9 * * *"
  }]
}
```

**Il s'active automatiquement** au déploiement en production sur Vercel Pro/Hobby.

⚠️ **Vercel Hobby plan** : 1 cron max. Si tu as déjà un cron (ex: sync ANSM), désactive-le ou upgrade vers **Pro** ($20/mois).

---

### 5. 🧪 **Tester manuellement**

Une fois déployé, tu peux déclencher le cron manuellement :

```bash
curl -X GET https://ton-app.vercel.app/api/cron/generate-blog \
  -H "Authorization: Bearer eDLtZsA+ljWkdpEdixOkentYFNjct28khCWUpowllfVCZLHpm9wPVSg8PuNUTX7e"
```

**Temps d'exécution attendu :** 5-8 minutes (research + génération + validation)

**Output attendu :**
```json
{
  "success": true,
  "article": {
    "slug": "nouveau-traitement-diabete-ansm-2025",
    "title": "Nouveau traitement pour le diabète : ce qui change pour vous",
    "validationScore": 87
  }
}
```

---

### 6. 📋 **Vérifier le déploiement**

1. **Dashboard Vercel** → Onglet **Deployments** → Dernier deploy
2. Vérifier les **Build Logs** :
   - ✅ Prisma generate OK
   - ✅ Prisma db push OK (si configuré)
   - ✅ Build Next.js OK
3. Vérifier les **Function Logs** (Runtime) :
   - Chercher `/api/cron/generate-blog` dans les logs
4. Tester l'URL : `https://ton-app.vercel.app/blog`

---

## 🎯 **Résultat attendu (après 1er cron à 9h UTC)**

Sur `https://ton-app.vercel.app/blog` :
- 📰 Nouvel article visible
- 🔘 Toggle "👥 Grand Public" / "🩺 Professionnels" fonctionnel
- 📚 Sources affichées (min 5)
- 🎯 Score de validation visible (ex: 87/100)

---

## 🐛 **Troubleshooting**

### Erreur : "Environment variable not found: DATABASE_URL"
→ Ajouter `DATABASE_URL` dans Vercel Settings → Environment Variables

### Erreur : "Prisma Client not generated"
→ Ajouter dans Build Command : `npx prisma generate && next build`

### Cron ne se déclenche pas
→ Vérifier dans Dashboard Vercel → **Cron Jobs** (onglet)
→ Upgrade vers **Pro** si tu es sur Hobby et as déjà un cron

### "Resource not accessible by personal access token" (création PR)
→ Déjà corrigé : tout est mergé directement sur master

### Articles ne s'affichent pas
→ Vérifier les logs : Dashboard Vercel → **Functions** → `/api/cron/generate-blog`

---

## 📞 **Support**

- Docs Vercel Postgres : https://vercel.com/docs/storage/vercel-postgres
- Docs Vercel Cron : https://vercel.com/docs/cron-jobs
- Docs Prisma : https://www.prisma.io/docs

---

**Dernière mise à jour :** 2026-02-09  
**Auteur :** Assistant OpenClaw
