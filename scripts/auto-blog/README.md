# 📝 Auto-Blog MediTrouve

Système automatisé de génération d'articles de blog médicaux avec double version (grand public + professionnels de santé).

## 🏗️ Architecture

```
scripts/auto-blog/
├── pipeline.ts      # Orchestrateur principal (5 phases)
├── research.ts      # Phase 1 : Recherche sujets (Claude Opus)
├── validation.ts    # Phases 2 & 4 : Validation qualité (Gemini Pro)
├── generator.ts     # Phase 3 : Génération double version (Claude Opus)
├── publisher.ts     # Phase 5 : Publication DB (Prisma)
├── types.ts         # Types TypeScript + Schemas Zod
├── test-pipeline.ts # Script de test
└── README.md        # Ce fichier
```

## 🔄 Workflow

1. **Research** (Opus) → 6 topics médicaux France (ANSM, HAS, Vidal, etc.)
2. **Validation** (Gemini Pro) → Score 0-100, sélection top 3
3. **Génération** (Opus) → Double version : public (800-1000 mots) + pro (1500-2000 mots)
4. **Re-validation** (Gemini Pro) → Checklist qualité, score >= 80 requis
5. **Publication** (Prisma) → Auto-publish si validé

## 🚀 Lancement manuel

```bash
cd ~/projects/alertemedicaments

# Test dry-run (1 article, pas de publication)
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/auto-blog/test-pipeline.ts

# Test avec publication (1 article)
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/auto-blog/test-pipeline.ts --publish

# Test 3 articles
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/auto-blog/test-pipeline.ts --top=3
```

## 🔧 Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `DATABASE_URL` | URL PostgreSQL | ✅ |
| `ANTHROPIC_API_KEY` | Clé API Anthropic (Opus) | ✅ |
| `GOOGLE_API_KEY` | Clé API Google AI (Gemini Pro) | ✅ |
| `CRON_SECRET` | Secret pour sécuriser le cron | ✅ (prod) |

## 🗃️ Migration DB

```bash
npx prisma migrate dev --name add-blog-posts
# ou
npx prisma db push
```

## 📡 Cron automatique

Configuré dans `vercel.json` : exécution quotidienne à 9h UTC.

Endpoint : `GET /api/cron/generate-blog` (Authorization: Bearer CRON_SECRET)

## 🌐 Frontend

- `/blog` : Liste des articles avec badge "2 versions"
- `/blog/[slug]` : Article avec toggle Grand Public / Professionnels

## 🔧 Troubleshooting

| Problème | Solution |
|----------|----------|
| `ANTHROPIC_API_KEY manquante` | Vérifier .env |
| `GOOGLE_API_KEY manquante` | Vérifier .env |
| `Prisma client error` | `npx prisma generate` puis `npx prisma db push` |
| Score < 80, article non publié | Normal, vérifier les logs de validation |
| Timeout cron Vercel | Le plan Pro autorise 300s max |
