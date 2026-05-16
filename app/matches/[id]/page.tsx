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
import { toastError } from "@/lib/toast";

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
    <div className="card-surface flex-1 space-y-5 p-6 md:p-8">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50">
        {post.imageUrl && (
          <Image src={post.imageUrl} alt="" fill className="object-cover" sizes="50vw" />
        )}
      </div>
      <h2 className="text-2xl font-bold" style={{ color: C.teal }}>
        {post.title}
      </h2>
      <p className="text-base leading-relaxed" style={{ color: C.slate }}>
        {post.description}
      </p>
      {post.aiDescription && (
        <p className="text-base italic leading-relaxed" style={{ color: C.slate }}>
          {post.aiDescription}
        </p>
      )}
      <p className="text-base" style={{ color: C.slate }}>
        {post.location}
      </p>
      <p className="text-sm" style={{ color: C.slate }}>
        {post.userName} · {timeAgo(post.createdAt)}
      </p>
      <span
        className="inline-block rounded-full px-3 py-1 text-sm font-semibold text-white"
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

  useEffect(() => {
    if (matches !== undefined && !match) {
      toastError(COPY.toast.matchNotFound);
    }
  }, [matches, match]);

  if (matches === undefined) {
    return (
      <div className="page-container">
        <Skeleton className="mb-8 h-10 w-48" />
        <Skeleton className="h-[28rem]" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="page-container text-center">
        <Link
          href="/matches"
          className="text-base transition-colors hover:underline hover:underline-offset-4"
          style={{ color: C.teal }}
        >
          {COPY.matches.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Link
        href="/matches"
        className="mb-10 inline-block text-base transition-colors hover:underline hover:underline-offset-4"
        style={{ color: C.teal }}
      >
        {COPY.matches.back}
      </Link>
      <div className="flex flex-col items-stretch gap-8 lg:flex-row">
        <MatchSide post={match.postA} />
        <div className="flex flex-col items-center justify-center px-4">
          <span className="rounded-full bg-green-500 px-5 py-2.5 text-xl font-bold text-white">
            {Math.round(match.score * 100)}% {COPY.matches.scoreLabel}
          </span>
        </div>
        <MatchSide post={match.postB} />
      </div>
    </div>
  );
}
