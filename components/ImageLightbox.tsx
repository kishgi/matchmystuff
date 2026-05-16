"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { C } from "@/lib/colors";

type ImageLightboxProps = {
  src: string;
  open: boolean;
  onClose: () => void;
};

export function ImageLightbox({ src, open, onClose }: ImageLightboxProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-opacity hover:bg-white/20"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt=""
              width={800}
              height={800}
              className="max-h-[85vh] w-auto rounded-xl object-contain"
              unoptimized
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
