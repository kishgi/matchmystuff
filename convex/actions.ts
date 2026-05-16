"use node";

import OpenAI from "openai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import {
  calculateLocationScore,
  cosineSimilarity,
} from "./lib/similarity";

const VISION_PROMPT =
  "Describe this item for a lost and found system. Include object type, color, brand if visible, material, condition, and unique features. Max 80 words.";

const MATCH_THRESHOLD = 0.82;
const TOP_N = 5;

export const processPost = internalAction({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.runQuery(internal.posts.getPostInternal, {
      postId,
    });
    if (!post || post.embedding.length > 0) {
      return;
    }

    let aiDescription = post.aiDescription ?? "";

    if (!aiDescription && post.imageUrl) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: VISION_PROMPT },
                {
                  type: "image_url",
                  image_url: { url: post.imageUrl },
                },
              ],
            },
          ],
          max_tokens: 200,
        });
        aiDescription = response.choices[0]?.message?.content?.trim() ?? "";
        if (!aiDescription) return;
      } catch (error) {
        console.error("OpenAI Vision error:", error);
        return;
      }
    }

    if (!aiDescription) return;

    const combinedText = [
      post.title,
      post.description,
      aiDescription,
      post.location,
    ]
      .filter(Boolean)
      .join(" ");

    let embedding: number[];
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const result = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: combinedText,
      });
      embedding = result.data[0].embedding;
    } catch (error) {
      console.error("OpenAI Embeddings error:", error);
      return;
    }

    await ctx.runMutation(internal.posts.updateEmbedding, {
      id: postId,
      embedding,
      aiDescription,
    });

    await ctx.runAction(internal.actions.findMatches, { postId });
  },
});

export const findMatches = internalAction({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.runQuery(internal.posts.getPostInternal, {
      postId,
    });
    if (!post || post.embedding.length === 0) {
      return;
    }

    const oppositeType = post.type === "lost" ? "found" : "lost";
    const vectorResults = await ctx.vectorSearch("posts", "by_embedding", {
      vector: post.embedding,
      limit: 20,
      filter: (q) => q.eq("type", oppositeType),
    });

    const scored = [];
    for (const result of vectorResults) {
      if (result._id === postId) continue;
      const candidate = await ctx.runQuery(internal.posts.getPostInternal, {
        postId: result._id,
      });
      if (!candidate || candidate.embedding.length === 0) continue;

      const similarity = cosineSimilarity(post.embedding, candidate.embedding);
      const locationScore = calculateLocationScore(
        post.location,
        candidate.location,
      );
      const finalScore = similarity * 0.9 + locationScore * 0.1;
      scored.push({ candidate, score: finalScore });
    }

    scored.sort((a, b) => b.score - a.score);
    const topMatches = scored.slice(0, TOP_N);

    for (const { candidate, score } of topMatches) {
      if (score < MATCH_THRESHOLD) continue;
      await ctx.runMutation(internal.matches.createMatch, {
        postA: postId,
        postB: candidate._id,
        score,
      });
    }
  },
});
