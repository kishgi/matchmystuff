/* eslint-disable */
import {
  ActionBuilder,
  HttpActionBuilder,
  InternalActionBuilder,
  InternalMutationBuilder,
  InternalQueryBuilder,
  MutationBuilder,
  QueryBuilder,
} from "convex/server";
import type { DataModel } from "./dataModel.js";

export declare const query: QueryBuilder<DataModel, "public">;
export declare const internalQuery: InternalQueryBuilder<DataModel, "internal">;
export declare const mutation: MutationBuilder<DataModel, "public">;
export declare const internalMutation: InternalMutationBuilder<DataModel, "internal">;
export declare const action: ActionBuilder<DataModel, "public">;
export declare const internalAction: InternalActionBuilder<DataModel, "internal">;
export declare const httpAction: HttpActionBuilder;
