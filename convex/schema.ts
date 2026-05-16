import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  posts: defineTable({
    type: v.union(v.literal("lost"), v.literal("found")),
    title: v.string(),
    description: v.string(),
    location: v.string(),
    imageUrl: v.string(),
    userId: v.id("users"),
    userName: v.string(),
    aiDescription: v.optional(v.string()),
    matched: v.boolean(),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),
  matches: defineTable({
    userId: v.id("users"),
    postAId: v.id("posts"),
    postBId: v.id("posts"),
    score: v.number(),
    seen: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  notifications: defineTable({
    userId: v.id("users"),
    matchId: v.id("matches"),
    postTitle: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    title: v.string(),
    description: v.string(),
    aiDescription: v.optional(v.string()),
    combinedText: v.optional(v.string()),
    embedding: v.optional(v.array(v.float64())),
    imageUrl: v.string(),
    location: v.string(),
    type: v.union(v.literal("lost"), v.literal("found")),
    embeddingProcessed: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_type", ["type"]),
  matches: defineTable({
    postA: v.id("posts"),
    postB: v.id("posts"),
    similarity: v.number(),
    createdAt: v.number(),
  }).index("by_posts", ["postA", "postB"]),
});
