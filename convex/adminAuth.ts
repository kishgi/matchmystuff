import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  createAdminToken,
  hasValidAdminSession,
  requireAdminSession,
} from "./lib/adminGuard";

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

function verifyCredentials(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("Admin credentials not configured");
  }
  if (
    email.toLowerCase() !== adminEmail.toLowerCase() ||
    password !== adminPassword
  ) {
    throw new Error("Invalid email or password");
  }
}

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    verifyCredentials(email, password);
    const token = createAdminToken();
    const expiresAt = Date.now() + SESSION_MS;
    await ctx.db.insert("adminSessions", { token, expiresAt });
    return { token };
  },
});

export const logout = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, { adminToken }) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", adminToken))
      .unique();
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

export const validateSession = query({
  args: { adminToken: v.optional(v.string()) },
  handler: async (ctx, { adminToken }) => {
    return await hasValidAdminSession(ctx, adminToken);
  },
});
