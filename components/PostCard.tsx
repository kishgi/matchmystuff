"use client";

import Image from "next/image";
import Link from "next/link";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { timeAgo } from "@/lib/time";
import type { Id } from "@/convex/_generated/dataModel";

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
    <article className="group relative rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
      <Link href={`/post/${_id}`} className="block">
        <span
          className="absolute left-6 top-6 z-10 rounded-full px-2 py-1 text-xs text-white"
          style={{ backgroundColor: accent }}
        >
          {badgeLabel}
        </span>
        {matched && (
          <span className="absolute right-6 top-6 z-10 rounded-full bg-green-500 px-2 py-1 text-xs text-white">
            {COPY.postCard.matched}
          </span>
        )}
        <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-gray-50">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : null}
        </div>
        <h3 className="font-semibold" style={{ color: C.teal }}>
          {title}
        </h3>
        <p className="text-sm" style={{ color: C.slate }}>
          {location} · {timeAgo(createdAt)}
        </p>
        <p className="mt-1 text-xs" style={{ color: C.slate }}>
          {userName}
        </p>
      </Link>
      {matched && (
        <Link
          href={matchHref}
          className="mt-3 inline-block rounded-full border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50"
          style={{ borderColor: accent, color: accent }}
        >
          {COPY.postCard.viewMatch}
        </Link>
      )}
    </article>
  );
}
