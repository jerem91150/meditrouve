import { z } from "zod";

// Email validation
export const emailSchema = z
  .string()
  .email("Format d'email invalide")
  .max(255, "Email trop long")
  .transform((email) => email.toLowerCase().trim());

// Password validation - strong password requirements
export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .max(128, "Le mot de passe est trop long")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
  .regex(
    /[^A-Za-z0-9]/,
    "Le mot de passe doit contenir au moins un caractère spécial"
  );

// Name validation
export const nameSchema = z
  .string()
  .min(2, "Le nom doit contenir au moins 2 caractères")
  .max(100, "Le nom est trop long")
  .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Le nom contient des caractères invalides")
  .transform((name) => name.trim());

// Phone validation (French format)
export const phoneSchema = z
  .string()
  .regex(
    /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
    "Format de téléphone invalide"
  )
  .transform((phone) => phone.replace(/[\s.-]/g, ""));

// Medication search query validation
export const searchQuerySchema = z
  .string()
  .min(2, "La recherche doit contenir au moins 2 caractères")
  .max(100, "La recherche est trop longue")
  .transform((query) => sanitizeSearchQuery(query));

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema.optional(),
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis"),
});

// Alert creation schema
export const createAlertSchema = z.object({
  medicationId: z.string().cuid("ID de médicament invalide"),
  type: z.enum(["RUPTURE", "TENSION", "AVAILABLE", "PREDICTION", "ANY_CHANGE"]).default("AVAILABLE"),
});

// Profile schema
export const profileSchema = z.object({
  name: nameSchema,
  relation: z.enum(["self", "parent", "child", "spouse", "other"]).default("self"),
  birthDate: z.string().datetime().optional(),
  notes: z.string().max(500, "Notes trop longues").optional(),
});

// Sanitization functions
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>\"'`;]/g, "") // Remove potentially dangerous characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .substring(0, 100); // Limit length
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Validate and sanitize user input
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => {
    const path = err.path.join(".");
    return path ? `${path}: ${err.message}` : err.message;
  });

  return { success: false, errors };
}

// Rate limiting key generator
export function generateRateLimitKey(
  type: string,
  identifier: string
): string {
  return `${type}:${identifier}`;
}

// Check if string looks like a SQL injection attempt
export function detectSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
    /(--|#|\/\*|\*\/)/,
    /('|")\s*(OR|AND)\s*('|")?/i,
    /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

// Check if string looks like a XSS attempt
export function detectXss(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
    /on\w+\s*=/i,
    /<\s*img[^>]+onerror/i,
    /<\s*svg[^>]+onload/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

// Comprehensive input validation
export function validateAndSanitize(
  input: string,
  options: {
    maxLength?: number;
    allowHtml?: boolean;
    checkSql?: boolean;
    checkXss?: boolean;
  } = {}
): { valid: boolean; sanitized: string; error?: string } {
  const {
    maxLength = 1000,
    allowHtml = false,
    checkSql = true,
    checkXss = true,
  } = options;

  // Check length
  if (input.length > maxLength) {
    return { valid: false, sanitized: "", error: "Input too long" };
  }

  // Check for SQL injection
  if (checkSql && detectSqlInjection(input)) {
    return { valid: false, sanitized: "", error: "Suspicious input detected" };
  }

  // Check for XSS
  if (checkXss && detectXss(input)) {
    return { valid: false, sanitized: "", error: "Suspicious input detected" };
  }

  // Sanitize
  let sanitized = input.trim();
  if (!allowHtml) {
    sanitized = sanitizeHtml(sanitized);
  }

  return { valid: true, sanitized };
}
