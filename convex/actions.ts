"use node";

// Convex env: OPENAI_API_KEY, EMAIL_SENDER, EMAIL_PASS, APP_BASE_URL

import OpenAI from "openai";
import nodemailer from "nodemailer";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import { buildDescribeUserMessage } from "./lib/imageDescribe";
import {
  IMAGE_VALIDATION_ERROR,
  IMAGE_VALIDATION_PROMPT,
  parseValidationResponse,
  type ImageValidationResult,
} from "./lib/imageValidation";
import { computeMatchScore } from "./lib/similarity";
import { normalizeUserId } from "./lib/userIds";

const TEXT_SUMMARY_PROMPT =
  "Summarize this lost/found item in 2-3 sentences for matching. Focus on physical attributes, brand, color, and distinguishing features. Max 80 words.";

/** Minimum blended match score (0–1) to create a match */
const MATCH_THRESHOLD = 0.65;
/** Re-run matching on recent opposite-type posts when a new post becomes ready */
const OPPOSITE_REMATCH_LIMIT = 20;
const TOP_N = 8;
const VECTOR_SEARCH_LIMIT = 40;
const REMATCH_DELAY_MS = 2500;

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/** Item-focused text for embeddings — do NOT include lost/found (opposite types must align). */
function buildEmbeddingInput(post: {
  title: string;
  description: string;
  aiDescription: string;
  location: string;
}): string {
  return [
    `Title: ${post.title}`,
    `User description: ${post.description}`,
    `Visual analysis: ${post.aiDescription}`,
    `Location: ${post.location}`,
  ].join("\n");
}

async function runImageValidation(
  imageUrl: string,
): Promise<ImageValidationResult> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: IMAGE_VALIDATION_PROMPT },
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "high" },
          },
        ],
      },
    ],
    max_tokens: 220,
  });
  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  return parseValidationResponse(raw);
}

async function describeImage(
  imageUrl: string,
  context?: { title: string; description: string },
): Promise<string> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    messages: [buildDescribeUserMessage(imageUrl, context)],
    max_tokens: 320,
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
    temperature: 0.2,
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
      return {
        valid: result.valid,
        reason: result.valid
          ? undefined
          : (result.reason ?? IMAGE_VALIDATION_ERROR),
        itemType: result.itemType,
        category: result.category,
        color: result.color,
        description: result.description,
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
    let aiDescription = "";

    if (hasImage) {
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
      } catch (error) {
        console.error("Image validation error:", error);
        await ctx.runMutation(internal.posts.markRejected, {
          id: postId,
          reason: "We could not validate your image. Please try uploading again.",
        });
        return;
      }

      try {
        aiDescription = await describeImage(post.imageUrl, {
          title: post.title,
          description: post.description,
        });
      } catch (error) {
        console.error("OpenAI image description error:", error);
        await ctx.runMutation(internal.posts.markRejected, {
          id: postId,
          reason: "We could not analyze your image. Please try another photo.",
        });
        return;
      }
    } else {
      try {
        aiDescription = await summarizeText(
          post.title,
          post.description,
          post.location,
        );
      } catch (error) {
        console.error("OpenAI text description error:", error);
        aiDescription = [post.title, post.description, post.location]
          .filter(Boolean)
          .join(". ");
      }
    }

    if (!aiDescription.trim()) {
      if (hasImage) {
        await ctx.runMutation(internal.posts.markRejected, {
          id: postId,
          reason: "We could not identify an item in this image.",
        });
      } else {
        await ctx.runMutation(internal.posts.markRejected, {
          id: postId,
          reason: "Please add more detail in the title and description.",
        });
      }
      return;
    }

    const combinedText = buildEmbeddingInput({
      title: post.title,
      description: post.description,
      aiDescription,
      location: post.location,
    });

    console.log(
      `processPost: postId=${postId} type=${post.type} embeddingInputLen=${combinedText.length}`,
    );

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
      await ctx.runMutation(internal.posts.markRejected, {
        id: postId,
        reason: "Matching setup failed. Please try submitting again.",
      });
      return;
    }

    await ctx.runMutation(internal.posts.updateEmbedding, {
      id: postId,
      embedding,
      aiDescription,
    });

    console.log(
      `processPost: postId=${postId} type=${post.type} userId=${normalizeUserId(post.userId)} embeddingDims=${embedding.length} ready`,
    );

    const oppositeType = post.type === "lost" ? "found" : "lost";
    const recentOpposite = await ctx.runQuery(
      internal.posts.listReadyPostsByType,
      { type: oppositeType, limit: OPPOSITE_REMATCH_LIMIT },
    );

    await ctx.scheduler.runAfter(0, internal.actions.findMatches, { postId });
    await ctx.scheduler.runAfter(
      REMATCH_DELAY_MS,
      internal.actions.findMatches,
      { postId },
    );
    for (let i = 0; i < recentOpposite.length; i++) {
      const otherId = recentOpposite[i]._id;
      if (otherId === postId) continue;
      await ctx.scheduler.runAfter(
        REMATCH_DELAY_MS + 500 + i * 200,
        internal.actions.findMatches,
        { postId: otherId },
      );
    }
  },
});

