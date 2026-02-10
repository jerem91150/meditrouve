#!/usr/bin/env tsx
/**
 * Script de mise à jour quotidienne des données BDPM
 * Télécharge les fichiers open data depuis la base publique des médicaments
 * Détecte les changements et log les nouvelles ruptures
 *
 * Usage: npx tsx scripts/update-bdpm.ts
 * Cron recommandé: 0 6 * * * (tous les jours à 6h)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

const BASE_URL = 'https://base-donnees-publique.medicaments.gouv.fr/telechargement.php';

// Fichiers à télécharger avec leur paramètre "fichier"
const FILES_TO_DOWNLOAD = [
  { param: 'CIS_bdpm', filename: 'CIS_bdpm.txt', description: 'Catalogue des médicaments' },
  { param: 'CIS_CIP_bdpm', filename: 'CIS_CIP_bdpm.txt', description: 'Présentations (CIP)' },
  { param: 'CIS_COMPO_bdpm', filename: 'CIS_COMPO_bdpm.txt', description: 'Compositions' },
  { param: 'CIS_GENER_bdpm', filename: 'CIS_GENER_bdpm.txt', description: 'Groupes génériques' },
  { param: 'CIS_CIP_Dispo_Spec', filename: 'CIS_CIP_Dispo_Spec.txt', description: 'Disponibilité / Ruptures' },
];

interface ChangeSummary {
  file: string;
  description: string;
  previousLines: number;
  newLines: number;
  addedLines: number;
  removedLines: number;
  downloaded: boolean;
  error?: string;
}

interface ShortageEntry {
  cisCode: string;
  name: string;
  status: string;
}

function log(msg: string) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function downloadFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const handler = (res: http.IncomingMessage) => {
      // Suivre les redirections
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location;
        log(`  ↳ Redirection vers ${redirectUrl}`);
        https.get(redirectUrl, handler).on('error', reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} pour ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    };
    https.get(url, handler).on('error', reject);
  });
}

function computeLinesDiff(oldContent: string, newContent: string): { added: number; removed: number } {
  const oldLines = new Set(oldContent.split('\n').filter(l => l.trim()));
  const newLines = new Set(newContent.split('\n').filter(l => l.trim()));

  let added = 0;
  let removed = 0;

  for (const line of newLines) {
    if (!oldLines.has(line)) added++;
  }
  for (const line of oldLines) {
    if (!newLines.has(line)) removed++;
  }

  return { added, removed };
}

function parseShortages(content: string): ShortageEntry[] {
  const entries: ShortageEntry[] = [];
  const lines = content.split('\n').filter(l => l.trim());

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 4) continue;

    const cisCode = parts[0]?.trim();
    const name = parts[1]?.trim() || `CIS ${cisCode}`;
    const status = parts[3]?.trim()?.toLowerCase() || '';

    if (cisCode && (status.includes('rupture') || status.includes('tension') || status.includes('arrêt'))) {
      entries.push({ cisCode, name, status });
    }
  }

  return entries;
}

function detectNewShortages(oldContent: string, newContent: string): ShortageEntry[] {
  const oldEntries = parseShortages(oldContent);
  const newEntries = parseShortages(newContent);

  const oldCodes = new Set(oldEntries.map(e => e.cisCode));

  return newEntries.filter(e => !oldCodes.has(e.cisCode));
}

async function main() {
  log('=== Début de la mise à jour BDPM ===');
  ensureDirs();

  const today = new Date().toISOString().split('T')[0];
  const summaries: ChangeSummary[] = [];
  const allNewShortages: ShortageEntry[] = [];

  for (const file of FILES_TO_DOWNLOAD) {
    const summary: ChangeSummary = {
      file: file.filename,
      description: file.description,
      previousLines: 0,
      newLines: 0,
      addedLines: 0,
      removedLines: 0,
      downloaded: false,
    };

    try {
      const url = `${BASE_URL}?fichier=${file.param}`;
      log(`Téléchargement de ${file.filename} (${file.description})...`);

      const buffer = await downloadFile(url);
      // Les fichiers BDPM sont en latin1
      const newContent = buffer.toString('latin1');
      const newLineCount = newContent.split('\n').filter(l => l.trim()).length;

      log(`  ✓ ${newLineCount} lignes téléchargées (${(buffer.length / 1024).toFixed(1)} Ko)`);

      // Lire l'ancien fichier s'il existe
      const filePath = path.join(DATA_DIR, file.filename);
      let oldContent = '';
      if (fs.existsSync(filePath)) {
        oldContent = fs.readFileSync(filePath, 'latin1');
        summary.previousLines = oldContent.split('\n').filter(l => l.trim()).length;

        // Backup de l'ancien fichier
        const backupPath = path.join(BACKUP_DIR, `${file.param}_${today}.txt`);
        fs.copyFileSync(filePath, backupPath);
        log(`  ✓ Backup créé: ${backupPath}`);
      }

      // Diff
      const diff = computeLinesDiff(oldContent, newContent);
      summary.newLines = newLineCount;
      summary.addedLines = diff.added;
      summary.removedLines = diff.removed;
      summary.downloaded = true;

      if (diff.added > 0 || diff.removed > 0) {
        log(`  ⚡ Changements: +${diff.added} / -${diff.removed} lignes`);
      } else {
        log(`  ℹ Aucun changement détecté`);
      }

      // Détecter les nouvelles ruptures sur le fichier dispo
      if (file.param === 'CIS_CIP_Dispo_Spec' && oldContent) {
        const newShortages = detectNewShortages(oldContent, newContent);
        if (newShortages.length > 0) {
          log(`  🚨 ${newShortages.length} NOUVELLE(S) RUPTURE(S) DÉTECTÉE(S):`);
          for (const s of newShortages) {
            log(`     - [${s.cisCode}] ${s.name} → ${s.status}`);
            allNewShortages.push(s);
          }
        }
      }

      // Écrire le nouveau fichier
      fs.writeFileSync(filePath, buffer);
      log(`  ✓ Fichier mis à jour: ${filePath}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      summary.error = errorMsg;
      log(`  ✗ ERREUR pour ${file.filename}: ${errorMsg}`);
    }

    summaries.push(summary);
  }

  // Résumé final
  log('');
  log('=== RÉSUMÉ DE LA MISE À JOUR ===');
  log(`Date: ${today}`);
  log('');

  for (const s of summaries) {
    const status = s.downloaded ? '✓' : '✗';
    const changes = s.addedLines > 0 || s.removedLines > 0
      ? ` (Δ +${s.addedLines}/-${s.removedLines})`
      : ' (aucun changement)';
    const error = s.error ? ` [ERREUR: ${s.error}]` : '';
    log(`${status} ${s.file} — ${s.description}: ${s.newLines} lignes${changes}${error}`);
  }

  if (allNewShortages.length > 0) {
    log('');
    log(`🚨 ${allNewShortages.length} nouvelle(s) rupture(s)/tension(s) détectée(s):`);
    for (const s of allNewShortages) {
      log(`   • [${s.cisCode}] ${s.name} — ${s.status}`);
    }
  } else {
    log('');
    log('✅ Aucune nouvelle rupture détectée');
  }

  // Sauvegarder le résumé en JSON
  const reportPath = path.join(DATA_DIR, `update-report-${today}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    date: today,
    summaries,
    newShortages: allNewShortages,
  }, null, 2));
  log(`\nRapport sauvegardé: ${reportPath}`);

  log('\n=== Fin de la mise à jour BDPM ===');
  return { summaries, newShortages: allNewShortages };
}

main().catch(err => {
  log(`ERREUR FATALE: ${err}`);
  process.exit(1);
});
