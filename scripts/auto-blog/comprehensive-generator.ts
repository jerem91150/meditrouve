// ============================================
// ✍️ COMPREHENSIVE GENERATOR MODULE
// Génération d'articles riches, cross-référencés, multi-catégories
// Utilise Claude via OpenRouter pour rédiger des articles complets
// ============================================

import { ResearchFinding, GeneratedArticle, GeneratedArticleSchema } from './types';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GENERATION_MODEL = 'anthropic/claude-sonnet-4';

/**
 * Génère un slug unique à partir du topic et de la date
 */
function generateSlug(topic: string, category: string): string {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const prefix = category === 'rupture-stock' ? 'rupture' :
    category === 'etude-scientifique' ? 'etude' :
    category === 'avancee-medicale' ? 'avancee' :
    category === 'alerte-sanitaire' ? 'alerte' :
    category === 'pharmacovigilance' ? 'pharmacovigilance' :
    'actu';

  const topicSlug = topic
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  return `${prefix}-${topicSlug}-${today}`;
}

/**
 * Construit le prompt de génération selon la catégorie
 */
function buildPrompt(finding: ResearchFinding, slug: string): { system: string; user: string } {
  const today = new Date().toISOString().split('T')[0];

  const system = `Tu es un redacteur medical expert de haut niveau, capable de produire du contenu de qualite editoriale pour un media sante de reference. Tu ecris en francais.

REGLES ABSOLUES :
- JAMAIS inventer de donnees, chiffres ou citations
- Utilise UNIQUEMENT les faits fournis + tes connaissances medicales verifiees
- Cite les sources dans le texte (ex: "selon une etude publiee dans The Lancet...")
- Si tu ne sais pas quelque chose, dis-le honnêtement
- Ecris en Markdown propre
- Articles COMPLETS et DETAILLES, pas du contenu superficiel
- Cross-reference avec d'autres etudes et contexte quand c'est pertinent`;

  let userPrompt = '';

  switch (finding.category) {
    case 'rupture-stock':
      userPrompt = buildRupturePrompt(finding, slug, today);
      break;
    case 'etude-scientifique':
      userPrompt = buildStudyPrompt(finding, slug, today);
      break;
    case 'avancee-medicale':
    case 'nouveau-medicament':
      userPrompt = buildAdvancePrompt(finding, slug, today);
      break;
    case 'alerte-sanitaire':
    case 'pharmacovigilance':
      userPrompt = buildAlertPrompt(finding, slug, today);
      break;
    default:
      userPrompt = buildNewsPrompt(finding, slug, today);
  }

  return { system, user: userPrompt };
}

function buildRupturePrompt(f: ResearchFinding, slug: string, today: string): string {
  return `Genere un article COMPLET sur cette rupture/penurie de medicament.

DONNEES FACTUELLES :
- Sujet : ${f.topic}
- Resume : ${f.summary}
- Faits cles : ${f.keyFacts.join(' | ')}
- Sources : ${f.sources.map(s => `${s.title} (${s.url})`).join(', ')}

=== VERSION GRAND PUBLIC (1200-1800 mots) ===
Structure OBLIGATOIRE :
1. **Titre accrocheur** incluant le nom du medicament
2. **Introduction** : Situation actuelle, pourquoi c'est important (3-4 phrases)
3. **Qu'est-ce que ce medicament ?** : A quoi il sert, qui le prend, pourquoi il est essentiel
4. **La situation actuelle** : Donnees officielles BDPM/ANSM, depuis quand, quel niveau
5. **Pourquoi cette rupture ?** : Causes possibles (problemes de production, demande accrue, matieres premieres...)
6. **Quelles sont les alternatives ?** : DCI equivalents, generiques, medicaments de la meme classe - TOUJOURS preciser de consulter son medecin
7. **Impact sur les patients** : Consequences concretes, temoignages-types, risques d'arret brutal
8. **Que faire si vous etes concerne ?** : Guide pratique etape par etape
9. **FAQ** : 4-5 questions frequentes avec reponses detaillees
10. **Conclusion** : Perspective, evolution attendue
11. **Disclaimer**

Ton : Accessible, rassurant mais factuel. Vulgarise le jargon.

=== VERSION PROFESSIONNELS (2000-3000 mots) ===
Structure OBLIGATOIRE :
1. **Resume clinique** : Points essentiels pour le praticien
2. **Contexte reglementaire** : Statut MITM, DP, decret 2016, role ANSM/EMA
3. **Donnees BDPM** : Analyse detaillee (CIS, CIP, niveaux, dates)
4. **Pharmacologie** : DCI, mecanisme d'action, pharmacocinetique pertinente
5. **Analyse de la rupture** : Causes identifiees, chaine d'approvisionnement, donnees industrielles
6. **Alternatives therapeutiques** : Tableau comparatif DCI/classes, switch guidelines, equivalences posologiques
7. **Conduite a tenir** : Algorithme decisionnel pour le prescripteur et le pharmacien
8. **Implications pharmacoeconomiques** : Cout, remboursement, impact systeme de sante
9. **Etudes pertinentes** : Cross-reference avec publications recentes sur le meme sujet
10. **References bibliographiques** : Numerotees, format APA

Ton : Rigoureux, scientifique, factuel.

${buildJsonTemplate(slug, f)}`;
}

