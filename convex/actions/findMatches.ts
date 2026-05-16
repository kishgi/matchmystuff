import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  calculateLocationScore,
  cosineSimilarity,
} from "../lib/similarity";

const MATCH_THRESHOLD = 0.82;
const TOP_N = 5;

export const findMatches = internalAction({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.runQuery(internal.posts.getPostInternal, {
      postId,
    });
    if (!post?.embedding || post.embedding.length === 0) {
      return;
    }

    const oppositeType = post.type === "lost" ? "found" : "lost";
    const candidates = await ctx.runQuery(
      internal.posts.listOppositePostsWithEmbeddings,
      { type: oppositeType, excludePostId: postId }
    );

    const scored = candidates
      .map((candidate) => {
        const similarity = cosineSimilarity(post.embedding!, candidate.embedding!);
        const locationScore = calculateLocationScore(
          post.location,
          candidate.location
        );
        const finalScore = similarity * 0.9 + locationScore * 0.1;
        return { candidate, similarity: finalScore };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, TOP_N);

    for (const { candidate, similarity } of scored) {
      if (similarity < MATCH_THRESHOLD) {
        continue;
      }
      await ctx.runMutation(internal.matches.createMatch, {
        postA: postId,
        postB: candidate._id,
        similarity,
      });
    }
  },
});
