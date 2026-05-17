/** Normalize Convex user ids for consistent equality checks across auth + posts. */
export function normalizeUserId(id: string | null | undefined): string {
  if (id == null) return "";
  return String(id).trim();
}

export function isSameUser(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const na = normalizeUserId(a);
  const nb = normalizeUserId(b);
  if (!na || !nb) return false;
  return na === nb;
}