function buildStudyPrompt(f: ResearchFinding, slug: string, today: string): string {
  return `Genere un article COMPLET d'analyse d'etude scientifique.

DONNEES :
- Sujet : ${f.topic}
- Resume : ${f.summary}
- Faits cles : ${f.keyFacts.join(' | ')}
- Sources : ${f.sources.map(s => `${s.title} (${s.url})`).join(', ')}

=== VERSION GRAND PUBLIC (1200-1800 mots) ===
Structure :
1. **Titre engageant** : Ce que ca change concretement pour les patients
2. **L'essentiel en 30 secondes** : Encadre resume (3 bullet points)
3. **De quoi parle cette etude ?** : Contexte accessible, pourquoi c'est important
4. **Que montre cette etude ?** : Resultats vulgarises, chiffres cles rendus comprehensibles
5. **Qu'est-ce que ca change pour les patients ?** : Impact concret, timeline realiste
6. **Ce que disent les autres etudes** : Mise en perspective avec recherches anterieures ou paralleles
7. **Les limites a connaitre** : Biais, taille d'echantillon, ce qu'on ne sait pas encore
8. **FAQ** : 4-5 questions avec reponses claires
9. **A retenir** : Resume actionnable
10. **Disclaimer**

Ton : Pedagogique, nuance, evite le sensationnalisme.

=== VERSION PROFESSIONNELS (2500-3500 mots) ===
Structure :
1. **Synopsis** : Objectif, methode, resultats principaux, conclusion
2. **Contexte scientifique** : Etat de l'art, gap dans la litterature
3. **Methodologie** : Design, population, criteres inclusion/exclusion, endpoints
4. **Resultats detailles** : Donnees primaires et secondaires, p-values, IC95%, NNT si applicable
5. **Discussion critique** : Forces et faiblesses, biais potentiels, validite externe
6. **Comparaison avec la litterature** : Cross-reference avec 3-5 etudes cles sur le meme sujet, meta-analyses existantes
7. **Implications cliniques** : Ce que ca change dans la pratique, recommandations
8. **Perspectives** : Prochaines etapes, essais en cours
9. **Score de preuve** : Niveau de preuve (GRADE), qualite methodologique
10. **References** : Min 8 references, format APA avec DOI

Ton : Critique, analytique, evidence-based.

${buildJsonTemplate(slug, f)}`;
}

