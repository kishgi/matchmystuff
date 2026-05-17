import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { normalizeUserId } from "./lib/userIds";

function isPublicPost(post: {
  processingStatus?: "pending" | "processing" | "ready" | "rejected";
  embedding: number[];
}) {
  const status = post.processingStatus ?? "ready";
  return status === "ready" && post.embedding.length > 0;
}

export const createPost = mutation({
  args: {
    type: v.union(v.literal("lost"), v.literal("found")),
    title: v.string(),
    description: v.string(),
    location: v.string(),
    imageStorageId: v.optional(v.string()),
    userName: v.string(),
    aiDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    let imageUrl = "";
    if (args.imageStorageId) {
      const url = await ctx.storage.getUrl(
        args.imageStorageId as Parameters<typeof ctx.storage.getUrl>[0],
      );
      if (!url) throw new Error("Invalid image");
      imageUrl = url;
    }

    const postId = await ctx.db.insert("posts", {
      type: args.type,
      title: args.title,
      description: args.description,
      location: args.location,
      imageUrl,
      aiDescription: args.aiDescription,
      userId: normalizeUserId(userId as string),
      userName: args.userName,
      matched: false,
      embedding: [],
      processingStatus: "pending",
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.actions.processPost, { postId });
    return postId;
  },
});

export const getPosts = query({
  args: {
    type: v.optional(v.union(v.literal("lost"), v.literal("found"))),
  },
  handler: async (ctx, { type }) => {
    const rows = type
      ? await ctx.db
          .query("posts")
          .withIndex("by_type_created", (q) => q.eq("type", type))
          .order("desc")
          .take(80)
      : await ctx.db.query("posts").order("desc").take(80);
    return rows.filter(isPublicPost).slice(0, 50);
  },
});

export const getPostById = query({
  args: { id: v.id("posts") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const searchPosts = query({
  args: {
    query: v.string(),
    type: v.optional(v.union(v.literal("lost"), v.literal("found"))),
  },
  handler: async (ctx, { query, type }) => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const tokens = q.split(/\s+/).filter(Boolean);
    const rows = await ctx.db.query("posts").order("desc").take(200);

    return rows
      .filter(isPublicPost)
      .filter((p) => !type || p.type === type)
      .filter((p) => {
        const hay = `${p.title} ${p.description}`.toLowerCase();
        return tokens.every((token) => hay.includes(token));
      })
      .slice(0, 24)
      .map((p) => ({
        _id: p._id,
        type: p.type,
        title: p.title,
        location: p.location,
        createdAt: p.createdAt,
        imageUrl: p.imageUrl,
        matched: p.matched,
        userName: p.userName,
      }));
  },
});

export const getMyPosts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", userId as string))
      .order("desc")
      .collect();
  },
});

export const updateEmbedding = internalMutation({
  args: {
    id: v.id("posts"),
    embedding: v.array(v.float64()),
    aiDescription: v.string(),
  },
  handler: async (ctx, { id, embedding, aiDescription }) => {
    await ctx.db.patch(id, {
      embedding,
      aiDescription,
      processingStatus: "ready",
    });
  },
});

export const setProcessingStatus = internalMutation({
  args: {
    id: v.id("posts"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("rejected"),
    ),
  },
  handler: async (ctx, { id, status }) => {
    await ctx.db.patch(id, { processingStatus: status });
  },
});

export const markRejected = internalMutation({
  args: {
    id: v.id("posts"),
    reason: v.string(),
  },
  handler: async (ctx, { id, reason }) => {
    await ctx.db.patch(id, {
      processingStatus: "rejected",
      rejectionReason: reason,
      embedding: [],
    });
  },
});

export const getPostInternal = internalQuery({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    return await ctx.db.get(postId);
  },
});

/** All ready opposite-type posts for real-time brute-force matching */
export const listReadyPostsByType = internalQuery({
  args: {
    type: v.union(v.literal("lost"), v.literal("found")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { type, limit = 120 }) => {
    const rows = await ctx.db
      .query("posts")
      .withIndex("by_type_created", (q) => q.eq("type", type))
      .order("desc")
      .take(limit);

    return rows.filter(
      (p) =>
        (p.processingStatus ?? "ready") === "ready" &&
        p.embedding.length > 0,
    );
  },
});
