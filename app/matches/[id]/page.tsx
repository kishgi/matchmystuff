"use client";

import { use, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/Skeleton";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { timeAgo } from "@/lib/time";

function MatchSide({
  post,
}: {
  post: {
    imageUrl: string;
    title: string;
    description: string;
    aiDescription?: string;
    location: string;
    userName: string;
    createdAt: number;
    type: "lost" | "found";
  };
}) {
  const accent = post.type === "lost" ? C.coral : C.sky;
  return (
    <div className="flex-1 space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50">
        {post.imageUrl && (
          <Image src={post.imageUrl} alt="" fill className="object-cover" sizes="50vw" />
        )}
      </div>
      <h2 className="text-xl font-bold" style={{ color: C.teal }}>
        {post.title}
      </h2>
      <p className="text-sm" style={{ color: C.slate }}>
        {post.description}
      </p>
      {post.aiDescription && (
        <p className="text-sm italic" style={{ color: C.slate }}>
          {post.aiDescription}
        </p>
      )}
      <p className="text-sm" style={{ color: C.slate }}>
        {post.location}
      </p>
      <p className="text-xs" style={{ color: C.slate }}>
        {post.userName} · {timeAgo(post.createdAt)}
      </p>
      <span
        className="inline-block rounded-full px-2 py-1 text-xs text-white"
        style={{ backgroundColor: accent }}
      >
        {post.type === "lost" ? COPY.postCard.lost : COPY.postCard.found}
      </span>
    </div>
  );
}

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const matchId = id as Id<"matches">;
  const matches = useQuery(api.matches.getMatchesForUser);
  const markMatchSeen = useMutation(api.matches.markMatchSeen);
  const match = matches?.find((m) => m._id === matchId);

  useEffect(() => {
    if (match && !match.seen) void markMatchSeen({ matchId });
  }, [match, markMatchSeen, matchId]);

  if (matches === undefined) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <Skeleton className="mb-8 h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center">
        <Link href="/matches" className="text-sm hover:underline" style={{ color: C.teal }}>
          {COPY.matches.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link href="/matches" className="mb-8 inline-block text-sm hover:underline" style={{ color: C.teal }}>
        {COPY.matches.back}
      </Link>
      <div className="flex flex-col items-stretch gap-8 lg:flex-row">
        <MatchSide post={match.postA} />
        <div className="flex flex-col items-center justify-center px-4">
          <div className="hidden h-full w-px bg-gray-200 lg:block" />
          <span className="my-4 rounded-full bg-green-500 px-4 py-2 text-lg font-bold text-white lg:my-0">
            {Math.round(match.score * 100)}% {COPY.matches.scoreLabel}
          </span>
        </div>
        <MatchSide post={match.postB} />
      </div>
    </div>
  );
}
