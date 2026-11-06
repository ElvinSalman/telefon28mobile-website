// PostgREST caps each response. Stable, unique ordering is required by callers.
export async function readPages<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const data: T[] = [];
  const size = 500;
  for (let from = 0; ; from += size) {
    const result = await page(from, from + size - 1);
    if (result.error || !result.data)
      return { data: [], error: result.error || new Error("Missing page") };
    data.push(...result.data);
    if (result.data.length < size) return { data, error: null };
  }
}
