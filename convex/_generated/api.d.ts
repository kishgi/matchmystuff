/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as admin from "../admin.js";
import type * as adminAuth from "../adminAuth.js";
import type * as auth from "../auth.js";
import type * as conversations from "../conversations.js";
import type * as http from "../http.js";
import type * as lib_adminGuard from "../lib/adminGuard.js";
import type * as lib_imageValidation from "../lib/imageValidation.js";
import type * as lib_similarity from "../lib/similarity.js";
import type * as matches from "../matches.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as storage from "../storage.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  admin: typeof admin;
  adminAuth: typeof adminAuth;
  auth: typeof auth;
  conversations: typeof conversations;
  http: typeof http;
  "lib/adminGuard": typeof lib_adminGuard;
  "lib/imageValidation": typeof lib_imageValidation;
  "lib/similarity": typeof lib_similarity;
  matches: typeof matches;
  messages: typeof messages;
  notifications: typeof notifications;
  posts: typeof posts;
  storage: typeof storage;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
