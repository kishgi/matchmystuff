import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createPost = mutation({
  args: {
    type: v.union(v.literal("lost"), v.literal("found")),
    title: v.string(),
    description: v.string(),
    location: v.string(),
    imageStorageId: v.string(),
    userName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const imageUrl = await ctx.storage.getUrl(
      args.imageStorageId as Parameters<typeof ctx.storage.getUrl>[0],
    );
    if (!imageUrl) throw new Error("Invalid image");

    const postId = await ctx.db.insert("posts", {
      type: args.type,
      title: args.title,
      description: args.description,
      location: args.location,
      imageUrl,
      userId: userId as string,
      userName: args.userName,
      matched: false,
      embedding: [],
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
    if (type) {
      return await ctx.db
        .query("posts")
        .withIndex("by_type_created", (q) => q.eq("type", type))
        .order("desc")
        .take(50);
    }
    return await ctx.db.query("posts").order("desc").take(50);
  },
});

export const getPostById = query({
  args: { id: v.id("posts") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
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
    await ctx.db.patch(id, { embedding, aiDescription });
  },
});

export const getPostInternal = internalQuery({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    return await ctx.db.get(postId);
  },
});
