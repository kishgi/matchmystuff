export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function calculateLocationScore(
  locationA: string,
  locationB: string,
): number {
  const normalize = (s: string) => s.toLowerCase().trim();
  const a = normalize(locationA);
  const b = normalize(locationB);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.6;

  const partsA = a.split(/[,\s]+/).filter((p) => p.length > 2);
  const partsB = new Set(b.split(/[,\s]+/).filter((p) => p.length > 2));
  let shared = 0;
  for (const part of partsA) {
    if (partsB.has(part)) shared++;
  }
  if (shared > 0) return Math.min(0.5, 0.2 + shared * 0.15);
  return 0;
}

/** Token overlap on title + description + aiDescription */
export function keywordOverlapScore(
  postA: { title: string; description: string; aiDescription?: string },
  postB: { title: string; description: string; aiDescription?: string },
): number {
  const text = (p: typeof postA) =>
    `${p.title} ${p.description} ${p.aiDescription ?? ""}`.toLowerCase();
  const tokens = (s: string) =>
    new Set(
      s
        .split(/[^a-z0-9]+/i)
        .map((t) => t.trim())
        .filter((t) => t.length > 2),
    );

  const setA = tokens(text(postA));
  const setB = tokens(text(postB));
  if (setA.size === 0 || setB.size === 0) return 0;

  let overlap = 0;
  for (const t of setA) {
    if (setB.has(t)) overlap++;
  }
  return overlap / Math.min(setA.size, setB.size);
}

export function computeMatchScore(
  post: { embedding: number[]; location: string; title: string; description: string; aiDescription?: string },
  candidate: { embedding: number[]; location: string; title: string; description: string; aiDescription?: string },
): number {
  const similarity = cosineSimilarity(post.embedding, candidate.embedding);
  const locationScore = calculateLocationScore(post.location, candidate.location);
  const keywordScore = keywordOverlapScore(post, candidate);

  const blended =
    similarity * 0.78 + locationScore * 0.12 + keywordScore * 0.1;

  return Math.min(1, Math.max(similarity, blended));
}
