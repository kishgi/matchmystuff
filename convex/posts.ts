import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import { internal } from "./_generated/api";

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    imageUrl: v.string(),
    location: v.string(),
    type: v.union(v.literal("lost"), v.literal("found")),
  },
  handler: async (ctx, args) => {
    const postId = await ctx.db.insert("posts", {
      title: args.title,
      description: args.description,
      imageUrl: args.imageUrl,
      location: args.location,
      type: args.type,
      embeddingProcessed: false,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(
      0,
      internal.actions.processPost.processPost,
      { postId }
    );
    return postId;
  },
});

export const getPostInternal = internalQuery({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    return await ctx.db.get(postId);
  },
});

export const listOppositePostsWithEmbeddings = internalQuery({
  args: {
    type: v.union(v.literal("lost"), v.literal("found")),
    excludePostId: v.id("posts"),
  },
  handler: async (ctx, { type, excludePostId }) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_type", (q) => q.eq("type", type))
      .collect();
    return posts.filter(
      (post) =>
        post._id !== excludePostId &&
        post.embedding !== undefined &&
        post.embedding.length > 0
    );
  },
});

export const saveAiDescription = internalMutation({
  args: {
    postId: v.id("posts"),
    aiDescription: v.string(),
  },
  handler: async (ctx, { postId, aiDescription }) => {
    await ctx.db.patch(postId, { aiDescription });
  },
});

export const updateEmbedding = internalMutation({
  args: {
    postId: v.id("posts"),
    aiDescription: v.string(),
    combinedText: v.string(),
    embedding: v.array(v.float64()),
    embeddingProcessed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { postId, ...fields } = args;
    await ctx.db.patch(postId, fields);
  },
});
