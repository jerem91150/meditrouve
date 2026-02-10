# 🤖 Twitter Bot - AlerteMedicaments

Bot automatique qui tweete les nouvelles ruptures de médicaments détectées dans la base BDPM.

## Setup

1. Copier `.env.example` vers `.env` et remplir les credentials Twitter API v2
2. `npm install`

## Usage

```bash
# Dry run (pas de tweet réel)
npm run dry-run

# Production
npm run bot
```

## Cron (recommandé)

```bash
# Toutes les 6h, max 5 tweets/run = 20/jour (free tier = 17, ajuster MAX_TWEETS_PER_RUN)
0 */6 * * * cd /tmp/alertemedicaments/scripts/twitter-bot && npm run bot >> /var/log/twitter-bot.log 2>&1
```

## Tracking

Le fichier `tweeted.json` garde la trace des ruptures déjà tweetées (clé = CIS:dateDebut).

## Limites

- Free tier Twitter API v2 : 17 tweets/jour
- `MAX_TWEETS_PER_RUN=5` par défaut (ajustable dans `.env`)
