import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function isParticipant(
  conversation: { participantA: string; participantB: string },
  userId: string,
) {
  return (
    conversation.participantA === userId ||
    conversation.participantB === userId
  );
}

async function userDisplayName(
  ctx: {
    db: {
      get: (id: Id<"users">) => Promise<{ name?: string; email?: string } | null>;
    };
  },
  userId: string,
) {
  const user = await ctx.db.get(userId as Id<"users">);
  return user?.name ?? user?.email ?? "User";
}

export const getOrCreateConversation = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const userIdStr = userId as string;
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_match", (q) => q.eq("matchId", matchId))
      .unique();
    if (existing) {
      if (!isParticipant(existing, userIdStr)) throw new Error("Forbidden");
      return existing._id;
    }

    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");

    const postA = await ctx.db.get(match.postA);
    const postB = await ctx.db.get(match.postB);
    if (!postA || !postB) throw new Error("Posts not found");

    const ownsA = postA.userId === userIdStr;
    const ownsB = postB.userId === userIdStr;
    if (!ownsA && !ownsB) throw new Error("Forbidden");

    const now = Date.now();
    return await ctx.db.insert("conversations", {
      matchId,
      postA: match.postA,
      postB: match.postB,
      participantA: postA.userId,
      participantB: postB.userId,
      createdAt: now,
      lastMessageAt: now,
    });
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || !isParticipant(conversation, userId as string)) {
      return null;
    }

    const postA = await ctx.db.get(conversation.postA);
    const postB = await ctx.db.get(conversation.postB);
    const otherUserId =
      conversation.participantA === (userId as string)
        ? conversation.participantB
        : conversation.participantA;
    const otherUserName = await userDisplayName(ctx, otherUserId);
    const myPost =
      postA?.userId === (userId as string) ? postA : postB;

    return {
      ...conversation,
      postA,
      postB,
      otherUserId,
      otherUserName,
      matchedItemTitle: myPost?.title ?? postA?.title ?? "Item",
    };
  },
});

export const getMyConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const userIdStr = userId as string;
    const asA = await ctx.db
      .query("conversations")
      .withIndex("by_participant", (q) => q.eq("participantA", userIdStr))
      .collect();
    const asB = await ctx.db
      .query("conversations")
      .withIndex("by_participantB", (q) => q.eq("participantB", userIdStr))
      .collect();

    const seen = new Set<string>();
    const conversations = [...asA, ...asB].filter((c) => {
      if (seen.has(c._id)) return false;
      seen.add(c._id);
      return true;
    });

    const result = [];
    for (const conversation of conversations) {
      const otherUserId =
        conversation.participantA === userIdStr
          ? conversation.participantB
          : conversation.participantA;
      const otherUserName = await userDisplayName(ctx, otherUserId);

      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversation._id),
        )
        .order("desc")
        .take(1);
      const lastMessage = messages[0] ?? null;

      const allMessages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversation._id),
        )
        .collect();
      const hasUnread = allMessages.some(
        (m) => !m.seen && m.senderId !== userIdStr,
      );

      const postA = await ctx.db.get(conversation.postA);
      const postB = await ctx.db.get(conversation.postB);
      const myPost =
        postA?.userId === userIdStr ? postA : postB;

      result.push({
        ...conversation,
        otherUserId,
        otherUserName,
        lastMessage,
        hasUnread,
        matchedItemTitle: myPost?.title ?? postA?.title ?? "Item",
      });
    }

    return result.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});

export const getUnreadMessageCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const userIdStr = userId as string;
    const asA = await ctx.db
      .query("conversations")
      .withIndex("by_participant", (q) => q.eq("participantA", userIdStr))
      .collect();
    const asB = await ctx.db
      .query("conversations")
      .withIndex("by_participantB", (q) => q.eq("participantB", userIdStr))
      .collect();

    const seen = new Set<string>();
    const conversations = [...asA, ...asB].filter((c) => {
      if (seen.has(c._id)) return false;
      seen.add(c._id);
      return true;
    });

    let count = 0;
    for (const conversation of conversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversation._id),
        )
        .collect();
      count += messages.filter(
        (m) => !m.seen && m.senderId !== userIdStr,
      ).length;
    }
    return count;
  },
});
