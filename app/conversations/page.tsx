"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConversationRow } from "@/components/ConversationRow";
import { Skeleton } from "@/components/Skeleton";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";

export default function ConversationsPage() {
  const conversations = useQuery(api.conversations.getMyConversations);

  return (
    <div className="page-container max-w-2xl">
      <div className="mb-8">
        <h1 style={{ color: C.teal }}>{COPY.chat.title}</h1>
        <p className="mt-2 text-base leading-relaxed" style={{ color: C.slate }}>
          {COPY.chat.subtitle}
        </p>
      </div>
      {conversations === undefined ? (
        <div className="card-surface overflow-hidden divide-y divide-gray-50">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-none" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="card-surface flex flex-col items-center px-6 py-20 text-center">
          <div
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: `${C.sky}25` }}
          >
            <svg className="h-10 w-10" style={{ color: C.teal }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <p className="mb-2 max-w-sm text-lg font-medium" style={{ color: C.teal }}>
            {COPY.chat.empty}
          </p>
          <p className="mb-8 max-w-sm text-sm leading-relaxed" style={{ color: C.slate }}>
            {COPY.matches.empty}
          </p>
          <Link href="/matches" className="btn-primary" style={{ backgroundColor: C.teal }}>
            {COPY.matches.title}
          </Link>
        </div>
      ) : (
        <div className="card-surface overflow-hidden divide-y divide-gray-50">
          {conversations.map((c) => (
            <ConversationRow
              key={c._id}
              conversationId={c._id}
              otherUserName={c.otherUserName}
              matchedItemTitle={c.matchedItemTitle}
              lastMessage={c.lastMessage}
              lastMessageAt={c.lastMessageAt}
              hasUnread={c.hasUnread}
            />
          ))}
        </div>
      )}
    </div>
  );
}
