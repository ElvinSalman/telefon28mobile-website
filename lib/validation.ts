import { z } from "zod";
export const slug = z
  .string()
  .max(160)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ə/g, "e")
    .replace(/ı/g, "i")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
export const productInput = z.object({
  slug,
  name: z.string().trim().min(1).max(160),
  brand_id: slug,
  category_id: slug,
  price: z.number().min(0).max(9999999999).multipleOf(0.01),
  featured: z.boolean().default(false),
  source_url: z.string().url().startsWith("https://").nullable().default(null),
  storage: z.string().max(80).default(""),
  color: z.string().max(80).default(""),
  condition: z.enum(["new", "used", "refurbished"]).nullable().default(null),
  description: z
    .object({
      az: z.string().max(4000).optional(),
      ru: z.string().max(4000).optional(),
      en: z.string().max(4000).optional(),
    })
    .default({}),
  specifications: z.record(z.string().max(80), z.string().max(300)).default({}),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});
export const tradeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d ()-]{7,22}$/)
    .refine((v) => v.replace(/\D/g, "").length >= 7),
  model: z.string().trim().min(2).max(140),
  storage: z.string().trim().min(1).max(80),
  condition: z.enum(["good", "fair", "damaged"]),
  notes: z.string().max(1500),
  consent: z.literal(true),
  website: z.literal(""),
});
