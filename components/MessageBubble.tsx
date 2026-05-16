"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { formatMessageTime } from "@/lib/time";
import { ImageLightbox } from "@/components/ImageLightbox";

export type MessageData = {
  _id: string;
  senderId: string;
  senderName: string;
  type: "text" | "image" | "location";
  content: string;
  imageUrl?: string;
  location?: { lat: number; lng: number; label: string };
  createdAt: number;
  seen: boolean;
};

type MessageBubbleProps = {
  message: MessageData;
  isOwn: boolean;
  showSenderName?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
};

export function MessageBubble({
  message,
  isOwn,
  showSenderName = true,
  isFirstInGroup = true,
  isLastInGroup = true,
}: MessageBubbleProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const radiusOwn = isFirstInGroup && isLastInGroup
    ? "rounded-2xl rounded-br-md"
    : isFirstInGroup
      ? "rounded-2xl rounded-br-md"
      : isLastInGroup
        ? "rounded-2xl rounded-tr-md"
        : "rounded-2xl rounded-r-md";

  const radiusOther = isFirstInGroup && isLastInGroup
    ? "rounded-2xl rounded-bl-md"
    : isFirstInGroup
      ? "rounded-2xl rounded-bl-md"
      : isLastInGroup
        ? "rounded-2xl rounded-tl-md"
        : "rounded-2xl rounded-l-md";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col ${isOwn ? "items-end" : "items-start"} ${!isFirstInGroup ? "-mt-1" : ""}`}
    >
      {!isOwn && showSenderName && isFirstInGroup && (
        <span className="mb-1 ml-1 text-xs font-semibold" style={{ color: C.teal }}>
          {message.senderName}
        </span>
      )}
      <motion.div
        className={`max-w-[min(85%,320px)] shadow-sm ${
          isOwn
            ? `${radiusOwn} text-white`
            : `${radiusOther} border border-gray-100/80 bg-white`
        } ${message.type === "image" ? "overflow-hidden p-1" : "px-4 py-2.5"}`}
        style={isOwn ? { backgroundColor: C.teal } : undefined}
      >
        {message.type === "text" && (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {message.content}
          </p>
        )}
        {message.type === "image" && message.imageUrl && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="relative block w-full max-w-[260px] overflow-hidden rounded-xl"
          >
            <Image
              src={message.imageUrl}
              alt=""
              width={260}
              height={260}
              className="h-auto max-h-64 w-full object-cover"
              unoptimized
            />
          </button>
        )}
        {message.type === "location" && message.location && (
          <div className="flex flex-col gap-2.5">
            <motion.div className="flex items-start gap-2.5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isOwn ? "bg-white/15" : "bg-gray-50"}`}
              >
                <svg
                  className="h-4 w-4"
                  style={{ color: isOwn ? C.sky : C.coral }}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                </svg>
              </span>
              <p className="text-sm leading-relaxed">{message.location.label}</p>
            </motion.div>
            <a
              href={`https://www.google.com/maps?q=${message.location.lat},${message.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-xs font-semibold ${isOwn ? "text-white/90 hover:text-white" : ""}`}
              style={!isOwn ? { color: C.teal } : undefined}
            >
              {COPY.chat.openMaps}
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 4.5v15a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18.75V9.75m-8.25 0V6m0 0h8.25m-8.25 0L21 3" />
              </svg>
            </a>
          </div>
        )}
      </motion.div>
      {isLastInGroup && (
        <div className={`mt-1 flex items-center gap-1 px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className="text-[11px]" style={{ color: C.slate, opacity: 0.7 }}>
            {formatMessageTime(message.createdAt)}
          </span>
          {isOwn && (
            <span className="flex items-center" title={message.seen ? COPY.chat.delivered : COPY.chat.sent}>
              {message.seen ? (
                <svg className="h-3.5 w-3.5" style={{ color: C.sky }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 7l-1.4-1.4-6.6 6.6L7.4 9.4 6 10.8l4 4 8-7.8zm-4 0l-1.4-1.4-2.6 2.6L7.4 9.4 6 10.8l4 4 6-5.8z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" style={{ color: C.slate, opacity: 0.4 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
          )}
        </div>
      )}
      {message.imageUrl && (
        <ImageLightbox
          src={message.imageUrl}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </motion.div>
  );
}
