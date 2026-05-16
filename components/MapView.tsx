"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Id } from "@/convex/_generated/dataModel";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import {
  geocodeLocation,
  geocodeLocationsBatch,
  generalArea,
  SRI_LANKA_CENTER,
} from "@/lib/geocode";
import "leaflet/dist/leaflet.css";

const MAP_CENTER_DEFAULT: [number, number] = [
  SRI_LANKA_CENTER.lat,
  SRI_LANKA_CENTER.lng,
];

export type MapPost = {
  _id: Id<"posts">;
  type: "lost" | "found";
  title: string;
  location: string;
  imageUrl: string;
  userId: string;
};

type GeocodedPost = MapPost & { lat: number; lng: number };

function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    const t1 = setTimeout(fix, 0);
    const t2 = setTimeout(fix, 250);
    window.addEventListener("resize", fix);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", fix);
    };
  }, [map]);
  return null;
}

function MapFlyTo({
  target,
  zoom,
  token,
}: {
  target: [number, number] | null;
  zoom: number;
  token: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.flyTo(target, zoom, { duration: 0.6 });
  }, [map, target, zoom, token]);

  return null;
}

function makePinIcon(post: MapPost) {
  const borderColor = post.type === "lost" ? C.coral : C.sky;
  const fallback = post.type === "lost" ? "🔍" : "📦";
  const pinSize = 36;
  const imgSize = 30;
  const inner = post.imageUrl
    ? `<img src="${post.imageUrl}" alt="" width="${imgSize}" height="${imgSize}" style="display:block;width:${imgSize}px;height:${imgSize}px;object-fit:cover;" />`
    : `<span style="font-size:16px;line-height:${imgSize}px;display:block;text-align:center;">${fallback}</span>`;
  return L.divIcon({
    className: "",
    html: `<div style="width:${pinSize}px;height:${pinSize}px;border-radius:6px;overflow:hidden;border:2px solid ${borderColor};background:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">${inner}</div>`,
    iconSize: [pinSize, pinSize],
    iconAnchor: [pinSize / 2, pinSize],
    popupAnchor: [0, -pinSize],
  });
}

