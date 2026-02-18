// ============================================
// 📝 AUTO-BLOG TYPES v2
// Types TypeScript pour le pipeline multi-sources
// ============================================

import { z } from 'zod/v4';

// ============================================
// RESEARCH TYPES
// ============================================

export const SourceSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  publisher: z.string().min(1),
  date: z.string(),
  credibility: z.enum(['institutional', 'scientific', 'professional', 'media']),
});

export type Source = z.infer<typeof SourceSchema>;

export const ResearchFindingSchema = z.object({
  id: z.string(),
  topic: z.string().min(10),
  summary: z.string().min(20),
  category: z.enum([
    'rupture-stock',
    'alerte-sanitaire',
    'nouveau-medicament',
    'reglementation',
    'prevention',
    'pharmacovigilance',
    'etude-scientifique',
    'avancee-medicale',
    'actualite-sante',
  ]),
  sources: z.array(SourceSchema).min(1),
  relevanceScore: z.number().min(0).max(100).optional(),
  dateDiscovered: z.string(),
  keyFacts: z.array(z.string()).min(1),
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
  timeliness: z.number().min(0).max(100),
  sourceReliability: z.number().min(0).max(100),
  patientImpact: z.number().min(0).max(100),
  professionalRelevance: z.number().min(0).max(100),
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
  content: z.string().min(500),
  readTime: z.number().min(1).max(20),
});

export type ArticlePublic = z.infer<typeof ArticlePublicSchema>;

export const ArticleProSchema = z.object({
  title: z.string().min(10),
  excerpt: z.string().min(50).max(400),
  content: z.string().min(1000),
  readTime: z.number().min(3).max(40),
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
  sources: z.array(SourceSchema).min(1),
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
  duration: number;
  timestamp: string;
}

export interface PipelineConfig {
  maxTopics: number;
  topN: number;
  minScore: number;
  dryRun: boolean;
}

export const DEFAULT_CONFIG: PipelineConfig = {
  maxTopics: 10,
  topN: 3,
  minScore: 70,
  dryRun: false,
};