function buildAdvancePrompt(f: ResearchFinding, slug: string, today: string): string {
  return `Genere un article COMPLET sur cette avancee medicale / nouveau traitement.

DONNEES :
- Sujet : ${f.topic}
- Resume : ${f.summary}
- Faits cles : ${f.keyFacts.join(' | ')}
- Sources : ${f.sources.map(s => `${s.title} (${s.url})`).join(', ')}

=== VERSION GRAND PUBLIC (1200-1800 mots) ===
Structure :
1. **Titre** : L'avancee + ce que ca signifie pour les patients
2. **En bref** : 3 points cles
3. **De quoi s'agit-il ?** : Le traitement/decouverte explique simplement
4. **Pourquoi c'est une avancee ?** : Comparaison avec l'existant, ce que ca ameliore
5. **Pour qui ?** : Patients concernes, pathologies, conditions
6. **Ou en est-on ?** : Phase de developpement, timeline d'acces
7. **Les questions que vous vous posez** : FAQ 4-5 questions
8. **Ce qu'il faut retenir** : Resume
9. **Disclaimer**

=== VERSION PROFESSIONNELS (2500-3000 mots) ===
Structure :
1. **Points cles** : Encadre resume pour le praticien
2. **Mecanisme d'action** : Pharmacologie detaillee, cibles moleculaires
3. **Evidence clinique** : Resultats des essais, populations etudiees
4. **Comparaison therapeutique** : vs standard of care, avantages/inconvenients
5. **Profil de securite** : Effets indesirables, contre-indications, interactions
6. **Aspects reglementaires** : AMM, ATU, acces precoce, remboursement
7. **Etudes pivots cross-referencees** : Analyse des etudes cles + etudes comparatives
8. **Place dans la strategie therapeutique** : Quand/comment prescrire
9. **References** : Min 6 references avec DOI

${buildJsonTemplate(slug, f)}`;
}

function buildAlertPrompt(f: ResearchFinding, slug: string, today: string): string {
  return `Genere un article COMPLET sur cette alerte sanitaire / signal de pharmacovigilance.

DONNEES :
- Sujet : ${f.topic}
- Resume : ${f.summary}
- Faits cles : ${f.keyFacts.join(' | ')}
- Sources : ${f.sources.map(s => `${s.title} (${s.url})`).join(', ')}

=== VERSION GRAND PUBLIC (1200-1800 mots) ===
Structure :
1. **Titre clair** : Ce qui se passe + medicament concerne
2. **L'essentiel** : Que faire MAINTENANT si vous prenez ce medicament
3. **Que s'est-il passe ?** : Faits chronologiques
4. **Qui est concerne ?** : Patients, medicaments, lots
5. **Quel est le risque ?** : Explication claire sans alarmer
6. **Que faire ?** : Guide pratique (ne pas arreter seul, consulter, etc.)
7. **FAQ** : 4-5 questions
8. **Disclaimer**

=== VERSION PROFESSIONNELS (2000-3000 mots) ===
Structure :
1. **Synthese du signal** : Nature, gravite, imputabilite
2. **Chronologie reglementaire** : Actions ANSM/EMA/FDA
3. **Donnees de pharmacovigilance** : Cas rapportes, frequence, mecanisme suspecte
4. **Analyse causale** : Evidence, theories, facteurs de risque
5. **Etudes de reference** : Cross-reference avec signaux anterieurs similaires
6. **Conduite a tenir** : Recommandations ANSM, algorithme
7. **Communication patient** : Comment informer sans alarmer
8. **References**

${buildJsonTemplate(slug, f)}`;
}

function buildNewsPrompt(f: ResearchFinding, slug: string, today: string): string {
  return `Genere un article COMPLET sur cette actualite sante.

DONNEES :
- Sujet : ${f.topic}
- Resume : ${f.summary}
- Faits cles : ${f.keyFacts.join(' | ')}
- Sources : ${f.sources.map(s => `${s.title} (${s.url})`).join(', ')}

=== VERSION GRAND PUBLIC (1000-1500 mots) ===
Structure :
1. **Titre accrocheur** informatif
2. **L'essentiel** : Resume en 3 points
3. **Contexte** : Pourquoi cette info est importante
4. **Ce que ca change** : Impact concret
5. **Eclairage expert** : Mise en perspective
6. **FAQ** : 3-4 questions
7. **Disclaimer**

=== VERSION PROFESSIONNELS (1500-2500 mots) ===
Structure :
1. **Points cles**
2. **Analyse detaillee** : Decryptage approfondi
3. **Contexte reglementaire/scientifique**
4. **Implications pratiques** : Impact sur la pratique
5. **Etudes en lien** : Cross-reference
6. **References**

${buildJsonTemplate(slug, f)}`;
}

