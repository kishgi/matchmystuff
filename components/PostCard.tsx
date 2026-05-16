"use client";

import Image from "next/image";
import Link from "next/link";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { timeAgo } from "@/lib/time";
import type { Id } from "@/convex/_generated/dataModel";

const BLUR =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+";

export type PostCardProps = {
  _id: Id<"posts">;
  type: "lost" | "found";
  title: string;
  location: string;
  createdAt: number;
  imageUrl: string;
  matched: boolean;
  userName: string;
  matchHref?: string;
};

export function PostCard({
  _id,
  type,
  title,
  location,
  createdAt,
  imageUrl,
  matched,
  userName,
  matchHref = "/matches",
}: PostCardProps) {
  const accent = type === "lost" ? C.coral : C.sky;
  const badgeLabel = type === "lost" ? COPY.postCard.lost : COPY.postCard.found;

  return (
    <article className="card-surface group relative p-5 transition-all duration-200 hover:scale-[1.02]">
      <Link href={`/post/${_id}`} className="block">
        <span
          className="absolute left-7 top-7 z-10 rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: accent }}
        >
          {badgeLabel}
        </span>
        {matched && (
          <span className="absolute right-7 top-7 z-10 animate-pulse rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
            {COPY.postCard.matched}
          </span>
        )}
        <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-gray-50">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              placeholder="blur"
              blurDataURL={BLUR}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : null}
        </div>
        <h3 className="text-lg font-semibold" style={{ color: C.teal }}>
          {title}
        </h3>
        <p className="mt-1 text-base" style={{ color: C.slate }}>
          {location} · {timeAgo(createdAt)}
        </p>
        <p className="mt-1.5 text-sm" style={{ color: C.slate }}>
          {userName}
        </p>
      </Link>
      {matched && (
        <Link
          href={matchHref}
          className="btn-ghost mt-4"
          style={{ borderColor: accent, color: accent }}
        >
          {COPY.postCard.viewMatch}
        </Link>
      )}
    </article>
  );
}
