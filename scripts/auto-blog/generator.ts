// ============================================
// ✍️ GENERATOR MODULE
// Génération double version (public + pro) via Claude Opus
// ============================================

import { ResearchFinding, GeneratedArticle, GeneratedArticleSchema } from './types';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GENERATION_MODEL = 'claude-opus-4-20250514';

/**
 * 📝 Générer un article double version à partir d'un finding validé
 */
export async function generateArticle(finding: ResearchFinding): Promise<GeneratedArticle> {
  console.log(`✍️ Génération article pour : "${finding.topic}"...`);

  if (!ANTHROPIC_API_KEY) {
    throw new Error('❌ ANTHROPIC_API_KEY manquante');
  }

  const today = new Date().toISOString().split('T')[0];

  // Créer un slug à partir du topic
  const slugBase = finding.topic
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
  const slug = `${slugBase}-${today.replace(/-/g, '')}`;

  const systemPrompt = `Tu es un rédacteur médical expert, capable d'écrire pour le grand public ET pour les professionnels de santé.
Tu produis du contenu en français, factuel, sourcé, et adapté à chaque audience.
Tu écris en Markdown.`;

  const userPrompt = `Génère un article de blog en DOUBLE VERSION à partir de ce sujet :

SUJET : ${finding.topic}
RÉSUMÉ : ${finding.summary}
CATÉGORIE : ${finding.category}
FAITS CLÉS : ${finding.keyFacts.join(' | ')}
SOURCES DISPONIBLES :
${finding.sources.map(s => `- [${s.title}](${s.url}) (${s.publisher}, ${s.date})`).join('\n')}

=== VERSION GRAND PUBLIC (800-1000 mots) ===
Consignes :
- Vulgarisation accessible, ton bienveillant et rassurant
- Aucun jargon médical sans explication entre parenthèses
- Structure : Introduction accrocheuse → Explications claires → Bullet points des points clés → Que faire concrètement ? → Disclaimer
- Titres et sous-titres engageants
- CTA : "Restez informé avec MediTrouve"
- Disclaimer : "Cet article est informatif et ne remplace pas un avis médical."

=== VERSION PROFESSIONNELS DE SANTÉ (1500-2000 mots) ===
Consignes :
- Précision scientifique maximale
- Terminologie médicale appropriée (DCI, classifications, etc.)
- Structure : Contexte réglementaire → Mécanismes → Données probantes → Implications cliniques → Recommandations pratiques → Références
- Références bibliographiques complètes en fin d'article
- Ton professionnel et factuel

=== SEO ===
- 5+ mots-clés pertinents
- Titre SEO (max 70 caractères)
- Meta description (max 160 caractères)

Réponds STRICTEMENT en JSON valide :
{
  "slug": "${slug}",
  "category": "${finding.category}",
  "author": "Équipe MediTrouve",
  "public": {
    "title": "...",
    "excerpt": "... (50-300 chars)",
    "content": "... (markdown, 800-1000 mots)",
    "readTime": N
  },
  "pro": {
    "title": "...",
    "excerpt": "... (50-400 chars)",
    "content": "... (markdown, 1500-2000 mots)",
    "readTime": N
  },
  "keywords": ["...", "...", ...],
  "seoTitle": "... (max 70 chars)",
  "seoDescription": "... (max 160 chars)",
  "sources": [
    {"url": "...", "title": "...", "publisher": "...", "date": "...", "credibility": "..."},
    ...
  ]
}

IMPORTANT : Le JSON doit être valide. Escape les guillemets dans le contenu markdown. Minimum 5 sources.`;

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
      throw new Error('Pas de contenu dans la réponse Opus');
    }

    const jsonStr = textContent.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonStr);

    // Ajouter researchData
    parsed.researchData = {
      findingId: finding.id,
      originalTopic: finding.topic,
      originalSummary: finding.summary,
      keyFacts: finding.keyFacts,
    };

    const article = GeneratedArticleSchema.parse(parsed);

    console.log(`✅ Article généré : "${article.public.title}"`);
    console.log(`  📖 Public: ${article.public.readTime} min | Pro: ${article.pro.readTime} min`);
    console.log(`  🔗 ${article.sources.length} sources | 🏷️ ${article.keywords.length} keywords`);

    return article;
  } catch (error) {
    console.error(`❌ Erreur génération article pour "${finding.topic}":`, error);
    throw error;
  }
}
