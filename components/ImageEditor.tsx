"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import {
  defaultEditState,
  renderEditedImage,
  type EditState,
} from "@/lib/imageEdit";

type ImageEditorProps = {
  file: File;
  accentColor: string;
  onConfirm: (editedFile: File) => void;
  onCancel: () => void;
};

export function ImageEditor({
  file,
  accentColor,
  onConfirm,
  onCancel,
}: ImageEditorProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [state, setState] = useState<EditState>(defaultEditState);
  const [busy, setBusy] = useState(false);



  // create preview
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);




  // confirm edit
  const handleConfirm = useCallback(async () => {
    setBusy(true);

    try {
      const blob = await renderEditedImage(file, state);

      const editedFile = new File(
        [blob],
        file.name.replace(/\.\w+$/, ".jpg"),
        {
          type: "image/jpeg",
        },
      );

      onConfirm(editedFile);
    } finally {
      setBusy(false);
    }
  }, [file, state, onConfirm]);

  // image transform
  const transform = `
    rotate(${state.rotation}deg)
    scale(${state.scale})
    translate(
      ${state.offsetX / state.scale}px,
      ${state.offsetY / state.scale}px
    )
  `;

  return (
    <div className="card-surface overflow-hidden rounded-2xl p-4">

      {/* TITLE */}
      <p
        className="mb-3 text-sm font-semibold"
        style={{ color: C.teal }}
      >
        {COPY.report.editorTitle}
      </p>

      

      {/* IMAGE AREA */}
      <div
        className="relative mx-auto mb-4 aspect-square w-full  cursor-grab overflow-hidden rounded-xl bg-gray-100 active:cursor-grabbing"
        
      >
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            draggable={false}
            className="pointer-events-none absolute left-1/2 top-1/2 max-h-none max-w-none select-none"
            style={{
              transform: `translate(-50%, -50%) ${transform}`,
              transformOrigin: "center center",
            }}
          />
        )}

       
      </div>

      

      {/* ACTION BUTTONS */}
      <div className="flex gap-3">

        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost flex-1 border-gray-200"
          style={{ color: C.slate }}
        >
          {COPY.report.editorCancel}
        </button>

        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={busy}
          className="btn-primary flex-1 disabled:opacity-60"
          style={{ backgroundColor: accentColor }}
        >
          {busy
            ? COPY.report.editorApplying
            : COPY.report.editorConfirm}
        </button>
      </div>
    </div>
  );
}