import { forwardRef, ReactNode } from "react";
import ErrorDisplay from "@/ui/ErrorDisplay";

type ModalBodyProps = {
  children: ReactNode;
  bodyClassName: string;
  hasHeader: boolean;
  showHeaderCloseButton: boolean;
  close?: () => void;
  overflowAuto: boolean;
  stickyFooter: boolean;
  sizeY?: "max" | "fill";
  isSuccess: boolean;
  successMessage?: string;
  error: string | null;
  aboveBodyContent?: ReactNode;
};

const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  (
    {
      children,
      bodyClassName,
      hasHeader,
      showHeaderCloseButton,
      close,
      overflowAuto,
      stickyFooter,
      sizeY,
      isSuccess,
      successMessage,
      error,
      aboveBodyContent,
    },
    ref,
  ) => {
    const showTopMargin = !hasHeader && (!close || !showHeaderCloseButton);

    return (
      <div
        className={`modal-body ${bodyClassName} ${showTopMargin ? "mt-2" : ""}`}
        ref={ref}
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
        {isSuccess ? (
          <div className="alert alert-success">{successMessage}</div>
        ) : (
          <>
            {aboveBodyContent}
            {error && <ErrorDisplay error={error} mb="3" />}
            {children}
          </>
        )}
      </div>
    );
  },
);

ModalBody.displayName = "ModalBody";

export default ModalBody;
