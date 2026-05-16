import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMatchesForUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const result = [];
    for (const m of matches) {
      const postA = await ctx.db.get(m.postAId);
      const postB = await ctx.db.get(m.postBId);
      if (!postA || !postB) continue;
      const userA = await ctx.db.get(postA.userId);
      const userB = await ctx.db.get(postB.userId);
      result.push({
        ...m,
        postA: { ...postA, contactEmail: userA?.email ?? "" },
        postB: { ...postB, contactEmail: userB?.email ?? "" },
      });
    }
    return result;
  },
});

export const markMatchSeen = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const match = await ctx.db.get(matchId);
    if (!match || match.userId !== userId) return;
    await ctx.db.patch(matchId, { seen: true });
  },
});