/** Re-embed ready posts (fixes legacy embeddings that included lost/found) then rematch. */
export const backfillMatches = internalAction({
  args: {},
  handler: async (ctx) => {
    const lost = await ctx.runQuery(internal.posts.listReadyPostsByType, {
      type: "lost",
      limit: 200,
    });
    const found = await ctx.runQuery(internal.posts.listReadyPostsByType, {
      type: "found",
      limit: 200,
    });
    const openai = getOpenAI();
    let delay = 0;

    for (const p of [...lost, ...found]) {
      const aiDescription =
        p.aiDescription?.trim() ||
        [p.title, p.description, p.location].filter(Boolean).join(". ");
      if (!aiDescription) continue;

      try {
        const combinedText = buildEmbeddingInput({
          title: p.title,
          description: p.description,
          aiDescription,
          location: p.location,
        });
        const result = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: combinedText,
        });
        await ctx.runMutation(internal.posts.updateEmbedding, {
          id: p._id,
          embedding: result.data[0].embedding,
          aiDescription,
        });
        console.log(`backfillMatches: re-embedded postId=${p._id} type=${p.type}`);
      } catch (error) {
        console.error(`backfillMatches: embed failed postId=${p._id}`, error);
        continue;
      }

      await ctx.scheduler.runAfter(delay, internal.actions.findMatches, {
        postId: p._id,
      });
      delay += 500;
    }
  },
});

export const findMatches = internalAction({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.runQuery(internal.posts.getPostInternal, {
      postId,
    });
    if (!post) {
      console.log(`findMatches: skip postId=${postId} reason=not_found`);
      return;
    }
    if (post.embedding.length === 0) {
      console.log(
        `findMatches: skip postId=${postId} type=${post.type} reason=no_embedding`,
      );
      return;
    }
    if ((post.processingStatus ?? "ready") !== "ready") {
      console.log(
        `findMatches: skip postId=${postId} type=${post.type} reason=status_${post.processingStatus ?? "unknown"}`,
      );
      return;
    }

    const oppositeType = post.type === "lost" ? "found" : "lost";

    const candidateIds = new Set<string>();
    let vectorHitCount = 0;

    try {
      const vectorResults = await ctx.vectorSearch("posts", "by_embedding", {
        vector: post.embedding,
        limit: VECTOR_SEARCH_LIMIT,
        filter: (q) => q.eq("type", oppositeType),
      });
      vectorHitCount = vectorResults.length;
      for (const hit of vectorResults) {
        if (hit._id !== postId) candidateIds.add(hit._id);
      }
    } catch (error) {
      console.error("vectorSearch error:", error);
    }

    const oppositePosts = await ctx.runQuery(internal.posts.listReadyPostsByType, {
      type: oppositeType,
      limit: 120,
    });
    for (const p of oppositePosts) {
      if (p._id !== postId) candidateIds.add(p._id);
    }

    const postUserId = normalizeUserId(post.userId);
    console.log(
      `findMatches: postId=${postId} type=${post.type} postUserId=${postUserId} opposite=${oppositeType} vectorHits=${vectorHitCount} candidates=${candidateIds.size}`,
    );

    const scored: { candidateId: Id<"posts">; score: number }[] = [];
    let skippedNotReady = 0;
    const candidateUserIds: string[] = [];

    for (const candidateId of candidateIds) {
      const candidate = await ctx.runQuery(internal.posts.getPostInternal, {
        postId: candidateId as Id<"posts">,
      });
      if (!candidate || candidate.embedding.length === 0) {
        skippedNotReady++;
        continue;
      }
      if ((candidate.processingStatus ?? "ready") !== "ready") {
        skippedNotReady++;
        continue;
      }
      if (candidate.type !== oppositeType) continue;

      const candidateUserId = normalizeUserId(candidate.userId);
      candidateUserIds.push(candidateUserId);

      const score = computeMatchScore(post, candidate);
      scored.push({ candidateId: candidate._id, score });
    }

    console.log(
      `findMatches: postId=${postId} scored=${scored.length} candidateUserIds=[${[...new Set(candidateUserIds)].slice(0, 12).join(",")}] postUserId=${postUserId}`,
    );

    scored.sort((a, b) => b.score - a.score);
    const topMatches = scored.slice(0, TOP_N);
    const best = topMatches[0];

    if (best) {
      console.log(
        `findMatches: postId=${postId} bestScore=${best.score.toFixed(3)} bestCandidate=${best.candidateId} threshold=${MATCH_THRESHOLD}`,
      );
      for (const row of topMatches.slice(0, 3)) {
        const cand = await ctx.runQuery(internal.posts.getPostInternal, {
          postId: row.candidateId,
        });
        console.log(
          `findMatches:   candidate=${row.candidateId} userId=${normalizeUserId(cand?.userId)} score=${row.score.toFixed(3)}`,
        );
      }
    } else {
      console.log(
        `findMatches: postId=${postId} no_scored_candidates notReady=${skippedNotReady}`,
      );
    }

    let created = 0;
    let belowThreshold = 0;
    for (const { candidateId, score } of topMatches) {
      if (score < MATCH_THRESHOLD) {
        belowThreshold++;
        continue;
      }
      await ctx.runMutation(internal.matches.createMatch, {
        postA: postId,
        postB: candidateId,
        score,
      });
      created++;
      console.log(
        `findMatches: created match postId=${postId} candidate=${candidateId} score=${score.toFixed(3)}`,
      );
    }

    if (created === 0 && best && best.score >= MATCH_THRESHOLD - 0.05) {
      console.log(
        `findMatches: near_miss postId=${postId} best=${best.score.toFixed(3)} threshold=${MATCH_THRESHOLD}`,
      );
    } else if (created === 0 && best) {
      console.log(
        `findMatches: below_threshold postId=${postId} best=${best.score.toFixed(3)} skipped=${belowThreshold}`,
      );
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
    const gmailUser = process.env.EMAIL_SENDER;
    const gmailPass = process.env.EMAIL_PASS;
    if (!gmailUser || !gmailPass) {
      console.warn("sendMatchEmail: EMAIL_SENDER or EMAIL_PASS not set, skipping");
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
