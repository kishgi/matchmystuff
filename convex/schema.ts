import { defineSchema, defineTable } from "convex/server";
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
