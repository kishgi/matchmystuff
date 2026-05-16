import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getPosts = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_created")
      .order("desc")
      .take(50);
    return posts;
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
    const posts = await ctx.db.query("posts").order("desc").collect();
    return posts.filter((p) => p.userId === userId);
  },
});

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
    const imageUrl = await ctx.storage.getUrl(args.imageStorageId);
    if (!imageUrl) throw new Error("Invalid image");
    const { imageStorageId: _, ...rest } = args;
    const postId = await ctx.db.insert("posts", {
      ...rest,
      imageUrl,
      userId,
      aiDescription: args.description,
      matched: false,
      createdAt: Date.now(),
    });
    return postId;
  },
});
