import { useEffect, RefObject } from "react";

export function useModalDismissible({
  dismissible,
  close,
  open,
  modalRef,
  onBackdropClick,
}: {
  dismissible: boolean;
  close?: () => void;
  open: boolean;
  modalRef: RefObject<HTMLDivElement>;
  onBackdropClick?: () => void;
}) {
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
}