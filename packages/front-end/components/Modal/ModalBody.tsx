import { FC, ReactNode, RefObject } from "react";
import ErrorDisplay from "@/ui/ErrorDisplay";

type ModalBodyProps = {
  children: ReactNode;
  isSuccess?: boolean;
  successMessage?: string;
  error?: string | null;
  aboveBodyContent?: ReactNode;
  bodyClassName?: string;
  overflowAuto?: boolean;
  stickyFooter?: boolean;
  sizeY?: "max" | "fill";
  header?: "logo" | string | ReactNode | boolean;
  showHeaderCloseButton?: boolean;
  close?: () => void;
  bodyRef?: RefObject<HTMLDivElement>;
};

export const ModalBody: FC<ModalBodyProps> = ({
  children,
  isSuccess,
  successMessage,
  error,
  aboveBodyContent,
  bodyClassName,
  overflowAuto = true,
  stickyFooter = false,
  sizeY,
  header,
  showHeaderCloseButton,
  close,
  bodyRef,
}) => {
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
};
