// ============================================
// ✍️ SEO GENERATOR MODULE
// Génération d'articles SEO ciblés "rupture/pénurie [médicament] France"
// Utilise Claude pour rédiger à partir de données BDPM factuelles
// ============================================

import { ResearchFinding, GeneratedArticle, GeneratedArticleSchema } from './types';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GENERATION_MODEL = 'claude-sonnet-4-20250514';

/**
 * Extrait le nom court du médicament depuis le topic
 */
function extractMedName(topic: string): string {
  const match = topic.match(/(?:Rupture|Pénurie) de ([^(]+)/);
  return match ? match[1].trim() : topic.split(' ').slice(0, 3).join(' ');
}

/**
 * ✍️ Générer un article SEO orienté "rupture [médicament] France"
 */
export async function generateSEOArticle(finding: ResearchFinding): Promise<GeneratedArticle> {
  const medName = extractMedName(finding.topic);
  console.log(`✍️ Génération article SEO pour : "${medName}"...`);

  if (!ANTHROPIC_API_KEY) {
    throw new Error('❌ ANTHROPIC_API_KEY manquante');
  }

  const today = new Date().toISOString().split('T')[0];
  const slugBase = `rupture-${medName.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)}-france`;
  const slug = `${slugBase}-${today.replace(/-/g, '')}`;

  // Mots-clés SEO cibles
  const targetKeywords = [
    `rupture ${medName.toLowerCase()} France`,
    `pénurie ${medName.toLowerCase()}`,
    `${medName.toLowerCase()} rupture de stock`,
    `${medName.toLowerCase()} indisponible`,
    `alternative ${medName.toLowerCase()}`,
  ];

  const systemPrompt = `Tu es un rédacteur médical SEO expert. Tu écris des articles factuels en français sur les ruptures de médicaments en France.
IMPORTANT : Tu ne dois JAMAIS inventer de données. Utilise UNIQUEMENT les faits fournis. Si tu ne sais pas, dis-le.
Tu écris en Markdown. Chaque article cible des mots-clés SEO spécifiques pour Google.`;

  const userPrompt = `Génère un article de blog DOUBLE VERSION sur cette rupture/pénurie de médicament.

DONNÉES FACTUELLES (source BDPM/ANSM) :
- Sujet : ${finding.topic}
- Résumé : ${finding.summary}
- Faits clés : ${finding.keyFacts.join(' | ')}
- Sources : ${finding.sources.map(s => `${s.title} (${s.url})`).join(', ')}

MOTS-CLÉS SEO À CIBLER (utilise-les naturellement dans le texte) :
${targetKeywords.map(k => `- "${k}"`).join('\n')}

=== VERSION GRAND PUBLIC (800-1200 mots) ===
Structure obligatoire :
1. **H1** : Inclure "${medName}" et "rupture" ou "pénurie"
2. **Introduction** : Accroche + résumé situation (2-3 phrases)
3. **Qu'est-ce que ${medName} ?** : Explication simple du médicament, à quoi il sert
4. **Quelle est la situation actuelle ?** : Faits BDPM uniquement
5. **Quelles alternatives existent ?** : Mentionner de consulter son médecin/pharmacien
6. **Que faire si vous êtes concerné ?** : Conseils pratiques (ne pas stocker, consulter, etc.)
7. **FAQ** : 3 questions fréquentes avec réponses courtes (schema FAQ pour SEO)
8. **Disclaimer** : "Cet article est informatif et ne remplace pas un avis médical."

=== VERSION PROFESSIONNELS (1500-2000 mots) ===
Structure obligatoire :
1. Contexte réglementaire (MITM, décret 2016, etc.)
2. Données BDPM détaillées
3. Mécanisme de la rupture si connu
4. Alternatives thérapeutiques (DCI, classes)
5. Conduite à tenir
6. Références

=== SEO ===
- seoTitle : max 60 chars, format "Rupture ${medName} France [2025] - MediTrouve"
- seoDescription : max 155 chars, incluant le mot-clé principal
- keywords : inclure les 5 mots-clés cibles + 3-5 additionnels

Réponds STRICTEMENT en JSON valide :
{
  "slug": "${slug}",
  "category": "rupture-stock",
  "author": "Équipe MediTrouve",
  "public": {
    "title": "...",
    "excerpt": "... (120-200 chars, incluant le mot-clé principal)",
    "content": "... (markdown complet avec FAQ)",
    "readTime": N
  },
  "pro": {
    "title": "...",
    "excerpt": "...",
    "content": "...",
    "readTime": N
  },
  "keywords": ${JSON.stringify(targetKeywords)}.concat(["...", "..."]),
  "seoTitle": "...",
  "seoDescription": "...",
  "sources": ${JSON.stringify(finding.sources)}
}

IMPORTANT : JSON valide. Escape les guillemets. Le contenu markdown doit être complet et prêt à publier.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: GENERATION_MODEL,
        max_tokens: 16000,
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
      throw new Error('Pas de contenu dans la réponse');
    }

    // Extraire le JSON
    let jsonStr = textContent;
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    } else {
      jsonStr = textContent.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Assurer les keywords comme array
    if (parsed.keywords && typeof parsed.keywords === 'string') {
      parsed.keywords = [parsed.keywords];
    }
    // Merge target keywords
    const allKeywords = [...new Set([...targetKeywords, ...(parsed.keywords || [])])];
    parsed.keywords = allKeywords;

    // Ajouter researchData
    parsed.researchData = {
      findingId: finding.id,
      originalTopic: finding.topic,
      originalSummary: finding.summary,
      keyFacts: finding.keyFacts,
      targetKeywords,
      generatedAt: new Date().toISOString(),
      model: GENERATION_MODEL,
    };

    // Force slug
    parsed.slug = slug;

    const article = GeneratedArticleSchema.parse(parsed);

    console.log(`✅ Article SEO généré : "${article.seoTitle || article.public.title}"`);
    console.log(`  🎯 Keywords: ${article.keywords.slice(0, 3).join(', ')}...`);
    console.log(`  📖 Public: ${article.public.readTime} min | Pro: ${article.pro.readTime} min`);

    return article;
  } catch (error) {
    console.error(`❌ Erreur génération SEO pour "${medName}":`, error);
    throw error;
  }
}
