"use client";

import { useEffect, useMemo, useState } from "react";
import { C } from "@/lib/colors";

type ImageEditorProps = {
  file: File;
  accentColor: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
};

export function ImageEditor({
  file,
  accentColor,
  onConfirm,
  onCancel,
}: ImageEditorProps) {
  const [busy, setBusy] = useState(false);
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // use original image
  const handleUsePhoto = async () => {
    setBusy(true);

    try {
      // send original image directly
      onConfirm(file);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-surface overflow-hidden rounded-2xl p-4">
      {/* TITLE */}
      <p
        className="mb-3 text-sm font-semibold"
        style={{ color: C.teal }}
      >
        Preview Photo
      </p>

      {/* IMAGE PREVIEW */}
      <div className="mb-4 overflow-hidden rounded-xl bg-gray-100">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-auto object-contain"
            draggable={false}
          />
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-3">
        {/* choose another */}
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost flex-1 border-gray-200"
          style={{ color: C.slate }}
        >
          Choose Different Photo
        </button>

        {/* use photo */}
        <button
          type="button"
          onClick={handleUsePhoto}
          disabled={busy}
          className="btn-primary flex-1 disabled:opacity-60"
          style={{ backgroundColor: accentColor }}
        >
          {busy ? "Uploading..." : "Use This Photo"}
        </button>
      </div>
    </div>
  );
}