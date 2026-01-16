"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseClipboardOptions {
  successMessage?: string;
  duration?: number;
}

export function useClipboard(options: UseClipboardOptions = {}) {
  const [isCopied, setIsCopied] = useState(false);
  const { successMessage = "Copied to clipboard", duration = 2000 } = options;

  const copy = useCallback(
    async (text: string) => {
      if (!text) return false;

      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        toast.success(successMessage);

        setTimeout(() => {
          setIsCopied(false);
        }, duration);

        return true;
      } catch (error) {
        console.error("Failed to copy text: ", error);
        toast.error("Failed to copy to clipboard");
        return false;
      }
    },
    [successMessage, duration]
  );

  return { isCopied, copy };
}
