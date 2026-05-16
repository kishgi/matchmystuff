import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const processingStatus = v.union(
  v.literal("pending"),
  v.literal("processing"),
  v.literal("ready"),
  v.literal("rejected"),
);

export default defineSchema({
  ...authTables,
  posts: defineTable({
    type: v.union(v.literal("lost"), v.literal("found")),
    title: v.string(),
    description: v.string(),
    aiDescription: v.optional(v.string()),
    imageUrl: v.string(),
    location: v.string(),
    userId: v.string(),
    userName: v.string(),
    createdAt: v.number(),
    embedding: v.array(v.float64()),
    matched: v.boolean(),
    processingStatus: v.optional(processingStatus),
    rejectionReason: v.optional(v.string()),
  })
    .index("by_type_created", ["type", "createdAt"])
    .index("by_user", ["userId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["type"],
    }),
  matches: defineTable({
    postA: v.id("posts"),
    postB: v.id("posts"),
    score: v.number(),
    seenByA: v.boolean(),
    seenByB: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_postA", ["postA"])
    .index("by_postB", ["postB"]),
  notifications: defineTable({
    userId: v.string(),
    matchId: v.id("matches"),
    postId: v.id("posts"),
    seen: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  conversations: defineTable({
    matchId: v.id("matches"),
    postA: v.id("posts"),
    postB: v.id("posts"),
    participantA: v.string(),
    participantB: v.string(),
    createdAt: v.number(),
    lastMessageAt: v.number(),
  })
    .index("by_match", ["matchId"])
    .index("by_participant", ["participantA"])
    .index("by_participantB", ["participantB"]),
  adminSessions: defineTable({
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    senderName: v.string(),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("location")),
    content: v.string(),
    imageStorageId: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        label: v.string(),
      }),
    ),
    createdAt: v.number(),
    seen: v.boolean(),
  }).index("by_conversation", ["conversationId", "createdAt"]),
});
