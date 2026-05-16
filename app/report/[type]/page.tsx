"use client";

import { DragEvent, FormEvent, use, useCallback, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { FormInput, FormTextarea } from "@/components/FormInput";
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    image?: string;
  }>({});

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadProgress(0);
      setErrors((e) => ({ ...e, image: undefined }));
      try {
        const uploadUrl = await generateUploadUrl();
        const storageIdResult = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (ev) => {
            if (ev.lengthComputable) {
              setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
            }
          });
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const json = JSON.parse(xhr.responseText) as { storageId: string };
              resolve(json.storageId);
            } else {
              reject(new Error(COPY.toast.uploadError));
            }
          });
          xhr.addEventListener("error", () => reject(new Error(COPY.toast.uploadError)));
          xhr.open("POST", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });
        setStorageId(storageIdResult);
        setPreview(URL.createObjectURL(file));
        toastSuccess(COPY.toast.uploadSuccess);
      } catch {
        toastError(COPY.toast.uploadError);
      } finally {
        setUploading(false);
        setUploadProgress(0);
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
    const nextErrors: typeof errors = {};
    if (title.trim().length < 3) nextErrors.title = COPY.report.titleMin;
    if (description.trim().length < 10) nextErrors.description = COPY.report.descriptionMin;
    if (!storageId) nextErrors.image = COPY.report.imageRequired;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !user || !storageId) return;
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
              <FormInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              {errors.title && (
                <p className="mt-1 text-sm" style={{ color: C.coral }}>{errors.title}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-base font-medium" style={{ color: C.slate }}>
                {COPY.report.description}
              </label>
              <FormTextarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="resize-none"
              />
              {errors.description && (
                <p className="mt-1 text-sm" style={{ color: C.coral }}>{errors.description}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-base font-medium" style={{ color: C.slate }}>
                {COPY.report.location}
              </label>
              <FormInput
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className="relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-6 transition-colors"
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
                <div className="w-full max-w-xs space-y-2">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%`, backgroundColor: accent }}
                    />
                  </div>
                  <p className="text-center text-sm" style={{ color: C.slate }}>
                    {uploadProgress}%
                  </p>
                </div>
              ) : preview ? (
                <div className="relative h-48 w-full overflow-hidden rounded-xl">
                  <Image src={preview} alt="" fill className="object-contain" unoptimized />
                </div>
              ) : (
                <p className="text-center text-base" style={{ color: C.slate }}>
                  {COPY.report.uploadHint}
                </p>
              )}
            </div>
            {errors.image && (
              <p className="text-sm" style={{ color: C.coral }}>{errors.image}</p>
            )}
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
