import { useState, useEffect, useCallback } from "react";
import { truncateString } from "shared/util";
import { TrackEventProps } from "@/services/track";

type UseModalFormProps = {
  externalError?: string;
  externalLoading?: boolean;
  autoCloseOnSubmit: boolean;
  trackOnSubmit: boolean;
  successMessage?: string;
  close?: () => void;
  submit?: () => void | Promise<void>;
  customValidation?: () => Promise<boolean> | boolean;
  sendTrackingEvent: (
    eventName: string,
    additionalProps?: Record<string, unknown>,
  ) => void;
  trackingEventModalType: string;
  trackingEventModalSource?: string;
  allowlistedTrackingEventProps?: TrackEventProps;
};

export function useModalForm({
  externalError,
  externalLoading,
  autoCloseOnSubmit,
  trackOnSubmit,
  successMessage,
  close,
  submit,
  customValidation,
  sendTrackingEvent,
}: UseModalFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setError(externalError || null);
  }, [externalError]);

  useEffect(() => {
    setLoading(externalLoading || false);
  }, [externalLoading]);

  const scrollToTop = useCallback((bodyRef: HTMLDivElement | null) => {
    setTimeout(() => {
      if (bodyRef) {
        bodyRef.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 50);
  }, []);

  const handleSubmit = useCallback(
    async (
      e: React.FormEvent,
      bodyRef: HTMLDivElement | null,
    ): Promise<void> => {
      e.preventDefault();
      e.stopPropagation();
      if (loading) return;
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
        await submit?.();

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
        const message = (e as Error).message;
        setError(message);
        scrollToTop(bodyRef);
        setLoading(false);
        if (trackOnSubmit) {
          sendTrackingEvent("modal-submit-error", {
            error: truncateString(message, 32),
          });
        }
      }
    },
    [
      loading,
      customValidation,
      submit,
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
    setLoading,
    error,
    setError,
    isSuccess,
    setIsSuccess,
    handleSubmit,
    scrollToTop,
  };
}
