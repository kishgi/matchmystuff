import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { requireAdminSession } from "./lib/adminGuard";

const adminTokenArg = { adminToken: v.string() };

async function postHasMatches(ctx: MutationCtx, postId: Id<"posts">) {
  const asA = await ctx.db
    .query("matches")
    .withIndex("by_postA", (q) => q.eq("postA", postId))
    .first();
  if (asA) return true;
  const asB = await ctx.db
    .query("matches")
    .withIndex("by_postB", (q) => q.eq("postB", postId))
    .first();
  return !!asB;
}

async function deleteMatchCascade(
  ctx: MutationCtx,
  matchId: Id<"matches">,
) {
  const match = await ctx.db.get(matchId);
  if (!match) return;

  const postAId = match.postA;
  const postBId = match.postB;

  const notifications = await ctx.db.query("notifications").collect();
  for (const n of notifications) {
    if (n.matchId === matchId) {
      await ctx.db.delete(n._id);
    }
  }

  const conversation = await ctx.db
    .query("conversations")
    .withIndex("by_match", (q) => q.eq("matchId", matchId))
    .unique();
  if (conversation) {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversation._id),
      )
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    await ctx.db.delete(conversation._id);
  }

  await ctx.db.delete(matchId);

  if (await ctx.db.get(postAId)) {
    const stillMatched = await postHasMatches(ctx, postAId);
    if (!stillMatched) {
      await ctx.db.patch(postAId, { matched: false });
    }
  }
  if (await ctx.db.get(postBId)) {
    const stillMatched = await postHasMatches(ctx, postBId);
    if (!stillMatched) {
      await ctx.db.patch(postBId, { matched: false });
    }
  }
}

async function deletePostCascade(ctx: MutationCtx, postId: Id<"posts">) {
  const matchesA = await ctx.db
    .query("matches")
    .withIndex("by_postA", (q) => q.eq("postA", postId))
    .collect();
  const matchesB = await ctx.db
    .query("matches")
    .withIndex("by_postB", (q) => q.eq("postB", postId))
    .collect();
  const matchIds = new Set([
    ...matchesA.map((m) => m._id),
    ...matchesB.map((m) => m._id),
  ]);
  for (const matchId of matchIds) {
    await deleteMatchCascade(ctx, matchId);
  }

  const notifications = await ctx.db.query("notifications").collect();
  for (const n of notifications) {
    if (n.postId === postId) {
      await ctx.db.delete(n._id);
    }
  }

  const conversationsA = await ctx.db
    .query("conversations")
    .filter((q) => q.eq(q.field("postA"), postId))
    .collect();
  const conversationsB = await ctx.db
    .query("conversations")
    .filter((q) => q.eq(q.field("postB"), postId))
    .collect();
  const conversationIds = new Set([
    ...conversationsA.map((c) => c._id),
    ...conversationsB.map((c) => c._id),
  ]);
  for (const conversationId of conversationIds) {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId),
      )
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    await ctx.db.delete(conversationId);
  }

  await ctx.db.delete(postId);
}

async function deleteAuthRecordsForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
) {
  const accounts = await ctx.db
    .query("authAccounts")
    .filter((q) => q.eq(q.field("userId"), userId))
    .collect();
  for (const account of accounts) {
    await ctx.db.delete(account._id);
  }

  const sessions = await ctx.db
    .query("authSessions")
    .filter((q) => q.eq(q.field("userId"), userId))
    .collect();
  for (const session of sessions) {
    const tokens = await ctx.db
      .query("authRefreshTokens")
      .filter((q) => q.eq(q.field("sessionId"), session._id))
      .collect();
    for (const token of tokens) {
      await ctx.db.delete(token._id);
    }
    await ctx.db.delete(session._id);
  }
}

export const getStats = query({
  args: adminTokenArg,
  handler: async (ctx, { adminToken }) => {
    await requireAdminSession(ctx, adminToken);
    const users = await ctx.db.query("users").collect();
    const posts = await ctx.db.query("posts").collect();
    const matches = await ctx.db.query("matches").collect();
    return {
      totalUsers: users.length,
      totalPosts: posts.length,
      totalMatches: matches.length,
    };
  },
});

export const getAllPosts = query({
  args: {
    ...adminTokenArg,
    type: v.optional(v.union(v.literal("lost"), v.literal("found"))),
  },
  handler: async (ctx, { adminToken, type }) => {
    await requireAdminSession(ctx, adminToken);
    if (type) {
      return await ctx.db
        .query("posts")
        .withIndex("by_type_created", (q) => q.eq("type", type))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("posts").order("desc").collect();
  },
});

export const getAllUsers = query({
  args: adminTokenArg,
  handler: async (ctx, { adminToken }) => {
    await requireAdminSession(ctx, adminToken);
    const users = await ctx.db.query("users").collect();
    return users
      .map((user) => ({
        _id: user._id,
        email: user.email ?? "",
        name: user.name ?? "",
        createdAt: user._creationTime,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getAllMatches = query({
  args: adminTokenArg,
  handler: async (ctx, { adminToken }) => {
    await requireAdminSession(ctx, adminToken);
    const matches = await ctx.db.query("matches").order("desc").collect();
    const result = [];
    for (const match of matches) {
      const postA = await ctx.db.get(match.postA);
      const postB = await ctx.db.get(match.postB);
      result.push({
        ...match,
        postATitle: postA?.title ?? "—",
        postBTitle: postB?.title ?? "—",
        postAType: postA?.type,
        postBType: postB?.type,
      });
    }
    return result;
  },
});

export const deletePost = mutation({
  args: { ...adminTokenArg, postId: v.id("posts") },
  handler: async (ctx, { adminToken, postId }) => {
    await requireAdminSession(ctx, adminToken);
    await deletePostCascade(ctx, postId);
  },
});

export const deleteUser = mutation({
  args: {
    ...adminTokenArg,
    userId: v.id("users"),
    cascadePosts: v.optional(v.boolean()),
  },
  handler: async (ctx, { adminToken, userId, cascadePosts = true }) => {
    await requireAdminSession(ctx, adminToken);

    if (cascadePosts) {
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_user", (q) => q.eq("userId", userId as string))
        .collect();
      for (const post of posts) {
        await deletePostCascade(ctx, post._id);
      }
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId as string))
      .collect();
    for (const n of notifications) {
      await ctx.db.delete(n._id);
    }

    const asA = await ctx.db
      .query("conversations")
      .withIndex("by_participant", (q) =>
        q.eq("participantA", userId as string),
      )
      .collect();
    const asB = await ctx.db
      .query("conversations")
      .withIndex("by_participantB", (q) =>
        q.eq("participantB", userId as string),
      )
      .collect();
    const conversationIds = new Set([
      ...asA.map((c) => c._id),
      ...asB.map((c) => c._id),
    ]);
    for (const conversationId of conversationIds) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversationId),
        )
        .collect();
      for (const message of messages) {
        await ctx.db.delete(message._id);
      }
      await ctx.db.delete(conversationId);
    }

    await deleteAuthRecordsForUser(ctx, userId);
    await ctx.db.delete(userId);
  },
});

export const deleteMatch = mutation({
  args: { ...adminTokenArg, matchId: v.id("matches") },
  handler: async (ctx, { adminToken, matchId }) => {
    await requireAdminSession(ctx, adminToken);
    await deleteMatchCascade(ctx, matchId);
  },
});
