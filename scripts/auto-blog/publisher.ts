// ============================================
// 📤 PUBLISHER MODULE
// Publication en base de données via Prisma
// ============================================

import { PrismaClient } from '@prisma/client';
import { GeneratedArticle, QualityCheck } from './types';
import { getAuthorForArticle, formatAuthor } from './authors';

let prisma: PrismaClient;

function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * 📤 Publier un article validé en base de données
 * Auto-publish si score >= minScore
 */
export async function publishArticle(
  article: GeneratedArticle,
  qualityCheck: QualityCheck,
  minScore: number = 80
): Promise<{ id: string; published: boolean }> {
  const db = getPrisma();
  const shouldPublish = qualityCheck.approved && qualityCheck.overallScore >= minScore;

  // Sélectionner un auteur approprié (favoriser médecins pour articles techniques)
  const authorObj = getAuthorForArticle(article.category, article.category === 'Traitements' || article.category === 'Innovations');
  const authorName = formatAuthor(authorObj, true); // Avec titre (ex: "Dr. Maëlle Dupont, Pharmacienne")

  console.log(`📤 Publication article "${article.slug}" (score: ${qualityCheck.overallScore})...`);
  console.log(`✍️ Auteur : ${authorName}`);

  try {
    // Vérifier si le slug existe déjà
    const existing = await db.blogPost.findUnique({
      where: { slug: article.slug },
    });

    if (existing) {
      console.log(`⚠️ Article "${article.slug}" existe déjà, mise à jour...`);
      const updated = await db.blogPost.update({
        where: { slug: article.slug },
        data: {
          title: article.public.title,
          category: article.category,
          author: authorName,
          excerptPublic: article.public.excerpt,
          contentPublic: article.public.content,
          readTimePublic: article.public.readTime,
          excerptPro: article.pro.excerpt,
          contentPro: article.pro.content,
          readTimePro: article.pro.readTime,
          keywords: article.keywords,
          seoTitle: article.seoTitle,
          seoDescription: article.seoDescription,
          sources: article.sources as any,
          researchData: article.researchData as any,
          validationScore: qualityCheck.overallScore,
          isPublished: shouldPublish,
        },
      });
      console.log(`✅ Article mis à jour : ${updated.id}`);
      return { id: updated.id, published: shouldPublish };
    }

    const created = await db.blogPost.create({
      data: {
        slug: article.slug,
        title: article.public.title,
        category: article.category,
        author: authorName,
        excerptPublic: article.public.excerpt,
        contentPublic: article.public.content,
        readTimePublic: article.public.readTime,
        excerptPro: article.pro.excerpt,
        contentPro: article.pro.content,
        readTimePro: article.pro.readTime,
        keywords: article.keywords,
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription,
        sources: article.sources as any,
        researchData: article.researchData as any,
        validatedBy: qualityCheck.checkedBy,
        validationScore: qualityCheck.overallScore,
        isPublished: shouldPublish,
      },
    });

    const emoji = shouldPublish ? '✅' : '⏸️';
    console.log(`${emoji} Article créé : ${created.id} (publié: ${shouldPublish})`);

    return { id: created.id, published: shouldPublish };
  } catch (error) {
    console.error(`❌ Erreur publication "${article.slug}":`, error);
    throw error;
  }
}

/**
 * 🔌 Fermer la connexion Prisma
 */
export async function disconnect(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}
