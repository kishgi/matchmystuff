"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useChatWidgetOptional } from "@/components/chat/ChatWidgetContext";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";

type OpenChatButtonProps = {
  matchId: Id<"matches">;
  variant?: "primary" | "icon";
  className?: string;
};

export function OpenChatButton({
  matchId,
  variant = "primary",
  className = "",
}: OpenChatButtonProps) {
  const router = useRouter();
  const chatWidget = useChatWidgetOptional();
  const getOrCreate = useMutation(api.conversations.getOrCreateConversation);
  const [loading, setLoading] = useState(false);

  const openChat = async () => {
    setLoading(true);
    try {
      if (chatWidget) {
        await chatWidget.openMatchChat(matchId);
        return;
      }
      const conversationId = await getOrCreate({ matchId });
      router.push(`/chat/${conversationId}`);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => void openChat()}
        disabled={loading}
        className={`rounded-full p-2 transition-colors hover:bg-gray-100 disabled:opacity-50 ${className}`}
        aria-label={COPY.matches.openChat}
      >
        {loading ? (
          <span className="block h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: C.teal }} />
        ) : (
          <svg className="h-5 w-5" style={{ color: C.teal }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void openChat()}
      disabled={loading}
      className={`btn-primary flex items-center justify-center gap-2 disabled:opacity-60 ${className}`}
      style={{ backgroundColor: C.teal }}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
      {COPY.matches.openChat}
    </button>
  );
}
