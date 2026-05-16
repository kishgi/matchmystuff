import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function ownerEmail(
  ctx: { db: { get: (id: Id<"users">) => Promise<{ email?: string } | null> } },
  userId: string,
) {
  const user = await ctx.db.get(userId as Id<"users">);
  return user?.email ?? "";
}

export const getMatchesForUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const userIdStr = userId as string;
    const matchesA = await ctx.db
      .query("matches")
      .withIndex("by_postA")
      .collect();
    const matchesB = await ctx.db
      .query("matches")
      .withIndex("by_postB")
      .collect();

    const seenIds = new Set<string>();
    const allMatches = [...matchesA, ...matchesB].filter((m) => {
      if (seenIds.has(m._id)) return false;
      seenIds.add(m._id);
      return true;
    });

    const result = [];
    for (const match of allMatches) {
      const postA = await ctx.db.get(match.postA);
      const postB = await ctx.db.get(match.postB);
      if (!postA || !postB) continue;

      const ownsA = postA.userId === userIdStr;
      const ownsB = postB.userId === userIdStr;
      if (!ownsA && !ownsB) continue;

      const emailA = await ownerEmail(ctx, postA.userId);
      const emailB = await ownerEmail(ctx, postB.userId);

      result.push({
        ...match,
        seen: ownsA ? match.seenByA : match.seenByB,
        postA: {
          ...postA,
          contactEmail: ownsA ? "" : emailA,
        },
        postB: {
          ...postB,
          contactEmail: ownsB ? "" : emailB,
        },
      });
    }

    return result.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const createMatch = internalMutation({
  args: {
    postA: v.id("posts"),
    postB: v.id("posts"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const [postAId, postBId] =
      args.postA < args.postB
        ? [args.postA, args.postB]
        : [args.postB, args.postA];

    const existingA = await ctx.db
      .query("matches")
      .withIndex("by_postA", (q) => q.eq("postA", postAId))
      .collect();
    if (existingA.some((m) => m.postB === postBId)) {
      return existingA.find((m) => m.postB === postBId)!._id;
    }

    const postA = await ctx.db.get(postAId);
    const postB = await ctx.db.get(postBId);
    if (!postA || !postB) return null;

    const matchId = await ctx.db.insert("matches", {
      postA: postAId,
      postB: postBId,
      score: args.score,
      seenByA: false,
      seenByB: false,
      createdAt: Date.now(),
    });

    const now = Date.now();
    await ctx.db.insert("notifications", {
      userId: postA.userId,
      matchId,
      postId: postAId,
      seen: false,
      createdAt: now,
    });
    await ctx.db.insert("notifications", {
      userId: postB.userId,
      matchId,
      postId: postBId,
      seen: false,
      createdAt: now,
    });

    await ctx.db.patch(postAId, { matched: true });
    await ctx.db.patch(postBId, { matched: true });

    return matchId;
  },
});

export const markMatchSeen = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const userIdStr = userId as string;
    const match = await ctx.db.get(matchId);
    if (!match) return;

    const postA = await ctx.db.get(match.postA);
    const postB = await ctx.db.get(match.postB);
    if (!postA || !postB) return;

    if (postA.userId === userIdStr) {
      await ctx.db.patch(matchId, { seenByA: true });
    }
    if (postB.userId === userIdStr) {
      await ctx.db.patch(matchId, { seenByB: true });
    }
  },
});
