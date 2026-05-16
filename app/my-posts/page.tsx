"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PostCard } from "@/components/PostCard";
import { Skeleton } from "@/components/Skeleton";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";

export default function MyPostsPage() {
  const posts = useQuery(api.posts.getMyPosts);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-10 text-3xl font-bold" style={{ color: C.teal }}>
        {COPY.nav.myPosts}
      </h1>
      {posts === undefined ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="mb-8 text-lg" style={{ color: C.slate }}>
            {COPY.myPosts.empty}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/report/lost"
              className="rounded-full px-6 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: C.coral }}
            >
              {COPY.myPosts.reportLost}
            </Link>
            <Link
              href="/report/found"
              className="rounded-full px-6 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: C.sky }}
            >
              {COPY.myPosts.reportFound}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              _id={post._id}
              type={post.type}
              title={post.title}
              location={post.location}
              createdAt={post.createdAt}
              imageUrl={post.imageUrl}
              matched={post.matched}
              userName={post.userName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
