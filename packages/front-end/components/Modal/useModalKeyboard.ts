import { useRef, useEffect } from "react";

type UseModalKeyboardProps = {
  open: boolean;
  dismissible: boolean;
  close?: () => void;
  autoFocusSelector?: string;
  modalRef: React.RefObject<HTMLDivElement>;
  bodyRef: React.RefObject<HTMLDivElement>;
};

export function useModalKeyboard({
  open,
  dismissible,
  close,
  autoFocusSelector,
  modalRef,
  bodyRef,
}: UseModalKeyboardProps) {
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
  }, [open, autoFocusSelector, bodyRef]);

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
