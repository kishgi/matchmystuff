"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConversationRow } from "@/components/ConversationRow";
import { Skeleton } from "@/components/Skeleton";
import { useChatWidget } from "@/components/chat/ChatWidgetContext";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";

export function ChatListPanel() {
  const conversations = useQuery(api.conversations.getMyConversations);
  const { openConversation } = useChatWidget();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-gray-100 px-4 py-3">
        <p className="font-semibold" style={{ color: C.teal }}>
          {COPY.chat.title}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: C.slate }}>
          {COPY.chat.subtitle}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations === undefined ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-none" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <p className="text-sm font-medium" style={{ color: C.teal }}>
              {COPY.chat.empty}
            </p>
            <Link
              href="/matches"
              className="btn-primary mt-6 !px-5 !py-2.5 text-sm"
              style={{ backgroundColor: C.teal }}
            >
              {COPY.matches.title}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {conversations.map((c) => (
              <ConversationRow
                key={c._id}
                conversationId={c._id}
                otherUserName={c.otherUserName}
                matchedItemTitle={c.matchedItemTitle}
                lastMessage={c.lastMessage}
                lastMessageAt={c.lastMessageAt}
                hasUnread={c.hasUnread}
                onSelect={openConversation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
