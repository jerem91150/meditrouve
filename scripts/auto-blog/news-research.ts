// ============================================
// 📰 NEWS & TOPICS RESEARCH MODULE v3
// Génère des sujets d'actualité médicale diversifiés via Claude
// Source fiable et toujours disponible depuis Vercel
// ============================================

import { ResearchFinding } from './types';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * 📰 Génère des sujets d'actualité médicale via Claude
 * Toujours fiable, pas de dépendance RSS externe
 */
export async function researchFromNews(maxTopics: number = 6): Promise<ResearchFinding[]> {
  console.log('📰 Génération de sujets d\'actualité médicale via Claude...');

  const apiKey = OPENROUTER_API_KEY || ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('  ⚠️ Pas de clé API disponible');
    return [];
  }

  const useOpenRouter = !!OPENROUTER_API_KEY;
  const today = new Date().toISOString().split('T')[0];
  const year = new Date().getFullYear();
  const month = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const prompt = `Tu es l'editeur en chef du blog sante MediTrouve.fr. Genere exactement ${maxTopics} sujets d'articles pour le blog.

DATE ACTUELLE : ${today} (${month})

CRITERES OBLIGATOIRES :
- Sujets bases sur des faits REELS et VERIFIABLES
- Chaque sujet doit etre DATE et ACTUEL (pas intemporel)
- Diversite des categories obligatoire
- Sources REELLES existantes (PubMed PMID, sites ANSM, EMA, journaux medicaux)

REPARTITION OBLIGATOIRE (${maxTopics} sujets) :
1. Une AVANCEE MEDICALE recente (nouveau traitement, approbation, decouverte)
2. Une ETUDE SCIENTIFIQUE marquante (meta-analyse, essai clinique phase 3, resultats)
3. Une ALERTE ou PHARMACOVIGILANCE (signal, rappel, mise en garde)
4. Une ACTUALITE SANTE PUBLIQUE (politique de sante, prevention, epidemiologie)
${maxTopics > 4 ? '5. Un sujet REGLEMENTATION ou PREVENTION\n6. Un sujet au choix parmi les categories ci-dessus' : ''}

POUR CHAQUE SUJET, fournis :
- Un titre precis et factuel (pas de clickbait)
- Un resume de 3-4 phrases factuelles
- La categorie exacte
- 3-4 faits cles
- 2-3 sources REELLES avec URL verifiables (PubMed, ANSM, EMA, OMS, revues medicales)

Reponds STRICTEMENT en JSON (pas de markdown) :
[
  {
    "topic": "Titre precis et factuel du sujet",
    "summary": "Resume factuel en 3-4 phrases...",
    "category": "avancee-medicale",
    "keyFacts": ["fait 1", "fait 2", "fait 3"],
    "sources": [
      {"url": "https://pubmed.ncbi.nlm.nih.gov/XXXXX/", "title": "Titre de l'etude", "publisher": "The Lancet", "date": "${today}", "credibility": "scientific"},
      {"url": "https://ansm.sante.fr/...", "title": "...", "publisher": "ANSM", "date": "${today}", "credibility": "institutional"}
    ]
  }
]

Categories valides : avancee-medicale, etude-scientifique, alerte-sanitaire, pharmacovigilance, actualite-sante, prevention, reglementation, nouveau-medicament

JSON UNIQUEMENT.`;

  try {
    const endpoint = useOpenRouter
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.anthropic.com/v1/messages';

    const model = useOpenRouter
      ? 'anthropic/claude-3.5-haiku'
      : 'claude-3-5-haiku-20241022';

    const headers: Record<string, string> = useOpenRouter
      ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }
      : { 'Content-Type': 'application/json', 'x-api-key': apiKey!, 'anthropic-version': '2023-06-01' };

    const body = useOpenRouter
      ? JSON.stringify({
          model,
          max_tokens: 6000,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }],
        })
      : JSON.stringify({
          model,
          max_tokens: 6000,
          messages: [{ role: 'user', content: prompt }],
        });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.log(`  ⚠️ Claude API error ${response.status}: ${errText.substring(0, 200)}`);
      return [];
    }

    const data = await response.json();
    const text = useOpenRouter
      ? data.choices?.[0]?.message?.content
      : data.content?.find((c: any) => c.type === 'text')?.text;

    if (!text) {
      console.log('  ⚠️ Pas de contenu dans la réponse Claude');
      return [];
    }

    // Extraire le JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('  ⚠️ Pas de JSON trouvé dans la réponse');
      return [];
    }

    const topics = JSON.parse(jsonMatch[0]);

    const findings: ResearchFinding[] = topics
      .filter((t: any) => t.topic && t.summary)
      .map((t: any, i: number) => ({
        id: `claude-${i}-${Date.now()}`,
        topic: t.topic,
        summary: t.summary,
        category: t.category || 'actualite-sante',
        sources: (t.sources || []).map((s: any) => ({
          url: s.url || 'https://ansm.sante.fr',
          title: s.title || t.topic,
          publisher: s.publisher || 'Source médicale',
          date: s.date || today,
          credibility: s.credibility || 'professional',
        })),
        keyFacts: t.keyFacts || [t.topic],
        dateDiscovered: today,
        relevanceScore: 80 - i * 2, // Premiers sujets = plus pertinents
      }));

    console.log(`📰 ${findings.length} sujets générés :`);
    for (const f of findings) {
      console.log(`  📌 [${f.category}] ${f.topic.substring(0, 60)}...`);
    }

    return findings.slice(0, maxTopics);
  } catch (err) {
    console.log(`  ⚠️ Erreur génération sujets: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}
