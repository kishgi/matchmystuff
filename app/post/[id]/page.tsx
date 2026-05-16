"use client";

import { use, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { OpenChatButton } from "@/components/OpenChatButton";
import { Skeleton } from "@/components/Skeleton";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { timeAgo } from "@/lib/time";
import { toastError } from "@/lib/toast";

type ProcessingStatus = "pending" | "processing" | "ready" | "rejected";

function StatusBanner({
  status,
  rejectionReason,
}: {
  status?: ProcessingStatus;
  rejectionReason?: string;
}) {
  if (status === "rejected") {
    return (
      <div
        className="mb-6 rounded-2xl border-2 px-4 py-4 sm:px-5"
        style={{ borderColor: C.coral, backgroundColor: `${C.coral}12` }}
        role="alert"
      >
        <p className="font-semibold" style={{ color: C.coral }}>
          {COPY.post.rejected}
        </p>
        {rejectionReason && (
          <p className="mt-2 text-sm leading-relaxed" style={{ color: C.slate }}>
            {rejectionReason}
          </p>
        )}
        <p className="mt-2 text-sm" style={{ color: C.slate }}>
          {COPY.post.rejectedHint}
        </p>
      </div>
    );
  }

  if (status === "pending" || status === "processing") {
    return (
      <div
        className="mb-6 rounded-2xl border-2 px-4 py-4 sm:px-5"
        style={{ borderColor: C.sky, backgroundColor: `${C.sky}12` }}
        role="status"
      >
        <p className="flex items-center gap-2 font-semibold" style={{ color: C.teal }}>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {COPY.post.processing}
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: C.slate }}>
          {COPY.post.processingHint}
        </p>
      </div>
    );
  }

  return null;
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const postId = id as Id<"posts">;
  const { isAuthenticated } = useConvexAuth();
  const post = useQuery(api.posts.getPostById, { id: postId });
  const matchForPost = useQuery(
    api.matches.getMatchForPost,
    isAuthenticated ? { postId } : "skip",
  );

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
      <div className="page-container-narrow text-center text-base sm:text-lg" style={{ color: C.slate }}>
        {COPY.post.notFound}
      </div>
    );
  }

  const accent = post.type === "lost" ? C.coral : C.sky;
  const status = post.processingStatus as ProcessingStatus | undefined;
  const authRedirect = `/auth?redirect=${encodeURIComponent(`/post/${postId}`)}`;

  return (
    <article className="page-container-narrow">
      <StatusBanner status={status} rejectionReason={post.rejectionReason} />

      <div className="relative mb-6 aspect-square overflow-hidden rounded-2xl bg-gray-50 shadow-sm sm:mb-8">
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 672px"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="text-base font-medium sm:text-lg" style={{ color: C.teal }}>
              {COPY.post.noImage}
            </p>
          </div>
        )}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-5 sm:gap-3">
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold text-white sm:px-4 sm:py-1.5 sm:text-sm"
          style={{ backgroundColor: accent }}
        >
          {post.type === "lost" ? COPY.postCard.lost : COPY.postCard.found}
        </span>
        {post.matched && (
          <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white sm:px-4 sm:py-1.5 sm:text-sm">
            {COPY.postCard.matched}
          </span>
        )}
        {status === "rejected" && (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-white sm:px-4 sm:py-1.5 sm:text-sm"
            style={{ backgroundColor: C.coral }}
          >
            {COPY.myPosts.statusRejected}
          </span>
        )}
      </div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl" style={{ color: C.teal }}>
        {post.title}
      </h1>
      <p className="mt-2 text-sm sm:mt-3 sm:text-base" style={{ color: C.slate }}>
        {post.location} · {post.userName} · {timeAgo(post.createdAt)}
      </p>
      <section className="card-surface mt-8 sm:mt-10">
        <h2 className="mb-3 text-base font-semibold md:text-lg" style={{ color: C.teal }}>
          Description
        </h2>
        <p className="text-base leading-relaxed md:text-lg" style={{ color: C.slate }}>
          {post.description}
        </p>
      </section>
      {post.aiDescription && (
        <section className="card-surface mt-4 sm:mt-6">
          <h2 className="mb-3 text-base font-semibold md:text-lg" style={{ color: C.sky }}>
            {COPY.post.aiLabel}
          </h2>
          <p className="text-base italic leading-relaxed md:text-lg" style={{ color: C.slate }}>
            {post.aiDescription}
          </p>
        </section>
      )}

      {post.matched && (
        <section className="mt-8 rounded-2xl border border-gray-100 bg-gray-50/80 p-5 sm:mt-10 sm:p-6">
          <h2 className="mb-4 text-base font-semibold md:text-lg" style={{ color: C.teal }}>
            {COPY.matches.openChat}
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {isAuthenticated && matchForPost ? (
              <OpenChatButton matchId={matchForPost.matchId} className="w-full sm:w-auto" />
            ) : !isAuthenticated ? (
              <Link
                href={authRedirect}
                className="btn-primary w-full text-center sm:w-auto"
                style={{ backgroundColor: C.teal }}
              >
                {COPY.post.signInToChat}
              </Link>
            ) : (
              <p className="text-sm leading-relaxed sm:text-base" style={{ color: C.slate }}>
                {COPY.post.chatUnavailable}{" "}
                <Link href="/matches" className="font-medium underline" style={{ color: C.teal }}>
                  {COPY.post.viewMatches}
                </Link>
              </p>
            )}
            {isAuthenticated && (
              <Link
                href="/matches"
                className={`btn-ghost w-full text-center sm:w-auto ${matchForPost ? "" : "border-transparent"}`}
                style={matchForPost ? { borderColor: C.teal, color: C.teal } : { backgroundColor: C.teal, color: "#fff", borderColor: C.teal }}
              >
                {COPY.post.viewMatches}
              </Link>
            )}
          </div>
        </section>
      )}
    </article>
  );
}
