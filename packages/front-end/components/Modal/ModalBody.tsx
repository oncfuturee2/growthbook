import { ReactNode, forwardRef } from "react";
import ErrorDisplay from "@/ui/ErrorDisplay";

export type ModalBodyProps = {
  bodyClassName?: string;
  hasHeader?: boolean;
  hasClose?: boolean;
  showHeaderCloseButton?: boolean;
  overflowAuto?: boolean;
  stickyFooter?: boolean;
  sizeY?: "max" | "fill";
  isSuccess?: boolean;
  successMessage?: string;
  aboveBodyContent?: ReactNode;
  error?: string | null;
  children: ReactNode;
};

export const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  (
    {
      bodyClassName = "",
      hasHeader,
      hasClose,
      showHeaderCloseButton,
      overflowAuto,
      stickyFooter,
      sizeY,
      isSuccess,
      successMessage,
      aboveBodyContent,
      error,
      children,
    },
    ref
  ) => {
    return (
      <div
        className={`modal-body ${bodyClassName} ${
          !hasHeader && (!hasClose || !showHeaderCloseButton) ? "mt-2" : ""
        }`}
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
  }
);
ModalBody.displayName = "ModalBody";
