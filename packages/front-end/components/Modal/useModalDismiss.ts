import { MouseEvent, RefObject, useCallback, useEffect } from "react";

type UseModalDismissProps = {
  dismissible: boolean;
  close?: () => void;
  open: boolean;
  modalRef: RefObject<HTMLDivElement>;
  onBackdropClick?: () => void;
};

export default function useModalDismiss({
  dismissible,
  close,
  open,
  modalRef,
  onBackdropClick,
}: UseModalDismissProps) {
  useEffect(() => {
    if (!dismissible || !close || !open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;

      const openModals = Array.from(document.querySelectorAll(".modal.show"));
      const topMostOpenModal = openModals[openModals.length - 1];
      if (topMostOpenModal !== modalRef.current) return;

      event.preventDefault();
      close();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [dismissible, close, open, modalRef]);

  return useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        if (onBackdropClick) {
          onBackdropClick();
        } else if (dismissible && close) {
          close();
        }
      }
      event.stopPropagation();
    },
    [close, dismissible, onBackdropClick],
  );
}