function buildJsonTemplate(slug: string, f: ResearchFinding): string {
  return `
=== FORMAT DE REPONSE ===
Reponds STRICTEMENT en JSON valide :
{
  "slug": "${slug}",
  "category": "${f.category}",
  "author": "Equipe MediTrouve",
  "public": {
    "title": "...",
    "excerpt": "... (120-250 chars, accrocheur)",
    "content": "... (markdown complet, TOUT le contenu)",
    "readTime": N
  },
  "pro": {
    "title": "...",
    "excerpt": "... (120-300 chars)",
    "content": "... (markdown complet, TOUT le contenu)",
    "readTime": N
  },
  "keywords": ["mot-cle-1", "mot-cle-2", ...],
  "seoTitle": "... (max 65 chars)",
  "seoDescription": "... (max 155 chars)",
  "sources": ${JSON.stringify(f.sources)}
}

IMPORTANT :
- JSON valide, escape les guillemets dans le markdown
- Contenu markdown COMPLET et pret a publier (pas de placeholders)
- Articles LONGS et DETAILLES selon les limites de mots indiquees
- Minimum 6 keywords pertinents pour le SEO
- Cross-reference avec etudes/sources quand pertinent`;
}

/**
 * ✍️ Génère un article complet et cross-référencé
 */
export async function generateComprehensiveArticle(finding: ResearchFinding): Promise<GeneratedArticle> {
  console.log(`✍️ Génération article complet [${finding.category}] : "${finding.topic.substring(0, 60)}..."...`);

  const apiKey = OPENROUTER_API_KEY || ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('❌ OPENROUTER_API_KEY ou ANTHROPIC_API_KEY manquante');
  }
  const useOpenRouter = !!OPENROUTER_API_KEY;

  const slug = generateSlug(finding.topic, finding.category);
  const { system, user } = buildPrompt(finding, slug);

  try {
    const endpoint = useOpenRouter
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.anthropic.com/v1/messages';

    const headers: Record<string, string> = useOpenRouter
      ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }
      : { 'Content-Type': 'application/json', 'x-api-key': apiKey!, 'anthropic-version': '2023-06-01' };

    const body = useOpenRouter
      ? JSON.stringify({
          model: GENERATION_MODEL,
          max_tokens: 16000,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        })
      : JSON.stringify({
          model: GENERATION_MODEL,
          max_tokens: 16000,
          system,
          messages: [{ role: 'user', content: user }],
        });

    const response = await fetch(endpoint, { method: 'POST', headers, body });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API error ${response.status}: ${err.substring(0, 200)}`);
    }

    const data = await response.json();
    const textContent = useOpenRouter
      ? data.choices?.[0]?.message?.content
      : data.content?.find((c: any) => c.type === 'text')?.text;

    if (!textContent) {
      throw new Error('Pas de contenu dans la réponse');
    }

    // Extraire le JSON de la réponse
    let jsonStr = textContent;
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    } else {
      jsonStr = textContent.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    }

    const parsed = JSON.parse(jsonStr);

    // S'assurer que keywords est un array
    if (parsed.keywords && typeof parsed.keywords === 'string') {
      parsed.keywords = [parsed.keywords];
    }

    // Ajouter researchData
    parsed.researchData = {
      findingId: finding.id,
      originalTopic: finding.topic,
      originalSummary: finding.summary,
      keyFacts: finding.keyFacts,
      category: finding.category,
      sourcesCount: finding.sources.length,
      generatedAt: new Date().toISOString(),
      model: GENERATION_MODEL,
      pipelineVersion: 'v2-multi-source',
    };

    // Force slug
    parsed.slug = slug;

    const article = GeneratedArticleSchema.parse(parsed);

    console.log(`✅ Article généré : "${article.seoTitle || article.public.title}"`);
    console.log(`  📂 Catégorie: ${article.category}`);
    console.log(`  📖 Public: ${article.public.readTime} min | Pro: ${article.pro.readTime} min`);
    console.log(`  🏷️ Keywords: ${article.keywords.slice(0, 4).join(', ')}...`);
    console.log(`  🔗 Sources: ${article.sources.length}`);

    return article;
  } catch (error) {
    console.error(`❌ Erreur génération pour "${finding.topic.substring(0, 50)}":`, error);
    throw error;
  }
}
