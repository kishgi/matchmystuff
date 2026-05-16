import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const createMatch = internalMutation({
  args: {
    postA: v.id("posts"),
    postB: v.id("posts"),
    similarity: v.number(),
  },
  handler: async (ctx, args) => {
    const [postA, postB] =
      args.postA < args.postB
        ? [args.postA, args.postB]
        : [args.postB, args.postA];
    const existing = await ctx.db
      .query("matches")
      .withIndex("by_posts", (q) => q.eq("postA", postA).eq("postB", postB))
      .unique();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("matches", {
      postA,
      postB,
      similarity: args.similarity,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("matches").order("desc").collect();
  },
});
