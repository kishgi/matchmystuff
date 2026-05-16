"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { reverseGeocode } from "@/lib/geo";

type ChatInputProps = {
  conversationId: Id<"conversations">;
  onSent: () => void;
};

export function ChatInput({ conversationId, onSent }: ChatInputProps) {
  const [text, setText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const sendMessage = useMutation(api.messages.sendMessage);
  const generateUploadUrl = useMutation(api.messages.generateImageUploadUrl);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSendText = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await sendMessage({
        conversationId,
        type: "text",
        content: trimmed,
      });
      setText("");
      onSent();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendText();
    }
  };

  const uploadImage = async (file: File) => {
    setSending(true);
    setMenuOpen(false);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) return;
      const { storageId } = (await result.json()) as { storageId: string };
      await sendMessage({
        conversationId,
        type: "image",
        content: "",
        imageStorageId: storageId,
      });
      onSent();
    } finally {
      setSending(false);
    }
  };

  const shareLocation = () => {
    setMenuOpen(false);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError(COPY.chat.locationUnavailable);
      return;
    }
    setSending(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const label = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude,
          );
          await sendMessage({
            conversationId,
            type: "location",
            content: label,
            location: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              label,
            },
          });
          onSent();
        } finally {
          setSending(false);
        }
      },
      () => {
        setLocationError(COPY.chat.locationDenied);
        setSending(false);
      },
    );
  };

  return (
    <div className="shrink-0 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto max-w-2xl">
        {locationError && (
          <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm" style={{ color: C.coral }}>
            {locationError}
          </p>
        )}
        <div className="flex items-end gap-2">
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              disabled={sending}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                menuOpen ? "border-[#1B5E78] bg-[#1B5E78]/5" : "border-gray-200 hover:bg-gray-50"
              } disabled:opacity-50`}
              aria-label="Attachments"
            >
              <svg
                className={`h-5 w-5 transition-transform ${menuOpen ? "rotate-45" : ""}`}
                style={{ color: C.teal }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute bottom-full left-0 z-50 mb-2 w-52 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm transition-colors hover:bg-gray-50"
                  style={{ color: C.slate }}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: `${C.sky}20` }}>
                    <svg className="h-4 w-4" style={{ color: C.sky }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </span>
                  {COPY.chat.sharePhoto}
                </button>
                <button
                  type="button"
                  onClick={shareLocation}
                  className="flex w-full items-center gap-3 border-t border-gray-50 px-4 py-3.5 text-left text-sm transition-colors hover:bg-gray-50"
                  style={{ color: C.slate }}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: `${C.coral}18` }}>
                    <svg className="h-4 w-4" style={{ color: C.coral }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                    </svg>
                  </span>
                  {COPY.chat.shareLocation}
                </button>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadImage(file);
              e.target.value = "";
            }}
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={COPY.chat.placeholder}
            disabled={sending}
            rows={1}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-[15px] text-[#333F48] transition-colors focus:border-[#4AB9E2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4AB9E2]/30"
            style={{ lineHeight: "1.4" }}
          />
          <button
            type="button"
            onClick={() => void handleSendText()}
            disabled={!text.trim() || sending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-md transition-all hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
            style={{ backgroundColor: C.coral }}
            aria-label="Send"
          >
            {sending ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
