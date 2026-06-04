import { useEffect, RefObject } from "react";

export function useModalAutoFocus({
  open,
  autoFocusSelector,
  bodyRef,
}: {
  open: boolean;
  autoFocusSelector: string;
  bodyRef: RefObject<HTMLDivElement>;
}) {
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
}