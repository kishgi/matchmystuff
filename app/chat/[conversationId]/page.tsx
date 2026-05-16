"use client";

import { use, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ChatInput } from "@/components/ChatInput";
import { MessageBubble } from "@/components/MessageBubble";
import { Skeleton } from "@/components/Skeleton";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { formatDateSeparator } from "@/lib/time";

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export default function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId: rawId } = use(params);
  const conversationId = rawId as Id<"conversations">;
  const scrollRef = useRef<HTMLDivElement>(null);

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
      <div className="flex h-[calc(100dvh-5rem)] flex-col">
        <Skeleton className="h-16 shrink-0 rounded-none" />
        <div className="flex-1 space-y-4 p-4">
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="ml-auto h-16 w-2/3" />
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-[calc(100dvh-5rem)] flex-col items-center justify-center px-4">
        <p className="mb-4 text-center" style={{ color: C.slate }}>
          {COPY.toast.matchNotFound}
        </p>
        <Link href="/conversations" className="btn-primary" style={{ backgroundColor: C.teal }}>
          {COPY.chat.back}
        </Link>
      </div>
    );
  }

  const initial = conversation.otherUserName.charAt(0).toUpperCase();

  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col overflow-hidden bg-[#f4f8fa]">
      <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 shadow-sm">
        <Link
          href="/conversations"
          className="rounded-full p-2 transition-colors hover:bg-gray-100"
          aria-label={COPY.chat.back}
        >
          <svg className="h-5 w-5" style={{ color: C.teal }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
          style={{ backgroundColor: C.teal }}
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold" style={{ color: C.teal }}>
            {conversation.otherUserName}
          </p>
          <p className="truncate text-xs" style={{ color: C.slate }}>
            {COPY.chat.matchedItem} · {conversation.matchedItemTitle}
          </p>
        </div>
        <Link
          href={`/matches/${conversation.matchId}`}
          className="shrink-0 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-gray-50"
          style={{ color: C.sky }}
        >
          {COPY.chat.viewMatch}
        </Link>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${C.sky}12 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: `${C.teal}12` }}
              >
                <svg className="h-8 w-8" style={{ color: C.teal }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <p className="max-w-xs text-base font-medium" style={{ color: C.teal }}>
                {COPY.chat.emptyInChat}
              </p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: C.slate }}>
                {COPY.chat.emptyInChatHint}
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.date}>
                <p
                  className="mb-4 text-center text-[11px] font-semibold uppercase tracking-wide"
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
