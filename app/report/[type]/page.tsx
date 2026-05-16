"use client";

import { DragEvent, FormEvent, use, useCallback, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { fadeIn } from "@/lib/motion";
import { toastError, toastSuccess } from "@/lib/toast";

type ReportType = "lost" | "found";

export default function ReportPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type: typeParam } = use(params);
  const type = (typeParam === "found" ? "found" : "lost") as ReportType;
  const accent = type === "lost" ? C.coral : C.sky;
  const heading = type === "lost" ? COPY.report.lostHeading : COPY.report.foundHeading;

  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const createPost = useMutation(api.posts.createPost);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [storageId, setStorageId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!result.ok) throw new Error(COPY.toast.uploadError);
        const json = (await result.json()) as { storageId: string };
        setStorageId(json.storageId);
        setPreview(URL.createObjectURL(file));
        toastSuccess(COPY.toast.uploadSuccess);
      } catch {
        toastError(COPY.toast.uploadError);
      } finally {
        setUploading(false);
      }
    },
    [generateUploadUrl],
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) void uploadFile(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!storageId || !user) return;
    setSubmitting(true);
    try {
      await createPost({
        type,
        title,
        description,
        location,
        imageStorageId: storageId,
        userName: user.name ?? user.email ?? "Anonymous",
      });
      setSuccess(true);
      toastSuccess(COPY.toast.reportSuccess);
      setTimeout(() => router.push("/"), 2000);
    } catch {
      toastError(COPY.toast.reportError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container-narrow">
      <h1 className="mb-10" style={{ color: C.teal }}>
        {heading}
      </h1>
      <AnimatePresence mode="wait">
        {success ? (
          <motion.p
            key="success"
            initial={fadeIn.initial}
            animate={fadeIn.animate}
            className="text-center text-xl font-medium"
            style={{ color: C.teal }}
          >
            {COPY.report.success}
          </motion.p>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            exit={{ opacity: 0 }}
            className="card-surface space-y-6 p-6 md:p-8"
          >
            <div>
              <label className="mb-2 block text-base font-medium" style={{ color: C.slate }}>
                {COPY.report.title}
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-2 block text-base font-medium" style={{ color: C.slate }}>
                {COPY.report.description}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="input-field resize-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-base font-medium" style={{ color: C.slate }}>
                {COPY.report.location}
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className="relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-colors"
              style={{
                borderColor: accent,
                backgroundColor: dragOver ? `${accent}12` : "transparent",
              }}
            >
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadFile(file);
                }}
              />
              {uploading ? (
                <div
                  className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
                  style={{ borderColor: accent }}
                />
              ) : preview ? (
                <div className="relative h-48 w-full">
                  <Image src={preview} alt="" fill className="rounded-xl object-contain" unoptimized />
                </div>
              ) : (
                <p className="text-center text-base" style={{ color: C.slate }}>
                  {COPY.report.uploadHint}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting || !storageId || !user}
              className="btn-primary flex w-full gap-2"
              style={{ backgroundColor: accent }}
            >
              {submitting && (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {COPY.report.submit}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
