import { z } from "zod";
export function adminError(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string>,
  detail?: string,
) {
  const requestId = crypto.randomUUID();
  console.warn(JSON.stringify({ scope: "admin", requestId, code, detail }));
  return Response.json({ code, message, fieldErrors, requestId }, { status });
}
export function validationError(error: z.ZodError) {
  const labels: Record<string, string> = {
    name: "Məhsulun adı",
    price: "Qiymət",
    slug: "Slug",
    source_url: "Mənbə keçidi",
    brand_id: "Brend",
    category_id: "Kateqoriya",
    description: "Təsvir",
    status: "Status",
    expected_updated_at: "Yenilənmə vaxtı",
  };
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(
      issue.path[issue.path[0] === "record" ? 1 : 0] || "form",
    );
    fields[key] =
      (
        {
          price: "Qiymət 0 və ya daha böyük, ən çox 2 onluq rəqəmli olmalıdır.",
          source_url: "https:// ilə başlayan düzgün mənbə keçidi yazın.",
          slug: "Slug yalnız kiçik latın hərfləri, rəqəm və defis ola bilər.",
          brand_id: "Brendi siyahıdan seçin və ya yeni brend yaradın.",
          category_id: "Kateqoriyanı siyahıdan seçin.",
        } as Record<string, string>
      )[key] || (labels[key] || key) + ": məlumatı yoxlayın.";
  }
  return adminError(
    422,
    "VALIDATION",
    "Qeyd olunan sahələri düzəldin. Yazdıqlarınız formadadır; yenidən cəhd edin.",
    fields,
  );
}
export function databaseError(error: { code?: string; message?: string }) {
  const errors: Record<string, [number, string, string]> = {
    "23505": [
      409,
      "DUPLICATE",
      "Bu slug və ya qeyd artıq mövcuddur. Mövcud məhsulu seçin və ya yeni slug yazın.",
    ],
    "23503": [
      422,
      "REFERENCE",
      "Seçilmiş brend və ya kateqoriya mövcud deyil. Siyahını yeniləyin.",
    ],
    "42501": [403, "FORBIDDEN", "Bu əməliyyat üçün idarəçi icazəsi yoxdur."],
    PGRST116: [
      409,
      "CONFLICT",
      "Qeyd tapılmadı və ya başqa pəncərədə dəyişdirilib. Yeniləyib təkrar yoxlayın.",
    ],
    "42703": [
      503,
      "SCHEMA",
      "Verilənlər bazasının versiyası uyğun deyil. Administratora məlumat verin.",
    ],
    "42883": [
      503,
      "SCHEMA",
      "Tələb olunan verilənlər bazası funksiyası hazır deyil.",
    ],
    PGRST202: [
      503,
      "SCHEMA",
      "İdxal funksiyası hazır deyil. Administratora məlumat verin.",
    ],
  };
  if (error.message === "IMAGE_CONFLICT")
    return adminError(
      409,
      "CONFLICT",
      "Foto başqa pəncərədə dəyişdirilib. Yeniləyib təkrar yoxlayın.",
    );
  if (error.message?.startsWith("IMPORT_ROW_"))
    return adminError(
      422,
      "IMPORT_ROW",
      error.message.replace(/[^\w :.-]/g, "").slice(0, 160),
    );
  const [status, code, message] = errors[error.code || ""] || [
    422,
    "DATABASE",
    "Əməliyyat saxlanmadı. Məlumatları yoxlayın və göstərilən sorğu kodunu administratora göndərin.",
  ];
  return adminError(status, code, message, undefined, error.code);
}
