"use client";

import {
  DragEvent,
  FormEvent,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { FormInput, FormTextarea } from "@/components/FormInput";
import { ImageEditor } from "@/components/ImageEditor";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { fadeIn } from "@/lib/motion";
import { toastError, toastSuccess } from "@/lib/toast";

type ReportType = "lost" | "found";
type ReportMode = "photo" | "describe";

export default function ReportPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type: typeParam } = use(params);
  const type = (typeParam === "found" ? "found" : "lost") as ReportType;
  const isFoundOnly = type === "found";
  const accent = type === "lost" ? C.coral : C.sky;
  const heading = type === "lost" ? COPY.report.lostHeading : COPY.report.foundHeading;

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useQuery(api.users.getCurrentUser);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const getFileUrl = useMutation(api.storage.getFileUrl);
  const validateImage = useAction(api.actions.validateImage);
  const createPost = useMutation(api.posts.createPost);

  const [mode, setMode] = useState<ReportMode>("photo");

  useEffect(() => {
    if (isFoundOnly) setMode("photo");
  }, [isFoundOnly]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [storageId, setStorageId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    image?: string;
  }>({});

  const clearImage = useCallback(() => {
    setStorageId(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPendingFile(null);
  }, [preview]);

  const switchMode = (next: ReportMode) => {
    setMode(next);
    setErrors((e) => ({ ...e, image: undefined }));
    if (next === "describe") clearImage();
  };

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
        if (preview) URL.revokeObjectURL(preview);
        setPreview(URL.createObjectURL(file));
        setPendingFile(null);
        toastSuccess(COPY.toast.uploadSuccess);
      } catch {
        toastError(COPY.toast.uploadError);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [generateUploadUrl, preview],
  );

  const onFileSelected = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPendingFile(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelected(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (title.trim().length < 3) nextErrors.title = COPY.report.titleMin;
    if (description.trim().length < 10) nextErrors.description = COPY.report.descriptionMin;
    if (!storageId) {
      nextErrors.image = isFoundOnly
        ? COPY.report.foundImageRequired
        : mode === "photo"
          ? COPY.report.imageRequired
          : undefined;
    }
    if (nextErrors.image === undefined) delete nextErrors.image;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !user) return;
    setSubmitting(true);
    try {
      let aiDescription: string | undefined;
      if (storageId) {
        setValidating(true);
        const imageUrl = await getFileUrl({ storageId });
        if (!imageUrl) {
          setErrors((e) => ({ ...e, image: COPY.report.imageInvalid }));
          return;
        }
        const validation = await validateImage({ imageUrl });
        if (!validation.valid) {
          setErrors((e) => ({
            ...e,
            image: validation.reason ?? COPY.report.imageInvalid,
          }));
          toastError(validation.reason ?? COPY.report.imageInvalid);
          return;
        }
        aiDescription = validation.aiDescription;
      }

      const postId = await createPost({
        type,
        title,
        description,
        location,
        ...(storageId ? { imageStorageId: storageId } : {}),
        ...(aiDescription ? { aiDescription } : {}),
        userName: user.name ?? user.email ?? "Anonymous",
      });
      toastSuccess(COPY.toast.reportSuccess);
      router.push(`/post/${postId}`);
    } catch {
      toastError(COPY.toast.reportError);
    } finally {
      setSubmitting(false);
      setValidating(false);
    }
  };

  const canSubmit =
    !!user &&
    !submitting &&
    !validating &&
    !uploading &&
    !pendingFile &&
    (isFoundOnly ? !!storageId : mode === "describe" || !!storageId);

  return (
    <div className="page-container-narrow">
      <h1 className="mb-10" style={{ color: C.teal }}>
        {heading}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="card-surface space-y-6 p-6 md:p-8"
      >
        {!isFoundOnly && (
          <div
            className="flex gap-2 rounded-full bg-gray-100 p-1"
            role="tablist"
            aria-label="Report mode"
          >
            {(["photo", "describe"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: mode === m ? accent : "transparent",
                  color: mode === m ? "#fff" : C.slate,
                }}
              >
                {m === "photo" ? COPY.report.modePhoto : COPY.report.modeDescribe}
              </button>
            ))}
          </div>
        )}

        {isFoundOnly && (
          <p
            className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-relaxed"
            style={{ color: C.slate }}
          >
            {COPY.report.foundPhotoRequired}
          </p>
        )}

        {!isFoundOnly && mode === "describe" && (
          <p
            className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-relaxed"
            style={{ color: C.slate }}
          >
            {COPY.report.describeHint}
          </p>
        )}

        <div>
          <label className="mb-2 block text-base font-medium" style={{ color: C.slate }}>
            {COPY.report.title}
          </label>
          <FormInput value={title} onChange={(e) => setTitle(e.target.value)} required />
          {errors.title && (
            <p className="mt-1 text-sm" style={{ color: C.coral }}>
              {errors.title}
            </p>
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
            <p className="mt-1 text-sm" style={{ color: C.coral }}>
              {errors.description}
            </p>
          )}
        </div>
        <div>
          <label className="mb-2 block text-base font-medium" style={{ color: C.slate }}>
            {COPY.report.location}
          </label>
          <FormInput value={location} onChange={(e) => setLocation(e.target.value)} required />
        </div>

        <AnimatePresence mode="wait">
          {(isFoundOnly || mode === "photo") && pendingFile ? (
            <motion.div
              key="editor"
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              exit={{ opacity: 0 }}
            >
              <ImageEditor
                file={pendingFile}
                accentColor={accent}
                onConfirm={(edited) => void uploadFile(edited)}
                onCancel={() => {
                  setPendingFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              />
            </motion.div>
          ) : isFoundOnly || mode === "photo" ? (
            <motion.div
              key="upload"
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              exit={{ opacity: 0 }}
            >
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
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFileSelected(file);
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
              {preview && !uploading && (
                <button
                  type="button"
                  onClick={() => {
                    clearImage();
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="mt-3 text-sm font-medium underline"
                  style={{ color: accent }}
                >
                  {COPY.report.changePhoto}
                </button>
              )}
              {errors.image && (
                <p className="mt-2 text-sm" style={{ color: C.coral }}>
                  {errors.image}
                </p>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary flex w-full gap-2 disabled:opacity-60"
          style={{ backgroundColor: accent }}
        >
          {(submitting || validating) && (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {validating ? COPY.report.validatingImage : COPY.report.submit}
        </button>
      </form>
    </div>
  );
}
