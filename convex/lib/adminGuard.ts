import type { MutationCtx, QueryCtx } from "../_generated/server";

type AdminCtx = QueryCtx | MutationCtx;

export async function requireAdminSession(ctx: AdminCtx, adminToken: string) {
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q) => q.eq("token", adminToken))
    .unique();
  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function hasValidAdminSession(
  ctx: QueryCtx,
  adminToken: string | undefined,
): Promise<boolean> {
  if (!adminToken) return false;
  try {
    await requireAdminSession(ctx, adminToken);
    return true;
  } catch {
    return false;
  }
}

export function createAdminToken() {
  const part = () => Math.random().toString(36).slice(2, 12);
  return `${Date.now()}-${part()}${part()}`;
}
