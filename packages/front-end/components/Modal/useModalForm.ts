import { useState, useEffect, useRef, useCallback } from "react";
import { truncateString } from "shared/util";

export function useModalForm({
  externalError,
  externalLoading,
  submit,
  close,
  autoCloseOnSubmit,
  successMessage,
  customValidation,
  trackOnSubmit,
  sendTrackingEvent,
}: {
  externalError?: string;
  externalLoading?: boolean;
  submit?: () => void | Promise<void>;
  close?: () => void;
  autoCloseOnSubmit: boolean;
  successMessage?: string;
  customValidation?: () => Promise<boolean> | boolean;
  trackOnSubmit: boolean;
  sendTrackingEvent: (
    eventName: string,
    additionalProps?: Record<string, unknown>,
  ) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const bodyRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    setTimeout(() => {
      if (bodyRef.current) {
        bodyRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 50);
  }, []);

  useEffect(() => {
    setError(externalError || null);
    externalError && scrollToTop();
  }, [externalError, scrollToTop]);

  useEffect(() => {
    setLoading(externalLoading || false);
  }, [externalLoading]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (loading || !submit) return;
      setError(null);
      setLoading(true);
      if (customValidation) {
        const resp = await customValidation();
        if (resp === false) {
          setLoading(false);
          return;
        }
      }
      try {
        await submit();

        setLoading(false);
        if (successMessage) {
          setIsSuccess(true);
        } else if (close && autoCloseOnSubmit) {
          close();
        }
        if (trackOnSubmit) {
          sendTrackingEvent("modal-submit-success");
        }
      } catch (e) {
        setError(e.message);
        scrollToTop();
        setLoading(false);
        if (trackOnSubmit) {
          sendTrackingEvent("modal-submit-error", {
            error: truncateString(e.message, 32),
          });
        }
      }
    },
    [
      loading,
      submit,
      customValidation,
      successMessage,
      close,
      autoCloseOnSubmit,
      trackOnSubmit,
      sendTrackingEvent,
      scrollToTop,
    ],
  );

  return {
    loading,
    error,
    isSuccess,
    bodyRef,
    handleSubmit,
  };
}