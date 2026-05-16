"use client";

import { use, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/Skeleton";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { timeAgo } from "@/lib/time";
import { toastError } from "@/lib/toast";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const post = useQuery(api.posts.getPostById, { id: id as Id<"posts"> });

  useEffect(() => {
    if (post === null) {
      toastError(COPY.toast.postNotFound);
    }
  }, [post]);

  if (post === undefined) {
    return (
      <div className="page-container-narrow">
        <Skeleton className="mb-8 aspect-square" />
        <Skeleton className="mb-5 h-10 w-2/3" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page-container-narrow text-center text-lg" style={{ color: C.slate }}>
        {COPY.post.notFound}
      </div>
    );
  }

  const accent = post.type === "lost" ? C.coral : C.sky;

  return (
    <article className="page-container-narrow">
      <div className="relative mb-8 aspect-square overflow-hidden rounded-2xl bg-gray-50 shadow-sm">
        {post.imageUrl && (
          <Image
            src={post.imageUrl}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 672px"
          />
        )}
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span
          className="rounded-full px-4 py-1.5 text-sm font-semibold text-white"
          style={{ backgroundColor: accent }}
        >
          {post.type === "lost" ? COPY.postCard.lost : COPY.postCard.found}
        </span>
        {post.matched && (
          <span className="rounded-full bg-green-500 px-4 py-1.5 text-sm font-semibold text-white">
            {COPY.postCard.matched}
          </span>
        )}
      </div>
      <h1 style={{ color: C.teal }}>{post.title}</h1>
      <p className="mt-3 text-base" style={{ color: C.slate }}>
        {post.location} · {post.userName} · {timeAgo(post.createdAt)}
      </p>
      <section className="card-surface mt-10 p-6 md:p-8">
        <p className="text-base leading-relaxed md:text-lg" style={{ color: C.slate }}>
          {post.description}
        </p>
      </section>
      {post.aiDescription && (
        <section className="card-surface mt-6 p-6 md:p-8">
          <h2 className="mb-3 text-base font-semibold md:text-lg" style={{ color: C.sky }}>
            {COPY.post.aiLabel}
          </h2>
          <p className="text-base italic leading-relaxed md:text-lg" style={{ color: C.slate }}>
            {post.aiDescription}
          </p>
        </section>
      )}
      {post.matched && (
        <Link href="/matches" className="btn-primary mt-10" style={{ backgroundColor: C.teal }}>
          {COPY.post.viewMatches}
        </Link>
      )}
    </article>
  );
}
