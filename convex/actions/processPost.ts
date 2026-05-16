"use node";

import OpenAI from "openai";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

const VISION_PROMPT =
  "Describe this item for a lost and found system. Include object type, color, brand if visible, material, condition, and unique features. Max 80 words.";

export const processPost = internalAction({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.runQuery(internal.posts.getPostInternal, {
      postId,
    });
    if (!post) {
      return;
    }
    if (post.embedding && post.embedding.length > 0) {
      return;
    }
    if (post.embeddingProcessed) {
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
        if (!aiDescription) {
          return;
        }
        await ctx.runMutation(internal.posts.saveAiDescription, {
          postId,
          aiDescription,
        });
      } catch (error) {
        console.error("OpenAI Vision error:", error);
        return;
      }
    }

    if (!aiDescription) {
      return;
    }

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
      postId,
      aiDescription,
      combinedText,
      embedding,
      embeddingProcessed: true,
    });

    await ctx.runAction(internal.actions.findMatches.findMatches, {
      postId,
    });
  },
});
