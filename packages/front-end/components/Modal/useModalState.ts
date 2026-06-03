import { useEffect, useRef, useState } from "react";

export const useModalState = (
  externalError?: string,
  externalLoading?: boolean,
  successMessage?: string,
  open?: boolean,
  autoFocusSelector?: string,
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    setTimeout(() => {
      if (bodyRef.current) {
        bodyRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 50);
  };

  useEffect(() => {
    setError(externalError || null);
    externalError && scrollToTop();
  }, [externalError]);

  useEffect(() => {
    setLoading(externalLoading || false);
  }, [externalLoading]);

  useEffect(() => {
    setTimeout(() => {
      if (!autoFocusSelector) return;
      if (open && bodyRef.current) {
        const input = bodyRef.current.querySelector<
          HTMLInputElement | HTMLTextAreaElement
        >(autoFocusSelector);
        if (input) {
          input.focus();
          if (input.select) {
            input.select();
          }
        }
      }
    }, 70);
  }, [open, autoFocusSelector]);

  return {
    loading,
    setLoading,
    error,
    setError,
    isSuccess,
    setIsSuccess,
    bodyRef,
    scrollToTop,
  };
};
