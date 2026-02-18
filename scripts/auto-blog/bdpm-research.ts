// ============================================
// 🏥 BDPM RESEARCH MODULE v2
// Recherche de sujets à partir des données réelles BDPM (ruptures/tensions)
// Filtre les ruptures obsolètes, priorise les nouvelles
// ============================================

import { ResearchFinding, ResearchResult } from './types';

const BDPM_BASE_URL = 'https://base-donnees-publique.medicaments.gouv.fr/download/file';

interface BDPMShortage {
  cisCode: string;
  cipCode: string;
  level: number; // 1=rupture, 2=tension, 4=tension approvisionnement
  status: string;
  startDate: string;
  endDate: string;
  answerUrl: string;
}

interface BDPMMedication {
  cisCode: string;
  name: string;
  form: string;
  route: string;
  status: string;
  laboratory: string;
  isMITM: boolean;
}

interface BDPMComposition {
  cisCode: string;
  activeIngredient: string;
  dosage: string;
}

async function fetchBDPM(filename: string): Promise<string> {
  const url = `${BDPM_BASE_URL}/${filename}`;
  console.log(`📥 Téléchargement ${filename}...`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erreur BDPM ${filename}: ${response.status}`);
  const buffer = await response.arrayBuffer();
  return new TextDecoder('latin1').decode(buffer);
}

function parseShortages(content: string): BDPMShortage[] {
  const results: BDPMShortage[] = [];
  for (const line of content.split('\n')) {
    const parts = line.split('\t');
    if (parts.length < 5) continue;
    results.push({
      cisCode: parts[0].trim(),
      cipCode: parts[1]?.trim() || '',
      level: parseInt(parts[2]) || 0,
      status: parts[3]?.trim() || '',
      startDate: parts[4]?.trim() || '',
      endDate: parts[5]?.trim() || '',
      answerUrl: parts[7]?.trim() || '',
    });
  }
  return results;
}

function parseMedications(content: string): Map<string, BDPMMedication> {
  const meds = new Map<string, BDPMMedication>();
  for (const line of content.split('\n')) {
    const parts = line.split('\t');
    if (parts.length < 5) continue;
    const cisCode = parts[0].trim();
    meds.set(cisCode, {
      cisCode,
      name: parts[1]?.trim() || '',
      form: parts[2]?.trim() || '',
      route: parts[3]?.trim() || '',
      status: parts[4]?.trim() || '',
      laboratory: parts[10]?.trim() || '',
      isMITM: (parts[11]?.trim() || '').toLowerCase() === 'oui',
    });
  }
  return meds;
}

function parseCompositions(content: string): Map<string, BDPMComposition> {
  const compos = new Map<string, BDPMComposition>();
  for (const line of content.split('\n')) {
    const parts = line.split('\t');
    if (parts.length < 4) continue;
    const cisCode = parts[0].trim();
    if (!compos.has(cisCode)) {
      compos.set(cisCode, {
        cisCode,
        activeIngredient: parts[3]?.trim() || '',
        dosage: parts[4]?.trim() || '',
      });
    }
  }
  return compos;
}

function extractShortName(fullName: string): string {
  const match = fullName.match(/^([A-ZÀÂÉÈÊËÏÔÙÛÜÇ\s/-]+)/);
  if (match) {
    const raw = match[1].trim();
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }
  return fullName.split(',')[0].split(' ')[0];
}

/**
 * Parse une date BDPM (format DD/MM/YYYY ou YYYY-MM-DD) en timestamp
 */
function parseBDPMDate(dateStr: string): number | null {
  if (!dateStr) return null;
  // Format DD/MM/YYYY
  const dmy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return new Date(`${dmy[3]}-${dmy[2]}-${dmy[1]}`).getTime();
  // Format YYYY-MM-DD
  const ymd = dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
  if (ymd) return new Date(dateStr).getTime();
  return null;
}

interface ShortageGroup {
  medName: string;
  shortName: string;
  activeIngredient: string;
  laboratory: string;
  isMITM: boolean;
  form: string;
  level: number;
  status: string;
  startDate: string;
  endDate: string;
  answerUrl: string;
  cisCode: string;
  variantCount: number;
}

/**
 * 🔍 Recherche BDPM v2 : filtre les ruptures obsolètes, priorise les nouvelles
 */
export async function researchFromBDPM(maxTopics: number = 6): Promise<ResearchResult> {
  console.log('🏥 Recherche BDPM v2 : téléchargement des données...');

  const [shortagesRaw, medsRaw, composRaw] = await Promise.all([
    fetchBDPM('CIS_CIP_Dispo_Spec.txt'),
    fetchBDPM('CIS_bdpm.txt'),
    fetchBDPM('CIS_COMPO_bdpm.txt'),
  ]);

  const shortages = parseShortages(shortagesRaw);
  const meds = parseMedications(medsRaw);
  const compos = parseCompositions(composRaw);

  console.log(`📊 ${shortages.length} lignes de rupture/tension, ${meds.size} médicaments`);

  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
  const SIX_MONTHS = 180 * 24 * 60 * 60 * 1000;

  // Regrouper par médicament (cisCode)
  const byCis = new Map<string, BDPMShortage[]>();
  for (const s of shortages) {
    const arr = byCis.get(s.cisCode) || [];
    arr.push(s);
    byCis.set(s.cisCode, arr);
  }

  const groups: ShortageGroup[] = [];
  const seenNames = new Set<string>();

  for (const [cisCode, entries] of byCis) {
    const med = meds.get(cisCode);
    if (!med) continue;

    const shortName = extractShortName(med.name);
    if (seenNames.has(shortName.toLowerCase())) continue;
    seenNames.add(shortName.toLowerCase());

    const compo = compos.get(cisCode);
    const worst = entries.reduce((a, b) => (a.level < b.level ? a : b));

    groups.push({
      medName: med.name,
      shortName,
      activeIngredient: compo?.activeIngredient || '',
      laboratory: med.laboratory,
      isMITM: med.isMITM,
      form: med.form,
      level: worst.level,
      status: worst.status,
      startDate: worst.startDate,
      endDate: worst.endDate,
      answerUrl: worst.answerUrl,
      cisCode,
      variantCount: entries.length,
    });
  }

  // ── SCORING v2 : priorise les ruptures ACTIVES et RÉCENTES ──
  const scored = groups.map(g => {
    let score = 0;
    const startTs = parseBDPMDate(g.startDate);
    const endTs = parseBDPMDate(g.endDate);

    // === FILTRE : exclure les ruptures quasi terminées ===
    if (endTs && endTs < now + THIRTY_DAYS) {
      // Date de fin dans moins de 30 jours ou déjà passée → on skip
      return { ...g, score: -1 };
    }

    // Niveau de rupture
    if (g.level === 1) score += 40;
    else if (g.level === 2) score += 25;
    else score += 10;

    // MITM = plus important
    if (g.isMITM) score += 25;

    // === BONUS : rupture RÉCENTE (commencée il y a moins de 30 jours) ===
    if (startTs && (now - startTs) < THIRTY_DAYS) {
      score += 30; // Très récente = très intéressant
    } else if (startTs && (now - startTs) < NINETY_DAYS) {
      score += 15; // Assez récente
    } else if (startTs && (now - startTs) > SIX_MONTHS) {
      score -= 20; // Ancienne = moins intéressant
    }

    // === BONUS : pas de date de fin connue (situation incertaine = plus d'intérêt) ===
    if (!endTs) {
      score += 10;
    }

    // Nombre de variants concernés
    score += Math.min(g.variantCount * 2, 15);

    // Nom connu = meilleur potentiel SEO
    if (g.shortName.length <= 15) score += 5;

    return { ...g, score };
  });

  // Filtrer les exclus et trier
  const filtered = scored.filter(g => g.score > 0);
  filtered.sort((a, b) => b.score - a.score);
  const topShortages = filtered.slice(0, maxTopics);

  console.log(`🏥 ${groups.length} ruptures totales → ${filtered.length} actives → top ${topShortages.length} sélectionnées`);
  for (const s of topShortages) {
    console.log(`  💊 ${s.shortName} (${s.activeIngredient}) - lvl${s.level} - début: ${s.startDate} - fin: ${s.endDate || 'inconnue'} - score: ${s.score}`);
  }

  const today = new Date().toISOString().split('T')[0];
  const findings: ResearchFinding[] = topShortages.map((s) => {
    const isRupture = s.level === 1;
    const statusLabel = isRupture ? 'rupture de stock' : 'tension d\'approvisionnement';

    return {
      id: `bdpm-${s.cisCode}`,
      topic: `${isRupture ? 'Rupture' : 'Pénurie'} de ${s.shortName} (${s.activeIngredient}) en France : ce qu'il faut savoir`,
      summary: `Le médicament ${s.shortName} (${s.activeIngredient}), commercialisé par ${s.laboratory}, est actuellement en ${statusLabel} en France depuis le ${s.startDate}.${s.endDate ? ` Retour prévu : ${s.endDate}.` : ' Date de retour non communiquée.'} ${s.isMITM ? 'Ce médicament est classé d\'intérêt thérapeutique majeur (MITM).' : ''} ${s.variantCount} présentation(s) concernée(s).`,
      category: 'rupture-stock' as const,
      sources: [
        {
          url: s.answerUrl || 'https://ansm.sante.fr/disponibilites-des-produits-de-sante/medicaments',
          title: `ANSM - ${s.shortName} disponibilité`,
          publisher: 'ANSM',
          date: today,
          credibility: 'institutional' as const,
        },
        {
          url: 'https://base-donnees-publique.medicaments.gouv.fr',
          title: `Base de données publique des médicaments - ${s.shortName}`,
          publisher: 'Ministère de la Santé',
          date: today,
          credibility: 'institutional' as const,
        },
        {
          url: `https://www.vidal.fr/medicaments/recherche.html?q=${encodeURIComponent(s.shortName)}`,
          title: `Vidal - ${s.shortName}`,
          publisher: 'Vidal',
          date: today,
          credibility: 'professional' as const,
        },
      ],
      keyFacts: [
        `${s.shortName} est en ${statusLabel} depuis le ${s.startDate}`,
        `Principe actif : ${s.activeIngredient || 'Non spécifié'}`,
        `${s.variantCount} présentation(s) concernée(s)`,
        s.isMITM ? 'Classé médicament d\'intérêt thérapeutique majeur' : `Laboratoire : ${s.laboratory}`,
        s.endDate ? `Date de retour estimée : ${s.endDate}` : 'Date de retour non communiquée',
      ],
      dateDiscovered: today,
      relevanceScore: s.score,
    };
  });

  return {
    findings,
    researchDate: today,
    model: 'BDPM-v2',
  };
}
