"use node";

// Convex env: OPENAI_API_KEY, GMAIL_USER (sender Gmail), GMAIL_PASS (Gmail App Password),
// APP_BASE_URL (e.g. http://localhost:3000 — used for /matches links in emails)

import OpenAI from "openai";
import nodemailer from "nodemailer";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import {
  buildAiDescriptionFromValidation,
  IMAGE_VALIDATION_ERROR,
  IMAGE_VALIDATION_PROMPT,
  parseValidationResponse,
  type ImageValidationResult,
} from "./lib/imageValidation";
import {
  calculateLocationScore,
  cosineSimilarity,
} from "./lib/similarity";

const VISION_DESCRIBE_PROMPT = `
You are describing items for a LOST & FOUND AI system.

Write ONE clean paragraph (60–80 words).

Rules:
- Do NOT output single words or fragments (no "shoe. pink. footwear")
- Do NOT use bullet points
- Do NOT guess ownership or story
- Only describe visible physical attributes
- Be precise and structured in sentence form

Include:
object type, category, color, brand (if visible), material, condition, and distinguishing features.

Style:
Natural English sentence, optimized for semantic search embedding.
`;

const TEXT_SUMMARY_PROMPT =
  "Summarize this lost/found item in 2-3 sentences for matching. Focus on physical attributes, brand, color, and distinguishing features. Max 80 words.";

const MATCH_THRESHOLD = 0.82;
const TOP_N = 5;

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function runImageValidation(
  imageUrl: string,
): Promise<ImageValidationResult> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: IMAGE_VALIDATION_PROMPT },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    max_tokens: 180,
  });
  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  return parseValidationResponse(raw);
}

async function describeImage(imageUrl: string): Promise<string> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: VISION_DESCRIBE_PROMPT },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    max_tokens: 200,
  });
  return response.choices[0]?.message?.content?.trim() ?? "";
}

async function summarizeText(
  title: string,
  description: string,
  location: string,
): Promise<string> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: `${TEXT_SUMMARY_PROMPT}\n\nTitle: ${title}\nDescription: ${description}\nLocation: ${location}`,
      },
    ],
    max_tokens: 200,
  });
  return response.choices[0]?.message?.content?.trim() ?? "";
}

export const validateImage = action({
  args: { imageUrl: v.string() },
  handler: async (_ctx, { imageUrl }) => {
    try {
      const result = await runImageValidation(imageUrl);
      const aiDescription = buildAiDescriptionFromValidation(result);
      return {
        valid: result.valid,
        reason: result.valid
          ? undefined
          : (result.reason ?? IMAGE_VALIDATION_ERROR),
        itemType: result.itemType,
        category: result.category,
        color: result.color,
        description: result.description,
        aiDescription: aiDescription || undefined,
      };
    } catch (error) {
      console.error("validateImage error:", error);
      return {
        valid: false,
        reason: IMAGE_VALIDATION_ERROR,
      };
    }
  },
});

type SearchPostResult = {
  _id: Id<"posts">;
  type: "lost" | "found";
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  userName: string;
  matched: boolean;
  createdAt: number;
  score: number;
};

export const semanticSearchPosts = action({
  args: {
    query: v.string(),
    type: v.optional(v.union(v.literal("lost"), v.literal("found"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, type, limit = 24 }): Promise<SearchPostResult[]> => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      const openai = getOpenAI();
      const emb = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: trimmed,
      });
      const vector = emb.data[0].embedding;

      const searchOpts = {
        vector,
        limit: Math.min(limit, 50),
      };
      const vectorResults = type
        ? await ctx.vectorSearch("posts", "by_embedding", {
            ...searchOpts,
            filter: (q) => q.eq("type", type),
          })
        : await ctx.vectorSearch("posts", "by_embedding", searchOpts);

      const results: SearchPostResult[] = [];
      for (const hit of vectorResults) {
        const post = await ctx.runQuery(internal.posts.getPostInternal, {
          postId: hit._id,
        });
        if (!post) continue;
        const status = post.processingStatus ?? "ready";
        if (status !== "ready" || post.embedding.length === 0) continue;
        results.push({
          _id: post._id,
          type: post.type,
          title: post.title,
          description: post.description,
          location: post.location,
          imageUrl: post.imageUrl,
          userName: post.userName,
          matched: post.matched,
          createdAt: post.createdAt,
          score: hit._score,
        });
      }
      return results;
    } catch (error) {
      console.error("semanticSearchPosts error:", error);
      return [];
    }
  },
});

