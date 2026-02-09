// ============================================
// ✅ VALIDATION MODULE
// Validation qualité via Gemini Pro
// Double validation : findings + articles générés
// ============================================

import {
  ResearchFinding,
  ValidationResult,
  ValidationResultSchema,
  GeneratedArticle,
  QualityCheck,
  QualityCheckSchema,
} from './types';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-pro-preview-05-06';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Helper : appeler Gemini Pro et extraire le JSON
 */
async function callGemini(prompt: string): Promise<string> {
  if (!GOOGLE_API_KEY) {
    throw new Error('❌ GOOGLE_API_KEY manquante');
  }

  const response = await fetch(`${GEMINI_URL}?key=${GOOGLE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4000,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Pas de contenu dans la réponse Gemini');
  return text;
}

/**
 * 🔍 Valider les findings de recherche (Phase 2)
 * Score 0-100 par finding, sélection top N
 */
export async function validateFindings(
  findings: ResearchFinding[],
  topN: number = 3
): Promise<ValidationResult[]> {
  console.log(`✅ Validation de ${findings.length} findings avec Gemini Pro...`);

  const prompt = `Tu es un expert en validation de contenu médical. Évalue chaque sujet de recherche ci-dessous.

CRITÈRES D'ÉVALUATION (chacun sur 100) :
1. timeliness : Actualité du sujet (récent = score élevé)
2. sourceReliability : Fiabilité des sources citées (ANSM/HAS = 90+, média spécialisé = 70+)
3. patientImpact : Impact sur les patients (nombre de personnes concernées)
4. professionalRelevance : Pertinence pour les professionnels de santé
5. overallScore : Score global pondéré

SUJETS À ÉVALUER :
${JSON.stringify(findings, null, 2)}

Pour chaque sujet, réponds STRICTEMENT en JSON (array) :
[
  {
    "findingId": "...",
    "criteria": {
      "timeliness": 0-100,
      "sourceReliability": 0-100,
      "patientImpact": 0-100,
      "professionalRelevance": 0-100,
      "overallScore": 0-100
    },
    "approved": true/false,
    "feedback": "explication courte",
    "validatedBy": "Gemini Pro"
  }
]

Réponds UNIQUEMENT avec le JSON, sans markdown.`;

  try {
    const text = await callGemini(prompt);
    const jsonStr = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonStr);

    const results: ValidationResult[] = parsed.map((r: any) =>
      ValidationResultSchema.parse(r)
    );

    // Trier par score et prendre top N
    results.sort((a, b) => b.criteria.overallScore - a.criteria.overallScore);
    const topResults = results.slice(0, topN);

    console.log(`✅ Top ${topN} sélectionnés :`);
    for (const r of topResults) {
      console.log(`  📊 ${r.findingId}: ${r.criteria.overallScore}/100 - ${r.feedback.substring(0, 60)}...`);
    }

    return topResults;
  } catch (error) {
    console.error('❌ Erreur validation findings:', error);
    throw error;
  }
}

/**
 * 🔍 Validation qualité d'un article généré (Phase 4)
 * Vérifie cohérence, sources, claims non sourcées
 */
export async function validateArticle(article: GeneratedArticle): Promise<QualityCheck> {
  console.log(`✅ Validation qualité article "${article.slug}"...`);

  const prompt = `Tu es un relecteur médical expert. Valide cet article de blog médical en double version.

ARTICLE À VALIDER :
- Slug: ${article.slug}
- Catégorie: ${article.category}
- Sources (${article.sources.length}): ${JSON.stringify(article.sources.map(s => s.title))}

VERSION GRAND PUBLIC :
Titre: ${article.public.title}
Extrait: ${article.public.excerpt}
Contenu (${article.public.readTime} min) :
${article.public.content}

VERSION PROFESSIONNELS :
Titre: ${article.pro.title}
Extrait: ${article.pro.excerpt}
Contenu (${article.pro.readTime} min) :
${article.pro.content}

CHECKLIST DE VALIDATION :
1. coherenceBetweenVersions (0-100) : Les 2 versions traitent du même sujet sans contradictions ?
2. sourcesCount : Nombre de sources distinctes citées
3. unsourcedClaims : Nombre d'affirmations médicales non sourcées
4. publicVersionScore (0-100) : Qualité vulgarisation, ton, accessibilité
5. proVersionScore (0-100) : Rigueur scientifique, terminologie, références
6. overallScore (0-100) : Score global (>= 80 requis pour publication)
7. approved : true si overallScore >= 80
8. issues : liste des problèmes détectés (array vide si OK)

Réponds STRICTEMENT en JSON :
{
  "articleSlug": "${article.slug}",
  "coherenceBetweenVersions": ...,
  "sourcesCount": ...,
  "unsourcedClaims": ...,
  "publicVersionScore": ...,
  "proVersionScore": ...,
  "overallScore": ...,
  "approved": ...,
  "issues": [...],
  "checkedBy": "Gemini Pro"
}

Réponds UNIQUEMENT avec le JSON, sans markdown.`;

  try {
    const text = await callGemini(prompt);
    const jsonStr = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonStr);
    const check = QualityCheckSchema.parse(parsed);

    const emoji = check.approved ? '✅' : '⚠️';
    console.log(`${emoji} Score: ${check.overallScore}/100 | Sources: ${check.sourcesCount} | Claims non sourcées: ${check.unsourcedClaims}`);
    if (check.issues.length > 0) {
      console.log(`  ⚠️ Issues: ${check.issues.join(', ')}`);
    }

    return check;
  } catch (error) {
    console.error('❌ Erreur validation article:', error);
    throw error;
  }
}
