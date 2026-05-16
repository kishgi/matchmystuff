"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/Skeleton";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { timeAgo } from "@/lib/time";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const post = useQuery(api.posts.getPostById, { id: id as Id<"posts"> });

  if (post === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Skeleton className="mb-6 aspect-square" />
        <Skeleton className="mb-4 h-8 w-2/3" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center" style={{ color: C.slate }}>
        {COPY.post.notFound}
      </div>
    );
  }

  const accent = post.type === "lost" ? C.coral : C.sky;

  return (
    <article className="mx-auto max-w-2xl px-4 py-12">
      <div className="relative mb-6 aspect-square overflow-hidden rounded-2xl bg-gray-50">
        {post.imageUrl && (
          <Image src={post.imageUrl} alt="" fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 672px" />
        )}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full px-3 py-1 text-xs font-medium text-white" style={{ backgroundColor: accent }}>
          {post.type === "lost" ? COPY.postCard.lost : COPY.postCard.found}
        </span>
        {post.matched && (
          <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white">
            {COPY.postCard.matched}
          </span>
        )}
      </div>
      <h1 className="text-3xl font-bold" style={{ color: C.teal }}>
        {post.title}
      </h1>
      <p className="mt-2 text-sm" style={{ color: C.slate }}>
        {post.location} · {post.userName} · {timeAgo(post.createdAt)}
      </p>
      <section className="mt-8">
        <p className="text-base leading-relaxed" style={{ color: C.slate }}>
          {post.description}
        </p>
      </section>
      {post.aiDescription && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold" style={{ color: C.sky }}>
            {COPY.post.aiLabel}
          </h2>
          <p className="text-sm italic leading-relaxed" style={{ color: C.slate }}>
            {post.aiDescription}
          </p>
        </section>
      )}
      {post.matched && (
        <Link
          href="/matches"
          className="mt-8 inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: C.teal }}
        >
          {COPY.post.viewMatches}
        </Link>
      )}
    </article>
  );
}
