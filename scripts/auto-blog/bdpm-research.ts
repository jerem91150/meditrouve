// ============================================
// 🏥 BDPM RESEARCH MODULE
// Recherche de sujets à partir des données réelles BDPM (ruptures/tensions)
// Remplace la recherche "hallucinée" par des données factuelles
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
  isMITM: boolean; // Médicament d'Intérêt Thérapeutique Majeur
}

interface BDPMComposition {
  cisCode: string;
  activeIngredient: string;
  dosage: string;
}

/**
 * Télécharge un fichier BDPM et décode en Latin-1
 */
async function fetchBDPM(filename: string): Promise<string> {
  const url = `${BDPM_BASE_URL}/${filename}`;
  console.log(`📥 Téléchargement ${filename}...`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erreur BDPM ${filename}: ${response.status}`);
  const buffer = await response.arrayBuffer();
  return new TextDecoder('latin1').decode(buffer);
}

/**
 * Parse le fichier CIS_CIP_Dispo_Spec.txt (ruptures/tensions)
 */
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

/**
 * Parse CIS_bdpm.txt (infos médicaments)
 */
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

/**
 * Parse CIS_COMPO_bdpm.txt (compositions/DCI)
 */
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

/**
 * Extrait le nom commercial court (sans dosage/forme)
 */
function extractShortName(fullName: string): string {
  // "DOLIPRANE 1000 mg, comprimé" → "Doliprane"
  const match = fullName.match(/^([A-ZÀÂÉÈÊËÏÔÙÛÜÇ\s/-]+)/);
  if (match) {
    const raw = match[1].trim();
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }
  return fullName.split(',')[0].split(' ')[0];
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
  variantCount: number; // nombre de CIP concernés
}

/**
 * 🔍 Recherche BDPM : identifie les ruptures/tensions actuelles
 * et sélectionne les plus pertinentes pour le SEO
 */
export async function researchFromBDPM(maxTopics: number = 6): Promise<ResearchResult> {
  console.log('🏥 Recherche BDPM : téléchargement des données...');

  const [shortagesRaw, medsRaw, composRaw] = await Promise.all([
    fetchBDPM('CIS_CIP_Dispo_Spec.txt'),
    fetchBDPM('CIS_bdpm.txt'),
    fetchBDPM('CIS_COMPO_bdpm.txt'),
  ]);

  const shortages = parseShortages(shortagesRaw);
  const meds = parseMedications(medsRaw);
  const compos = parseCompositions(composRaw);

  console.log(`📊 ${shortages.length} lignes de rupture/tension, ${meds.size} médicaments`);

  // Regrouper par médicament (cisCode) — prendre le pire niveau par CIS
  const byCis = new Map<string, BDPMShortage[]>();
  for (const s of shortages) {
    const arr = byCis.get(s.cisCode) || [];
    arr.push(s);
    byCis.set(s.cisCode, arr);
  }

  // Construire les groupes avec enrichissement
  const groups: ShortageGroup[] = [];
  const seenNames = new Set<string>();

  for (const [cisCode, entries] of byCis) {
    const med = meds.get(cisCode);
    if (!med) continue;

    const shortName = extractShortName(med.name);
    if (seenNames.has(shortName.toLowerCase())) continue;
    seenNames.add(shortName.toLowerCase());

    const compo = compos.get(cisCode);
    const worst = entries.reduce((a, b) => (a.level < b.level ? a : b)); // level 1 = pire

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

  // Scoring pour prioriser les articles les plus intéressants SEO
  const scored = groups.map(g => {
    let score = 0;
    // Rupture de stock (level 1) > tension (level 2) > tension approvisionnement (level 4)
    if (g.level === 1) score += 50;
    else if (g.level === 2) score += 30;
    else score += 10;

    // MITM = plus important
    if (g.isMITM) score += 30;

    // Nombre de variants concernés
    score += Math.min(g.variantCount * 2, 20);

    // Nom connu = meilleur potentiel SEO (heuristique: nom court)
    if (g.shortName.length <= 15) score += 10;

    return { ...g, score };
  });

  // Trier par score et prendre les top
  scored.sort((a, b) => b.score - a.score);
  const topShortages = scored.slice(0, maxTopics);

  console.log(`🏆 Top ${topShortages.length} sélectionnés :`);
  for (const s of topShortages) {
    console.log(`  💊 ${s.shortName} (${s.activeIngredient}) - ${s.status} - score: ${s.score}`);
  }

  // Convertir en ResearchFindings
  const today = new Date().toISOString().split('T')[0];
  const findings: ResearchFinding[] = topShortages.map((s, i) => {
    const isRupture = s.level === 1;
    const statusLabel = isRupture ? 'rupture de stock' : 'tension d\'approvisionnement';

    return {
      id: `bdpm-${s.cisCode}`,
      topic: `${isRupture ? 'Rupture' : 'Pénurie'} de ${s.shortName} (${s.activeIngredient}) en France : ce qu'il faut savoir`,
      summary: `Le médicament ${s.shortName} (${s.activeIngredient}), commercialisé par ${s.laboratory}, est actuellement en ${statusLabel} en France depuis le ${s.startDate}.${s.endDate ? ` Retour prévu : ${s.endDate}.` : ''} ${s.isMITM ? 'Ce médicament est classé d\'intérêt thérapeutique majeur (MITM).' : ''} ${s.variantCount} présentation(s) concernée(s).`,
      category: 'rupture-stock' as const,
      sources: [
        {
          url: s.answerUrl || `https://ansm.sante.fr/disponibilites-des-produits-de-sante/medicaments`,
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
    model: 'BDPM-direct',
  };
}
