import { NextRequest, NextResponse } from "next/server";

type Coords = { lat: number; lng: number } | null;

const cache = new Map<string, Coords>();

async function geocodeWithPhoton(query: string): Promise<Coords> {
  const params = new URLSearchParams({
    q: query,
    limit: "1",
    lang: "en",
  });
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    features?: { geometry?: { coordinates?: [number, number] } }[];
  };
  const coords = data.features?.[0]?.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;

  const [lng, lat] = coords;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

async function geocodeWithNominatim(query: string): Promise<Coords> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "MatchMyStuff/1.0 (lost-and-found)",
      },
      next: { revalidate: 86400 },
    },
  );
  if (!res.ok) return null;

  const data = (await res.json()) as { lat: string; lon: string }[];
  const hit = data[0];
  if (!hit) return null;

  const lat = parseFloat(hit.lat);
  const lng = parseFloat(hit.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const cacheKey = q.toLowerCase();
  if (cache.has(cacheKey)) {
    const hit = cache.get(cacheKey)!;
    return NextResponse.json(hit ?? { lat: null, lng: null });
  }

  const searchQ = q.includes("Sri Lanka") ? q : `${q}, Sri Lanka`;

  try {
    let coords =
      (await geocodeWithPhoton(searchQ)) ??
      (await geocodeWithNominatim(searchQ));

    cache.set(cacheKey, coords);
    return NextResponse.json(coords ?? { lat: null, lng: null });
  } catch {
    return NextResponse.json({ error: "Geocode failed" }, { status: 500 });
  }
}
