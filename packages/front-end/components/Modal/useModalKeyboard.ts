import { useEffect, useRef } from "react";

export const useModalKeyboard = (
  dismissible: boolean,
  open: boolean,
  close?: () => void,
  onBackdropClick?: () => void,
) => {
  const modalRef = useRef<HTMLDivElement>(null);

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
  }, [dismissible, close, open]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (onBackdropClick) {
        onBackdropClick();
      } else if (dismissible && close) {
        close();
      }
    }
    e.stopPropagation();
  };

  return { modalRef, handleOverlayClick };
};
