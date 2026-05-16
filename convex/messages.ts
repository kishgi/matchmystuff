import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const locationValidator = v.object({
  lat: v.number(),
  lng: v.number(),
  label: v.string(),
});

function isParticipant(
  conversation: { participantA: string; participantB: string },
  userId: string,
) {
  return (
    conversation.participantA === userId ||
    conversation.participantB === userId
  );
}

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("location")),
    content: v.string(),
    imageStorageId: v.optional(v.string()),
    location: v.optional(locationValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const userIdStr = userId as string;
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !isParticipant(conversation, userIdStr)) {
      throw new Error("Forbidden");
    }

    const user = await ctx.db.get(userId);
    const senderName = user?.name ?? user?.email ?? "User";

    let imageUrl: string | undefined;
    if (args.type === "image" && args.imageStorageId) {
      imageUrl =
        (await ctx.storage.getUrl(
          args.imageStorageId as Parameters<typeof ctx.storage.getUrl>[0],
        )) ?? undefined;
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userIdStr,
      senderName,
      type: args.type,
      content: args.content,
      imageStorageId: args.imageStorageId,
      imageUrl,
      location: args.location,
      createdAt: now,
      seen: false,
    });

    await ctx.db.patch(args.conversationId, { lastMessageAt: now });
    return messageId;
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, { conversationId, cursor }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { messages: [], nextCursor: null };

    const userIdStr = userId as string;
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || !isParticipant(conversation, userIdStr)) {
      return { messages: [], nextCursor: null };
    }

    let batch = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId),
      )
      .order("desc")
      .take(50);

    if (cursor !== undefined) {
      batch = batch.filter((m) => m.createdAt < cursor);
    }

    const nextCursor =
      batch.length === 50 ? batch[batch.length - 1].createdAt : null;

    return {
      messages: [...batch].reverse(),
      nextCursor,
    };
  },
});

export const markMessagesRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const userIdStr = userId as string;
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || !isParticipant(conversation, userIdStr)) return;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId),
      )
      .collect();

    await Promise.all(
      messages
        .filter((m) => !m.seen && m.senderId !== userIdStr)
        .map((m) => ctx.db.patch(m._id, { seen: true })),
    );
  },
});

export const generateImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    return await ctx.storage.generateUploadUrl();
  },
});
