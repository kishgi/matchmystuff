"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ChatInput } from "@/components/ChatInput";
import { MessageBubble } from "@/components/MessageBubble";
import { Skeleton } from "@/components/Skeleton";
import { useChatWidget } from "@/components/chat/ChatWidgetContext";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { formatDateSeparator } from "@/lib/time";

const GROUP_WINDOW_MS = 5 * 60 * 1000;

type ChatThreadPanelProps = {
  conversationId: Id<"conversations">;
};

export function ChatThreadPanel({ conversationId }: ChatThreadPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { backToList } = useChatWidget();

  const user = useQuery(api.users.getCurrentUser);
  const conversation = useQuery(api.conversations.getConversation, {
    conversationId,
  });
  const messageData = useQuery(api.messages.getMessages, { conversationId });
  const messages = messageData?.messages ?? [];
  const markRead = useMutation(api.messages.markMessagesRead);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      void markRead({ conversationId });
      scrollToBottom();
    }
  }, [messages, conversationId, markRead, scrollToBottom]);

  const grouped = useMemo(() => {
    const groups: { date: string; items: typeof messages }[] = [];
    let currentDate = "";
    for (const msg of messages) {
      const d = formatDateSeparator(msg.createdAt);
      if (d !== currentDate) {
        currentDate = d;
        groups.push({ date: d, items: [] });
      }
      groups[groups.length - 1].items.push(msg);
    }
    return groups;
  }, [messages]);

  const userId = user?._id ? String(user._id) : undefined;

  if (conversation === undefined || user === undefined) {
    return (
      <div className="flex h-full flex-col p-4">
        <Skeleton className="mb-4 h-12 shrink-0" />
        <Skeleton className="mb-3 h-14 w-2/3" />
        <Skeleton className="ml-auto h-14 w-2/3" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <p className="mb-4 text-sm" style={{ color: C.slate }}>
          {COPY.toast.matchNotFound}
        </p>
        <button
          type="button"
          onClick={backToList}
          className="btn-primary text-sm !px-5 !py-2"
          style={{ backgroundColor: C.teal }}
        >
          {COPY.chat.back}
        </button>
      </div>
    );
  }

  const initial = conversation.otherUserName.charAt(0).toUpperCase();

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f4f8fa]">
      <header className="flex shrink-0 items-center gap-2 border-b border-gray-100 bg-white px-3 py-2.5">
        <button
          type="button"
          onClick={backToList}
          className="rounded-full p-1.5 transition-colors hover:bg-gray-100"
          aria-label={COPY.chat.back}
        >
          <svg className="h-5 w-5" style={{ color: C.teal }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: C.teal }}
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" style={{ color: C.teal }}>
            {conversation.otherUserName}
          </p>
          <p className="truncate text-[11px]" style={{ color: C.slate }}>
            {COPY.chat.matchedItem} · {conversation.matchedItemTitle}
          </p>
        </div>
        <Link
          href={`/matches/${conversation.matchId}`}
          className="shrink-0 rounded-full border border-gray-200 px-2 py-1 text-[10px] font-semibold transition-colors hover:bg-gray-50"
          style={{ color: C.sky }}
        >
          {COPY.chat.viewMatch}
        </Link>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium" style={{ color: C.teal }}>
                {COPY.chat.emptyInChat}
              </p>
              <p className="mt-1 text-xs" style={{ color: C.slate }}>
                {COPY.chat.emptyInChatHint}
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.date}>
                <p
                  className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: C.slate, opacity: 0.65 }}
                >
                  {group.date}
                </p>
                <div className="flex flex-col gap-1">
                  {group.items.map((msg, i) => {
                    const prev = group.items[i - 1];
                    const next = group.items[i + 1];
                    const isOwn = msg.senderId === userId;
                    const sameAsPrev =
                      prev &&
                      prev.senderId === msg.senderId &&
                      msg.createdAt - prev.createdAt < GROUP_WINDOW_MS;
                    const sameAsNext =
                      next &&
                      next.senderId === msg.senderId &&
                      next.createdAt - msg.createdAt < GROUP_WINDOW_MS;

                    return (
                      <MessageBubble
                        key={msg._id}
                        message={msg}
                        isOwn={isOwn}
                        showSenderName={!isOwn && !sameAsPrev}
                        isFirstInGroup={!sameAsPrev}
                        isLastInGroup={!sameAsNext}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ChatInput conversationId={conversationId} onSent={scrollToBottom} />
    </div>
  );
}
