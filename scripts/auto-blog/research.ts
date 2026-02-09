// ============================================
// 🔬 RESEARCH MODULE
// Recherche de sujets médicaux via Claude Opus
// Sources : ANSM, HAS, Vidal, Le Quotidien du Médecin, JIM.fr
// ============================================

import { ResearchResult, ResearchResultSchema } from './types';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const RESEARCH_MODEL = 'claude-opus-4-20250514';

/**
 * 🔍 Recherche 6 sujets médicaux d'actualité en France
 * Utilise Claude Opus avec web search pour trouver des sujets pertinents
 */
export async function researchTopics(maxTopics: number = 6): Promise<ResearchResult> {
  console.log(`🔬 Recherche de ${maxTopics} sujets médicaux d'actualité...`);

  if (!ANTHROPIC_API_KEY) {
    throw new Error('❌ ANTHROPIC_API_KEY manquante');
  }

  const today = new Date().toISOString().split('T')[0];

  const systemPrompt = `Tu es un chercheur médical expert spécialisé dans l'actualité pharmaceutique française.
Tu dois trouver ${maxTopics} sujets d'actualité médicale récents en France.

SOURCES OBLIGATOIRES à consulter :
- ANSM (ansm.sante.fr) : alertes, ruptures, décisions
- HAS (has-sante.fr) : recommandations, avis, évaluations
- Vidal (vidal.fr) : actualités médicaments
- Le Quotidien du Médecin (lequotidiendumedecin.fr)
- JIM.fr (jim.fr) : Journal International de Médecine
- sante.gouv.fr : annonces ministérielles

CRITÈRES DE SÉLECTION :
1. Actualité : sujets des 7 derniers jours de préférence
2. Impact : concerne un grand nombre de patients ou de professionnels
3. Fiabilité : au moins 3 sources vérifiables par sujet
4. Diversité : couvrir différentes catégories (ruptures, alertes, nouveaux médicaments, etc.)

RÉPONSE STRICTEMENT en JSON valide, sans markdown :`;

  const userPrompt = `Date du jour : ${today}

Recherche ${maxTopics} sujets d'actualité médicale française récents et importants.

Pour chaque sujet, fournis :
- id : identifiant unique (ex: "topic-1")
- topic : titre descriptif (min 10 caractères)
- summary : résumé détaillé (min 50 caractères)
- category : une parmi [rupture-stock, alerte-sanitaire, nouveau-medicament, reglementation, prevention, pharmacovigilance]
- sources : tableau d'au moins 3 sources avec url, title, publisher, date, credibility
- keyFacts : au moins 2 faits clés
- dateDiscovered : date ISO

Réponds UNIQUEMENT avec un JSON valide de cette structure :
{
  "findings": [...],
  "researchDate": "${today}",
  "model": "${RESEARCH_MODEL}"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: RESEARCH_MODEL,
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const textContent = data.content?.find((c: any) => c.type === 'text')?.text;

    if (!textContent) {
      throw new Error('Pas de contenu texte dans la réponse Opus');
    }

    // Extraire le JSON (parfois entouré de ```json...```)
    const jsonStr = textContent.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonStr);

    // Validation Zod
    const result = ResearchResultSchema.parse(parsed);

    console.log(`✅ ${result.findings.length} sujets trouvés`);
    for (const f of result.findings) {
      console.log(`  📌 [${f.category}] ${f.topic} (${f.sources.length} sources)`);
    }

    return result;
  } catch (error) {
    console.error('❌ Erreur recherche:', error);
    throw error;
  }
}
