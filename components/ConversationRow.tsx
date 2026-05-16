"use client";

import Link from "next/link";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { timeAgo } from "@/lib/time";
import type { Id } from "@/convex/_generated/dataModel";

type ConversationRowProps = {
  conversationId: Id<"conversations">;
  otherUserName: string;
  matchedItemTitle?: string;
  lastMessage: {
    type: string;
    content: string;
  } | null;
  lastMessageAt: number;
  hasUnread: boolean;
  onSelect?: (conversationId: Id<"conversations">) => void;
};

function previewText(
  lastMessage: ConversationRowProps["lastMessage"],
): string {
  if (!lastMessage) return COPY.chat.noMessagesYet;
  if (lastMessage.type === "image") return COPY.chat.photo;
  if (lastMessage.type === "location") return COPY.chat.location;
  return lastMessage.content;
}

const rowClass = (hasUnread: boolean) =>
  `flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-gray-50/80 ${
    hasUnread ? "bg-[#4AB9E2]/5" : ""
  }`;

export function ConversationRow({
  conversationId,
  otherUserName,
  matchedItemTitle,
  lastMessage,
  lastMessageAt,
  hasUnread,
  onSelect,
}: ConversationRowProps) {
  const initial = otherUserName.charAt(0).toUpperCase();

  const content = (
    <>
      <span
        className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white shadow-sm"
        style={{ backgroundColor: C.teal }}
      >
        {initial}
        {hasUnread && (
          <span
            className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white"
            style={{ backgroundColor: C.coral }}
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={`truncate ${hasUnread ? "font-bold" : "font-semibold"}`}
            style={{ color: C.teal }}
          >
            {otherUserName}
          </p>
          <span
            className={`shrink-0 text-xs ${hasUnread ? "font-semibold" : ""}`}
            style={{ color: hasUnread ? C.coral : C.slate }}
          >
            {timeAgo(lastMessageAt)}
          </span>
        </div>
        {matchedItemTitle && (
          <p className="mt-0.5 truncate text-xs" style={{ color: C.sky }}>
            {matchedItemTitle}
          </p>
        )}
        <p
          className={`mt-0.5 truncate text-sm ${hasUnread ? "font-medium text-[#333F48]" : ""}`}
          style={{ color: hasUnread ? undefined : C.slate }}
        >
          {previewText(lastMessage)}
        </p>
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button type="button" onClick={() => onSelect(conversationId)} className={rowClass(hasUnread)}>
        {content}
      </button>
    );
  }

  return (
    <Link href={`/chat/${conversationId}`} className={rowClass(hasUnread)}>
      {content}
    </Link>
  );
}
