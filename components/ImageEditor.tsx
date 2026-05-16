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
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const rotate = (delta: number) => {
    setState((s) => ({ ...s, rotation: s.rotation + delta }));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: state.offsetX,
      oy: state.offsetY,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setState((s) => ({
      ...s,
      offsetX: dragRef.current!.ox + dx,
      offsetY: dragRef.current!.oy + dy,
    }));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleConfirm = useCallback(async () => {
    setBusy(true);
    try {
      const blob = await renderEditedImage(file, state);
      const edited = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
        type: "image/jpeg",
      });
      onConfirm(edited);
    } finally {
      setBusy(false);
    }
  }, [file, state, onConfirm]);

  const transform = `rotate(${state.rotation}deg) scale(${state.scale}) translate(${state.offsetX / state.scale}px, ${state.offsetY / state.scale}px)`;

  return (
    <div className="card-surface overflow-hidden rounded-2xl p-4">
      <p className="mb-3 text-sm font-semibold" style={{ color: C.teal }}>
        {COPY.report.editorTitle}
      </p>
      <p className="mb-4 text-xs leading-relaxed" style={{ color: C.slate }}>
        {COPY.report.editorHint}
      </p>
      <div
        className="relative mx-auto mb-4 aspect-square w-full max-w-sm cursor-grab overflow-hidden rounded-xl border-2 bg-gray-100 active:cursor-grabbing"
        style={{ borderColor: accentColor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {previewUrl && (
          <img
            src={previewUrl}
            alt=""
            className="pointer-events-none absolute left-1/2 top-1/2 max-h-none max-w-none select-none"
            style={{
              transform: `translate(-50%, -50%) ${transform}`,
              transformOrigin: "center center",
            }}
            draggable={false}
          />
        )}
        <div
          className="pointer-events-none absolute inset-4 rounded-lg border-2 border-dashed border-white/80 shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.25)]"
          aria-hidden
        />
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => rotate(-90)}
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
          style={{ color: C.slate }}
        >
          {COPY.report.rotateLeft}
        </button>
        <button
          type="button"
          onClick={() => rotate(90)}
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
          style={{ color: C.slate }}
        >
          {COPY.report.rotateRight}
        </button>
        <button
          type="button"
          onClick={() =>
            setState((s) => ({ ...s, scale: Math.min(s.scale + 0.1, 3) }))
          }
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
          style={{ color: C.slate }}
        >
          {COPY.report.zoomIn}
        </button>
        <button
          type="button"
          onClick={() =>
            setState((s) => ({ ...s, scale: Math.max(s.scale - 0.1, 0.5) }))
          }
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
          style={{ color: C.slate }}
        >
          {COPY.report.zoomOut}
        </button>
      </div>
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
          {busy ? COPY.report.editorApplying : COPY.report.editorConfirm}
        </button>
      </div>
    </div>
  );
}