export const processPost = internalAction({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.runQuery(internal.posts.getPostInternal, {
      postId,
    });
    if (!post || post.embedding.length > 0) {
      return;
    }
    if (post.processingStatus === "rejected") {
      return;
    }

    await ctx.runMutation(internal.posts.setProcessingStatus, {
      id: postId,
      status: "processing",
    });

    const hasImage = Boolean(post.imageUrl?.trim());
    let aiDescription = post.aiDescription?.trim() ?? "";

    if (hasImage && !aiDescription) {
      try {
        const validation = await runImageValidation(post.imageUrl);
        if (!validation.valid) {
          await ctx.runMutation(internal.posts.markRejected, {
            id: postId,
            reason:
              validation.reason ??
              "This image cannot be used for a lost and found listing.",
          });
          return;
        }
        aiDescription = buildAiDescriptionFromValidation(validation);
      } catch (error) {
        console.error("Image validation error:", error);
        await ctx.runMutation(internal.posts.markRejected, {
          id: postId,
          reason: "We could not validate your image. Please try uploading again.",
        });
        return;
      }
    }

    if (!aiDescription) {
      try {
        if (hasImage) {
          aiDescription = await describeImage(post.imageUrl);
        } else {
          aiDescription = await summarizeText(
            post.title,
            post.description,
            post.location,
          );
        }
      } catch (error) {
        console.error("OpenAI description error:", error);
        if (!hasImage) {
          aiDescription = [post.title, post.description, post.location]
            .filter(Boolean)
            .join(". ");
        } else {
          await ctx.runMutation(internal.posts.markRejected, {
            id: postId,
            reason: "We could not analyze your image. Please try another photo.",
          });
          return;
        }
      }
    }

    if (!aiDescription.trim()) {
      if (hasImage) {
        await ctx.runMutation(internal.posts.markRejected, {
          id: postId,
          reason: "We could not identify an item in this image.",
        });
      }
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
      const openai = getOpenAI();
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

export const sendMatchEmail = internalAction({
  args: {
    postAId: v.id("posts"),
    postBId: v.id("posts"),
    score: v.number(),
  },
  handler: async (ctx, { postAId, postBId, score }) => {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;
    if (!gmailUser || !gmailPass) {
      console.warn("sendMatchEmail: GMAIL_USER or GMAIL_PASS not set, skipping");
      return;
    }

    const postA = await ctx.runQuery(internal.posts.getPostInternal, {
      postId: postAId,
    });
    const postB = await ctx.runQuery(internal.posts.getPostInternal, {
      postId: postBId,
    });
    if (!postA || !postB) return;

    const emailA = await ctx.runQuery(internal.users.getUserEmailInternal, {
      userId: postA.userId,
    });
    const emailB = await ctx.runQuery(internal.users.getUserEmailInternal, {
      userId: postB.userId,
    });

    const baseUrl = (process.env.APP_BASE_URL ?? "").replace(/\/$/, "");
    const matchesUrl = baseUrl ? `${baseUrl}/matches` : "/matches";
    const pct = Math.round(score * 100);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    const sendOne = async (to: string, ownPost: typeof postA) => {
      if (!to) return;
      const subject = "🎉 MatchMyStuff — We found a match for your item!";
      const text = [
        `Good news! We found a ${pct}% match for your ${ownPost.type} item: "${ownPost.title}".`,
        "",
        `View your matches: ${matchesUrl}`,
        "",
        "Powered by AI. Driven by kindness.",
      ].join("\n");
      const html = `
        <p>Good news! We found a <strong>${pct}% match</strong> for your ${ownPost.type} item:</p>
        <p><strong>${ownPost.title}</strong></p>
        <p><a href="${matchesUrl}">View your matches</a></p>
        <p style="color:#666;font-size:12px;">Powered by AI. Driven by kindness.</p>
      `;
      try {
        await transporter.sendMail({
          from: gmailUser,
          to,
          subject,
          text,
          html,
        });
      } catch (err) {
        console.error("sendMatchEmail failed for", to, err);
      }
    };

    try {
      await Promise.all([
        sendOne(emailA ?? "", postA),
        sendOne(emailB ?? "", postB),
      ]);
    } catch (err) {
      console.error("sendMatchEmail error:", err);
    }
  },
});
