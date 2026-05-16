import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId as string))
      .collect();
    return notifications.filter((n) => !n.seen).length;
  },
});

export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId as string))
      .collect();

    const enriched = [];
    for (const notification of notifications) {
      const match = await ctx.db.get(notification.matchId);
      const post = await ctx.db.get(notification.postId);
      enriched.push({
        ...notification,
        postTitle: post?.title ?? "Item",
        match,
        post,
      });
    }

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId as string))
      .collect();

    await Promise.all(
      notifications
        .filter((n) => !n.seen)
        .map((n) => ctx.db.patch(n._id, { seen: true })),
    );
  },
});
