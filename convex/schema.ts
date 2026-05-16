import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

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
});
