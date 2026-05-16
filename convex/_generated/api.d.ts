/* eslint-disable */
import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
import type * as auth from "../auth.js";
import type * as matches from "../matches.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as storage from "../storage.js";
import type * as users from "../users.js";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  matches: typeof matches;
  notifications: typeof notifications;
  posts: typeof posts;
  storage: typeof storage;
  users: typeof users;
}>;

export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
