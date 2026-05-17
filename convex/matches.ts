import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { normalizeUserId } from "./lib/userIds";

async function ownerEmail(
  ctx: { db: { get: (id: Id<"users">) => Promise<{ email?: string } | null> } },
  userId: string,
) {
  const user = await ctx.db.get(userId as Id<"users">);
  return user?.email ?? "";
}

function resolveParticipants(
  match: {
    participantA?: string;
    participantB?: string;
    postA: Id<"posts">;
    postB: Id<"posts">;
  },
  postA: { userId: string },
  postB: { userId: string },
) {
  return {
    participantA: normalizeUserId(match.participantA ?? postA.userId),
    participantB: normalizeUserId(match.participantB ?? postB.userId),
  };
}

export const getMatchesForUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const userIdStr = normalizeUserId(userId as string);

    const asParticipantA = await ctx.db
      .query("matches")
      .withIndex("by_participantA", (q) => q.eq("participantA", userIdStr))
      .collect();
    const asParticipantB = await ctx.db
      .query("matches")
      .withIndex("by_participantB", (q) => q.eq("participantB", userIdStr))
      .collect();

    const seenIds = new Set<string>();
    const allMatches = [...asParticipantA, ...asParticipantB].filter((m) => {
      if (seenIds.has(m._id)) return false;
      seenIds.add(m._id);
      return true;
    });

    // Legacy rows (before participantA/B were stored) — resolve owners from posts
    const legacyA = await ctx.db
      .query("matches")
      .withIndex("by_postA")
      .collect();
    const legacyB = await ctx.db
      .query("matches")
      .withIndex("by_postB")
      .collect();
    for (const m of [...legacyA, ...legacyB]) {
      if (m.participantA && m.participantB) continue;
      if (seenIds.has(m._id)) continue;
      seenIds.add(m._id);
      allMatches.push(m);
    }

    console.log(
      `getMatchesForUser: userId=${userIdStr} indexHits=${allMatches.length}`,
    );

    const result = [];
    for (const match of allMatches) {
      const postA = await ctx.db.get(match.postA);
      const postB = await ctx.db.get(match.postB);
      if (!postA || !postB) continue;

      const { participantA, participantB } = resolveParticipants(
        match,
        postA,
        postB,
      );

      const isParticipantA = participantA === userIdStr;
      const isParticipantB = participantB === userIdStr;
      if (!isParticipantA && !isParticipantB) {
        console.log(
          `getMatchesForUser: skip match ${match._id} reason=not_participant participants=${participantA},${participantB}`,
        );
        continue;
      }

      const emailA = await ownerEmail(ctx, postA.userId);
      const emailB = await ownerEmail(ctx, postB.userId);

      result.push({
        ...match,
        seen: isParticipantA ? match.seenByA : match.seenByB,
        postA: {
          ...postA,
          contactEmail: isParticipantA ? "" : emailA,
        },
        postB: {
          ...postB,
          contactEmail: isParticipantB ? "" : emailB,
        },
      });
    }

    console.log(
      `getMatchesForUser: userId=${userIdStr} visibleMatches=${result.length}`,
    );

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
      const existing = existingA.find((m) => m.postB === postBId)!;
      console.log(
        `createMatch: already_exists matchId=${existing._id} postA=${postAId} postB=${postBId}`,
      );
      return existing._id;
    }

    const postA = await ctx.db.get(postAId);
    const postB = await ctx.db.get(postBId);
    if (!postA || !postB) return null;

    if (postA.type === postB.type) {
      console.log(
        `createMatch: skip same_type type=${postA.type} postA=${postAId} postB=${postBId}`,
      );
      return null;
    }

    const participantA = normalizeUserId(postA.userId);
    const participantB = normalizeUserId(postB.userId);

    console.log(
      `createMatch: postA=${postAId} type=${postA.type} userId=${participantA} postB=${postBId} type=${postB.type} userId=${participantB} score=${args.score.toFixed(3)}`,
    );

    const matchId = await ctx.db.insert("matches", {
      postA: postAId,
      postB: postBId,
      participantA,
      participantB,
      score: args.score,
      seenByA: false,
      seenByB: false,
      createdAt: Date.now(),
    });

    const now = Date.now();
    await ctx.db.insert("notifications", {
      userId: participantA,
      matchId,
      postId: postAId,
      seen: false,
      createdAt: now,
    });
    await ctx.db.insert("notifications", {
      userId: participantB,
      matchId,
      postId: postBId,
      seen: false,
      createdAt: now,
    });

    await ctx.db.patch(postAId, { matched: true });
    await ctx.db.patch(postBId, { matched: true });

    await ctx.scheduler.runAfter(0, internal.actions.sendMatchEmail, {
      postAId,
      postBId,
      score: args.score,
    });

    return matchId;
  },
});

export const getMatchForPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const userIdStr = normalizeUserId(userId as string);
    const post = await ctx.db.get(postId);
    if (!post) return null;

    const fromA = await ctx.db
      .query("matches")
      .withIndex("by_postA", (q) => q.eq("postA", postId))
      .collect();
    const fromB = await ctx.db
      .query("matches")
      .withIndex("by_postB", (q) => q.eq("postB", postId))
      .collect();

    for (const match of [...fromA, ...fromB]) {
      const postA = await ctx.db.get(match.postA);
      const postB = await ctx.db.get(match.postB);
      if (!postA || !postB) continue;

      const { participantA, participantB } = resolveParticipants(
        match,
        postA,
        postB,
      );
      const participates =
        participantA === userIdStr || participantB === userIdStr;
      if (!participates) continue;

      return {
        matchId: match._id,
        isOwner: normalizeUserId(post.userId) === userIdStr,
      };
    }
    return null;
  },
});

export const markMatchSeen = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const userIdStr = normalizeUserId(userId as string);
    const match = await ctx.db.get(matchId);
    if (!match) return;

    const postA = await ctx.db.get(match.postA);
    const postB = await ctx.db.get(match.postB);
    if (!postA || !postB) return;

    const { participantA, participantB } = resolveParticipants(
      match,
      postA,
      postB,
    );

    if (participantA === userIdStr) {
      await ctx.db.patch(matchId, { seenByA: true });
    }
    if (participantB === userIdStr) {
      await ctx.db.patch(matchId, { seenByB: true });
    }
  },
});
