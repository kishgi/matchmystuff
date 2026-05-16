import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalQuery, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserEmailInternal = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId as Id<"users">);
    return user?.email ?? null;
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});
