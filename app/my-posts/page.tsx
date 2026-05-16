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
    <div className="page-container">
      <h1 className="mb-12" style={{ color: C.teal }}>
        {COPY.nav.myPosts}
      </h1>
      {posts === undefined ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="mb-10 text-lg leading-relaxed md:text-xl" style={{ color: C.slate }}>
            {COPY.myPosts.empty}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
            <Link href="/report/lost" className="btn-primary" style={{ backgroundColor: C.coral }}>
              {COPY.myPosts.reportLost}
            </Link>
            <Link href="/report/found" className="btn-primary" style={{ backgroundColor: C.sky }}>
              {COPY.myPosts.reportFound}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
              processingStatus={post.processingStatus}
              rejectionReason={post.rejectionReason}
            />
          ))}
        </div>
      )}
    </div>
  );
}
