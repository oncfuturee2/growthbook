import { ReactNode, RefObject } from "react";
import ErrorDisplay from "@/ui/ErrorDisplay";

type ModalBodyProps = {
  header: "logo" | string | ReactNode | boolean;
  close?: () => void;
  showHeaderCloseButton: boolean;
  bodyClassName: string;
  bodyRef: RefObject<HTMLDivElement>;
  overflowAuto: boolean;
  stickyFooter: boolean;
  sizeY?: "max" | "fill";
  aboveBodyContent: ReactNode;
  error: string | null;
  bodyContent: ReactNode;
};

export default function ModalBody({
  header,
  close,
  showHeaderCloseButton,
  bodyClassName,
  bodyRef,
  overflowAuto,
  stickyFooter,
  sizeY,
  aboveBodyContent,
  error,
  bodyContent,
}: ModalBodyProps) {
  return (
    <div
      className={`modal-body ${bodyClassName} ${
        !header && (!close || !showHeaderCloseButton) ? "mt-2" : ""
      }`}
      ref={bodyRef}
      style={{
        ...(overflowAuto
          ? {
              overflowY: "auto",
              overflowX: "hidden",
              scrollBehavior: "smooth",
              marginBottom: stickyFooter ? "100px" : undefined,
            }
          : {}),
        ...(sizeY
          ? {
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }
          : {}),
      }}
    >
      {aboveBodyContent}
      {error && <ErrorDisplay error={error} mb="3" />}
      {bodyContent}
    </div>
  );
}