export function MapView({
  posts,
  userCoords,
  matchedPostIds,
  currentUserId,
}: {
  posts: MapPost[];
  userCoords: { lat: number; lng: number } | null;
  matchedPostIds: Set<string>;
  currentUserId: string | null;
}) {
  const geocodeCache = useRef(new Map<string, { lat: number; lng: number } | null>());
  const [geocoded, setGeocoded] = useState<GeocodedPost[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeSearching, setPlaceSearching] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [flyZoom, setFlyZoom] = useState(7);
  const [flyToken, setFlyToken] = useState(0);

  const postsWithLocation = useMemo(
    () => posts.filter((p) => p.location.trim().length > 0),
    [posts],
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (postsWithLocation.length === 0) {
        setGeocoded([]);
        setGeocoding(false);
        return;
      }
      setGeocoding(true);
      await geocodeLocationsBatch(
        postsWithLocation.map((p) => p.location),
        geocodeCache.current,
        () => {
          if (!cancelled) {
            const partial: GeocodedPost[] = [];
            for (const post of postsWithLocation) {
              const coords = geocodeCache.current.get(post.location.trim());
              if (coords) partial.push({ ...post, ...coords });
            }
            setGeocoded(partial);
          }
        },
      );
      if (cancelled) return;
      const result: GeocodedPost[] = [];
      for (const post of postsWithLocation) {
        const coords = geocodeCache.current.get(post.location.trim());
        if (coords) result.push({ ...post, ...coords });
      }
      setGeocoded(result);
      setGeocoding(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [postsWithLocation]);

  const userLocatedRef = useRef(false);
  const placeSearchRef = useRef(false);

  useEffect(() => {
    if (placeSearchRef.current) return;
    if (userCoords && !userLocatedRef.current) {
      userLocatedRef.current = true;
      setFlyTarget([userCoords.lat, userCoords.lng]);
      setFlyZoom(9);
      setFlyToken((t) => t + 1);
      return;
    }
    if (!userCoords && geocoded.length > 0 && !flyTarget) {
      const lat = geocoded.reduce((s, p) => s + p.lat, 0) / geocoded.length;
      const lng = geocoded.reduce((s, p) => s + p.lng, 0) / geocoded.length;
      setFlyTarget([lat, lng]);
      setFlyZoom(8);
      setFlyToken((t) => t + 1);
    }
  }, [userCoords, geocoded, flyTarget]);

  const initialCenter = useMemo((): [number, number] => {
    if (userCoords) return [userCoords.lat, userCoords.lng];
    if (geocoded.length > 0) {
      const lat = geocoded.reduce((s, p) => s + p.lat, 0) / geocoded.length;
      const lng = geocoded.reduce((s, p) => s + p.lng, 0) / geocoded.length;
      return [lat, lng];
    }
    return MAP_CENTER_DEFAULT;
  }, [userCoords, geocoded]);

  const initialZoom = userCoords ? 9 : geocoded.length > 0 ? 8 : 7;

  const showLimited = (post: MapPost) =>
    post.type === "found" &&
    post.userId !== currentUserId &&
    !matchedPostIds.has(post._id);

  const handlePlaceSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = placeQuery.trim();
    if (!q) return;
    setPlaceError(null);
    setPlaceSearching(true);
    try {
      const coords = await geocodeLocation(q);
      if (!coords) {
        setPlaceError(COPY.map.placeSearchFailed);
        return;
      }
      placeSearchRef.current = true;
      setFlyTarget([coords.lat, coords.lng]);
      setFlyZoom(12);
      setFlyToken((t) => t + 1);
    } catch {
      setPlaceError(COPY.map.placeSearchFailed);
    } finally {
      setPlaceSearching(false);
    }
  };

  return (
    <div className="card-surface overflow-hidden rounded-2xl">
      <div className="border-b border-gray-100 px-4 py-3 md:px-5">
        <h3 className="text-lg font-semibold" style={{ color: C.teal }}>
          {COPY.map.title}
        </h3>
        <p className="mt-1 text-sm" style={{ color: C.slate }}>
          {geocoding
            ? COPY.map.loading
            : userCoords
              ? COPY.map.nearbyHint
              : COPY.map.defaultHint}
        </p>
        <form
          onSubmit={(e) => void handlePlaceSearch(e)}
          className="mt-3 flex flex-col gap-2 sm:flex-row"
        >
          <input
            type="search"
            value={placeQuery}
            onChange={(e) => {
              setPlaceQuery(e.target.value);
              setPlaceError(null);
            }}
            placeholder={COPY.map.placeSearchPlaceholder}
            className="input-field min-w-0 flex-1 text-sm"
            aria-label={COPY.map.placeSearchPlaceholder}
          />
          <button
            type="submit"
            disabled={placeSearching || !placeQuery.trim()}
            className="btn-primary w-full shrink-0 px-4 py-2 text-sm disabled:opacity-60 sm:w-auto"
            style={{ backgroundColor: C.teal }}
          >
            {placeSearching ? "…" : COPY.map.placeSearchButton}
          </button>
        </form>
        {placeError && (
          <p className="mt-2 text-sm" style={{ color: C.coral }} role="alert">
            {placeError}
          </p>
        )}
      </div>
      <div className="relative z-0 h-[260px] w-full sm:h-[300px] md:h-[360px] lg:h-[400px]">
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          className="h-full w-full rounded-none"
          scrollWheelZoom
          style={{ height: "100%", width: "100%", minHeight: 260 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapResizeFix />
          <MapFlyTo target={flyTarget} zoom={flyZoom} token={flyToken} />
          {geocoded.map((post) => (
            <Marker
              key={post._id}
              position={[post.lat, post.lng]}
              icon={makePinIcon(post)}
            >
              <Popup>
                <div className="min-w-[200px] max-w-[240px] text-sm sm:min-w-[220px]">
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="mb-3 h-28 w-full rounded-lg object-cover sm:h-32"
                    />
                  ) : null}
                  <p className="font-semibold" style={{ color: C.teal }}>
                    {showLimited(post) ? COPY.map.foundItem : post.title}
                  </p>
                  <p className="mt-1 text-gray-600">
                    {showLimited(post)
                      ? generalArea(post.location)
                      : post.location}
                  </p>
                  {showLimited(post) && (
                    <p className="mt-1 text-xs text-gray-500">
                      {COPY.map.foundPrivacy}
                    </p>
                  )}
                  <Link
                    href={`/post/${post._id}`}
                    className="mt-2 inline-block font-medium underline"
                    style={{
                      color: post.type === "lost" ? C.coral : C.sky,
                    }}
                  >
                    {COPY.map.viewPost}
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 px-4 py-3 text-sm md:px-5">
        <span className="flex items-center gap-2" style={{ color: C.slate }}>
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: C.coral }}
          />
          {COPY.map.legendLost}
        </span>
        <span className="flex items-center gap-2" style={{ color: C.slate }}>
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: C.sky }}
          />
          {COPY.map.legendFound}
        </span>
        {!geocoding && geocoded.length === 0 && postsWithLocation.length > 0 && (
          <span className="text-gray-500">{COPY.map.noPins}</span>
        )}
        {!geocoding && postsWithLocation.length === 0 && (
          <span className="text-gray-500">{COPY.map.noPins}</span>
        )}
      </div>
    </div>
  );
}
