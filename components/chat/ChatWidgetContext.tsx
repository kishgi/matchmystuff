"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type ChatWidgetContextValue = {
  isOpen: boolean;
  activeConversationId: Id<"conversations"> | null;
  openList: () => void;
  openConversation: (conversationId: Id<"conversations">) => void;
  openMatchChat: (matchId: Id<"matches">) => Promise<void>;
  close: () => void;
  backToList: () => void;
};

const ChatWidgetContext = createContext<ChatWidgetContextValue | null>(null);

export function ChatWidgetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] =
    useState<Id<"conversations"> | null>(null);
  const getOrCreate = useMutation(api.conversations.getOrCreateConversation);

  const openList = useCallback(() => {
    setActiveConversationId(null);
    setIsOpen(true);
  }, []);

  const openConversation = useCallback((conversationId: Id<"conversations">) => {
    setActiveConversationId(conversationId);
    setIsOpen(true);
  }, []);

  const openMatchChat = useCallback(
    async (matchId: Id<"matches">) => {
      const conversationId = await getOrCreate({ matchId });
      setActiveConversationId(conversationId);
      setIsOpen(true);
    },
    [getOrCreate],
  );

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const backToList = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      activeConversationId,
      openList,
      openConversation,
      openMatchChat,
      close,
      backToList,
    }),
    [
      isOpen,
      activeConversationId,
      openList,
      openConversation,
      openMatchChat,
      close,
      backToList,
    ],
  );

  return (
    <ChatWidgetContext.Provider value={value}>{children}</ChatWidgetContext.Provider>
  );
}

export function useChatWidget() {
  const ctx = useContext(ChatWidgetContext);
  if (!ctx) {
    throw new Error("useChatWidget must be used within ChatWidgetProvider");
  }
  return ctx;
}

export function useChatWidgetOptional() {
  return useContext(ChatWidgetContext);
}
