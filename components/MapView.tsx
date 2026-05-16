"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Id } from "@/convex/_generated/dataModel";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import {
  geocodeLocationsBatch,
  generalArea,
  haversineKm,
  SRI_LANKA_CENTER,
} from "@/lib/geocode";
import "leaflet/dist/leaflet.css";

const NEARBY_KM = 120;
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

function MapRecenter({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

function makePinIcon(post: MapPost) {
  const borderColor = post.type === "lost" ? C.coral : C.sky;
  const fallback = post.type === "lost" ? "🔍" : "📦";
  const inner = post.imageUrl
    ? `<img src="${post.imageUrl}" alt="" width="16" height="16" style="display:block;width:16px;height:16px;object-fit:cover;" />`
    : `<span style="font-size:12px;line-height:16px;display:block;text-align:center;">${fallback}</span>`;
  return L.divIcon({
    className: "",
    html: `<div style="width:20px;height:20px;border-radius:4px;overflow:hidden;border:2px solid ${borderColor};background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">${inner}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -20],
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

  const postsWithLocation = useMemo(
    () => posts.filter((p) => p.location.trim().length > 0),
    [posts],
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (postsWithLocation.length === 0) {
        setGeocoded([]);
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

  const visible = useMemo(() => {
    if (!userCoords) return geocoded;
    return geocoded.filter(
      (p) => haversineKm(userCoords, { lat: p.lat, lng: p.lng }) <= NEARBY_KM,
    );
  }, [geocoded, userCoords]);

  const center = useMemo((): [number, number] => {
    if (userCoords) return [userCoords.lat, userCoords.lng];
    if (visible.length > 0) {
      const lat = visible.reduce((s, p) => s + p.lat, 0) / visible.length;
      const lng = visible.reduce((s, p) => s + p.lng, 0) / visible.length;
      return [lat, lng];
    }
    return MAP_CENTER_DEFAULT;
  }, [userCoords, visible]);

  const zoom = userCoords ? 9 : visible.length > 0 ? 8 : 7;

  const showLimited = (post: MapPost) =>
    post.type === "found" &&
    post.userId !== currentUserId &&
    !matchedPostIds.has(post._id);

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
      </div>
      <div className="relative h-[220px] w-full md:h-[320px]" style={{ zIndex: 0 }}>
        <MapContainer
          center={center}
          zoom={zoom}
          className="h-full w-full"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter center={center} zoom={zoom} />
          {visible.map((post) => (
            <Marker
              key={post._id}
              position={[post.lat, post.lng]}
              icon={makePinIcon(post)}
            >
              <Popup>
                {showLimited(post) ? (
                  <div className="min-w-[140px] text-sm">
                    <p className="font-semibold" style={{ color: C.sky }}>
                      {COPY.map.foundItem}
                    </p>
                    <p className="mt-1 text-gray-600">
                      {generalArea(post.location)}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {COPY.map.foundPrivacy}
                    </p>
                  </div>
                ) : (
                  <div className="min-w-[160px] text-sm">
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt=""
                        className="mb-2 h-16 w-16 rounded-lg object-cover"
                      />
                    ) : null}
                    <p className="font-semibold" style={{ color: C.teal }}>
                      {post.title}
                    </p>
                    <p className="mt-1 text-gray-600">{post.location}</p>
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
                )}
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
        {!geocoding && visible.length === 0 && (
          <span className="text-gray-500">{COPY.map.noPins}</span>
        )}
      </div>
    </div>
  );
}
