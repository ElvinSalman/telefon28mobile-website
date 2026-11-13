export const cleanOption = (value: string) => value.trim().replace(/\s+/g, " ");

// Reuse the admin catalog already fetched from Supabase; preserve current spelling.
export function productOptions(values: string[], current = "") {
  const unique = new Map<string, string>();
  for (const raw of [current, ...values]) {
    const value = cleanOption(raw || "");
    const key = value.normalize("NFKC").toLocaleLowerCase("az");
    if (value && !unique.has(key)) unique.set(key, value);
  }
  return [...unique.values()].sort((a, b) => a.localeCompare(b, "az"));
}
