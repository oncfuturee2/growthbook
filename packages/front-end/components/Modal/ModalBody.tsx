import { ReactNode, RefObject } from "react";
import ErrorDisplay from "@/ui/ErrorDisplay";

type ModalBodyProps = {
  children: ReactNode;
  bodyClassName: string;
  bodyRef: RefObject<HTMLDivElement>;
  isSuccess: boolean;
  successMessage?: string;
  error: string | null;
  aboveBodyContent: ReactNode;
  overflowAuto: boolean;
  sizeY?: "max" | "fill";
  stickyFooter: boolean;
  headerUnset: boolean;
};

export default function ModalBody({
  children,
  bodyClassName,
  bodyRef,
  isSuccess,
  successMessage,
  error,
  aboveBodyContent,
  overflowAuto,
  sizeY,
  stickyFooter,
  headerUnset,
}: ModalBodyProps) {
  return (
    <div
      className={`modal-body ${bodyClassName} ${headerUnset ? "mt-2" : ""}`}
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
}