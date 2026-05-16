"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTable } from "@/components/admin/AdminTable";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { C } from "@/lib/colors";
import { formatAdminDate } from "@/lib/adminFormat";
import { useAdminArgs } from "@/lib/useAdminArgs";
import { toastError, toastSuccess } from "@/lib/toast";

type TypeFilter = "all" | "lost" | "found";

export default function AdminPostsPage() {
  const adminArgs = useAdminArgs();
  const [filter, setFilter] = useState<TypeFilter>("all");
  const posts = useQuery(
    api.admin.getAllPosts,
    adminArgs === "skip"
      ? "skip"
      : filter === "all"
        ? adminArgs
        : { ...adminArgs, type: filter },
  );
  const deletePost = useMutation(api.admin.deletePost);

  const handleDelete = async (postId: Id<"posts">) => {
    if (adminArgs === "skip") return;
    try {
      await deletePost({ ...adminArgs, postId });
      toastSuccess("Post deleted");
    } catch {
      toastError("Failed to delete post");
    }
  };

  return (
    <AdminShell title="Posts">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(["all", "lost", "found"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className="rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors"
            style={{
              backgroundColor:
                filter === t
                  ? t === "lost"
                    ? C.coral
                    : t === "found"
                      ? C.sky
                      : C.teal
                  : `${C.slate}10`,
              color: filter === t ? C.white : C.slate,
            }}
          >
            {t}
          </button>
        ))}
        <input
          type="search"
          placeholder="Search title or location…"
          className="input-field ml-auto max-w-xs flex-1 text-sm"
          onChange={(e) => {
            const q = e.target.value.toLowerCase();
            const rows = document.querySelectorAll<HTMLTableRowElement>(
              "[data-admin-post-row]",
            );
            rows.forEach((row) => {
              const text = row.dataset.search ?? "";
              row.style.display = text.includes(q) ? "" : "none";
            });
          }}
        />
      </div>

      <AdminTable
        headers={["Item", "Type", "Location", "User", "Created", ""]}
        emptyMessage={posts?.length === 0 ? "No posts found" : undefined}
      >
        {posts?.map((post) => (
          <tr
            key={post._id}
            data-admin-post-row
            data-search={`${post.title} ${post.location} ${post.userName}`.toLowerCase()}
          >
            <td className="px-4 py-3 md:px-5">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={post.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/post/${post._id}`}
                    className="font-medium hover:underline"
                    style={{ color: C.teal }}
                  >
                    {post.title}
                  </Link>
                  <p className="truncate text-xs text-gray-500">
                    {post.description.slice(0, 60)}
                  </p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 capitalize md:px-5">
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                style={{
                  backgroundColor: post.type === "lost" ? C.coral : C.sky,
                }}
              >
                {post.type}
              </span>
            </td>
            <td className="max-w-[140px] truncate px-4 py-3 md:px-5">
              {post.location}
            </td>
            <td className="px-4 py-3 md:px-5">{post.userName}</td>
            <td className="whitespace-nowrap px-4 py-3 text-gray-500 md:px-5">
              {formatAdminDate(post.createdAt)}
            </td>
            <td className="px-4 py-3 text-right md:px-5">
              <DeleteButton onConfirm={() => handleDelete(post._id)} />
            </td>
          </tr>
        ))}
      </AdminTable>
    </AdminShell>
  );
}
