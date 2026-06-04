import { useEffect } from "react";

export function useModalEvents({
  open,
  dismissible,
  close,
  autoFocusSelector,
  bodyRef,
  modalRef,
}: {
  open: boolean;
  dismissible?: boolean;
  close?: () => void;
  autoFocusSelector?: string;
  bodyRef: React.RefObject<HTMLDivElement>;
  modalRef: React.RefObject<HTMLDivElement>;
}) {
  // auto focus
  useEffect(() => {
    const timer = setTimeout(() => {
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
    return () => clearTimeout(timer);
  }, [open, autoFocusSelector, bodyRef]);

  // escape key
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
