// ============================================
// 📝 AUTO-BLOG TYPES
// Types TypeScript stricts pour le pipeline de génération d'articles
// ============================================

import { z } from 'zod/v4';

// ============================================
// RESEARCH TYPES
// ============================================

export const SourceSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  publisher: z.string().min(1), // ANSM, HAS, Vidal, etc.
  date: z.string(), // ISO date or "2025-02-09" format
  credibility: z.enum(['institutional', 'scientific', 'professional', 'media']),
});

export type Source = z.infer<typeof SourceSchema>;

export const ResearchFindingSchema = z.object({
  id: z.string(),
  topic: z.string().min(10),
  summary: z.string().min(50),
  category: z.enum([
    'rupture-stock',
    'alerte-sanitaire',
    'nouveau-medicament',
    'reglementation',
    'prevention',
    'pharmacovigilance',
  ]),
  sources: z.array(SourceSchema).min(3),
  relevanceScore: z.number().min(0).max(100).optional(),
  dateDiscovered: z.string(),
  keyFacts: z.array(z.string()).min(2),
});

export type ResearchFinding = z.infer<typeof ResearchFindingSchema>;

export const ResearchResultSchema = z.object({
  findings: z.array(ResearchFindingSchema).min(1),
  researchDate: z.string(),
  model: z.string(),
});

export type ResearchResult = z.infer<typeof ResearchResultSchema>;

// ============================================
// VALIDATION TYPES
// ============================================

export const ValidationCriteriaSchema = z.object({
  timeliness: z.number().min(0).max(100), // Actualité du sujet
  sourceReliability: z.number().min(0).max(100), // Fiabilité des sources
  patientImpact: z.number().min(0).max(100), // Impact patient
  professionalRelevance: z.number().min(0).max(100), // Pertinence pro
  overallScore: z.number().min(0).max(100),
});

export type ValidationCriteria = z.infer<typeof ValidationCriteriaSchema>;

export const ValidationResultSchema = z.object({
  findingId: z.string(),
  criteria: ValidationCriteriaSchema,
  approved: z.boolean(),
  feedback: z.string(),
  validatedBy: z.string().default('Gemini Pro'),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// ============================================
// ARTICLE GENERATION TYPES
// ============================================

export const ArticlePublicSchema = z.object({
  title: z.string().min(10),
  excerpt: z.string().min(50).max(300),
  content: z.string().min(500), // Markdown, 800-1000 mots
  readTime: z.number().min(1).max(15),
});

export type ArticlePublic = z.infer<typeof ArticlePublicSchema>;

export const ArticleProSchema = z.object({
  title: z.string().min(10),
  excerpt: z.string().min(50).max(400),
  content: z.string().min(1000), // Markdown, 1500-2000 mots
  readTime: z.number().min(3).max(30),
});

export type ArticlePro = z.infer<typeof ArticleProSchema>;

export const GeneratedArticleSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.string(),
  author: z.string().default('Équipe MediTrouve'),
  public: ArticlePublicSchema,
  pro: ArticleProSchema,
  keywords: z.array(z.string()).min(3),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  sources: z.array(SourceSchema).min(5),
  researchData: z.any().optional(),
});

export type GeneratedArticle = z.infer<typeof GeneratedArticleSchema>;

// ============================================
// QUALITY CHECK TYPES
// ============================================

export const QualityCheckSchema = z.object({
  articleSlug: z.string(),
  coherenceBetweenVersions: z.number().min(0).max(100),
  sourcesCount: z.number().min(0),
  unsourcedClaims: z.number().min(0),
  publicVersionScore: z.number().min(0).max(100),
  proVersionScore: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  approved: z.boolean(),
  issues: z.array(z.string()),
  checkedBy: z.string().default('Gemini Pro'),
});

export type QualityCheck = z.infer<typeof QualityCheckSchema>;

// ============================================
// PIPELINE TYPES
// ============================================

export interface PipelineResult {
  success: boolean;
  articlesGenerated: number;
  articlesPublished: number;
  articles: Array<{
    slug: string;
    title: string;
    score: number;
    published: boolean;
  }>;
  errors: string[];
  duration: number; // ms
  timestamp: string;
}

export interface PipelineConfig {
  maxTopics: number; // Default 6
  topN: number; // Default 3 (top findings to generate)
  minScore: number; // Default 80
  dryRun: boolean; // Don't publish
}

export const DEFAULT_CONFIG: PipelineConfig = {
  maxTopics: 6,
  topN: 3,
  minScore: 80,
  dryRun: false,
};
