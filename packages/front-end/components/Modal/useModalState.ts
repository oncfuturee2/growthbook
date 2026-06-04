import { FormEvent, RefObject, useCallback, useEffect, useState } from "react";
import { truncateString } from "shared/util";
import { SendTrackingEvent } from "./shared";

type UseModalStateProps = {
  bodyRef: RefObject<HTMLDivElement>;
  open: boolean;
  autoFocusSelector?: string;
  externalError?: string;
  externalLoading?: boolean;
  submit?: () => void | Promise<void>;
  customValidation?: () => Promise<boolean> | boolean;
  successMessage?: string;
  close?: () => void;
  autoCloseOnSubmit: boolean;
  trackOnSubmit: boolean;
  sendTrackingEvent: SendTrackingEvent;
};

export default function useModalState({
  bodyRef,
  open,
  autoFocusSelector,
  externalError,
  externalLoading,
  submit,
  customValidation,
  successMessage,
  close,
  autoCloseOnSubmit,
  trackOnSubmit,
  sendTrackingEvent,
}: UseModalStateProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const scrollToTop = useCallback(() => {
    window.setTimeout(() => {
      bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  }, [bodyRef]);

  useEffect(() => {
    setError(externalError || null);
    if (externalError) {
      scrollToTop();
    }
  }, [externalError, scrollToTop]);

  useEffect(() => {
    setLoading(externalLoading || false);
  }, [externalLoading]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!autoFocusSelector || !open || !bodyRef.current) return;

      const input = bodyRef.current.querySelector<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >(autoFocusSelector);

      if (input) {
        input.focus();
        if ("select" in input && typeof input.select === "function") {
          input.select();
        }
      }
    }, 70);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [autoFocusSelector, bodyRef, open]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!submit || loading) return;

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
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        setError(errorMessage);
        scrollToTop();
        setLoading(false);
        if (trackOnSubmit) {
          sendTrackingEvent("modal-submit-error", {
            error: truncateString(errorMessage, 32),
          });
        }
      }
    },
    [
      autoCloseOnSubmit,
      close,
      customValidation,
      loading,
      scrollToTop,
      sendTrackingEvent,
      submit,
      successMessage,
      trackOnSubmit,
    ],
  );

  return {
    error,
    handleSubmit,
    isSuccess,
    loading,
  };
}
