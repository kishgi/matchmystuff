const SRI_LANKA_CENTER = { lat: 7.8731, lng: 80.7718 };
const GEOCODE_DELAY_MS = 150;

export { SRI_LANKA_CENTER };

export async function geocodeLocation(
  location: string,
): Promise<{ lat: number; lng: number } | null> {
  const q = location.trim();
  if (!q) return null;
  try {
    const params = new URLSearchParams({ q });
    const res = await fetch(`/api/geocode?${params.toString()}`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      lat: number | null;
      lng: number | null;
    };
    if (data.lat == null || data.lng == null || Number.isNaN(data.lat)) {
      return null;
    }
    return { lat: data.lat, lng: data.lng };
  } catch {
    return null;
  }
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function generalArea(location: string): string {
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return parts.slice(0, 2).join(", ");
  }
  return parts[0] ?? location;
}

export async function geocodeLocationsBatch(
  locations: string[],
  cache: Map<string, { lat: number; lng: number } | null>,
  onProgress?: () => void,
): Promise<void> {
  const unique = [...new Set(locations.map((l) => l.trim()).filter(Boolean))];
  for (const loc of unique) {
    if (cache.has(loc)) continue;
    await new Promise((r) => setTimeout(r, GEOCODE_DELAY_MS));
    const coords = await geocodeLocation(loc);
    cache.set(loc, coords);
    onProgress?.();
  }
}
