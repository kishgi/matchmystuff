"use client";

import { useState } from "react";
import { C } from "@/lib/colors";

export function DeleteButton({
  label,
  onConfirm,
  disabled,
}: {
  label?: string;
  onConfirm: () => Promise<void> | void;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleClick = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    try {
      await onConfirm();
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={handleClick}
      onBlur={() => setConfirming(false)}
      className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
      style={{
        backgroundColor: confirming ? C.coral : `${C.coral}18`,
        color: confirming ? C.white : C.coral,
      }}
    >
      {loading ? "…" : confirming ? "Confirm?" : (label ?? "Delete")}
    </button>
  );
}
