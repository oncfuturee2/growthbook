import { FC, ReactNode, CSSProperties } from "react";
import clsx from "clsx";
import LoadingOverlay from "../LoadingOverlay";
import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import { DocSection } from "@/components/DocLink";

type ModalContentsProps = {
  header?: "logo" | string | ReactNode | boolean;
  subHeader?: string | ReactNode;
  showHeaderCloseButton: boolean;
  close?: () => void;
  docSection?: DocSection;
  headerClassName: string;
  backgroundlessHeader: boolean;
  borderlessHeader: boolean;
  borderlessFooter: boolean;
  bodyClassName: string;
  overflowAuto: boolean;
  stickyFooter: boolean;
  sizeY?: "max" | "fill";
  size: "md" | "lg" | "max" | "fill";
  className: string;
  loading: boolean;
  error: string | null;
  isSuccess: boolean;
  successMessage?: string;
  aboveBodyContent?: ReactNode;
  children: ReactNode;
  hideCta: boolean;
  submit?: () => void | Promise<void>;
  secondaryCTA?: ReactNode;
  tertiaryCTA?: ReactNode;
  backCTA?: ReactNode;
  includeCloseCta: boolean;
  closeCta: string | ReactNode;
  closeCtaClassName: string;
  onClickCloseCta?: () => Promise<void> | void;
  cta: string | ReactNode;
  ctaEnabled: boolean;
  disabledMessage?: string;
  fullWidthSubmit: boolean;
  submitColor: string;
  useRadixButton?: boolean;
  bodyRef: React.RefObject<HTMLDivElement>;
};

const ModalContents: FC<ModalContentsProps> = ({
  header,
  subHeader,
  showHeaderCloseButton,
  close,
  docSection,
  headerClassName,
  backgroundlessHeader,
  borderlessHeader,
  borderlessFooter,
  bodyClassName,
  overflowAuto,
  stickyFooter,
  sizeY,
  size,
  className,
  loading,
  error,
  isSuccess,
  successMessage,
  aboveBodyContent,
  children,
  hideCta,
  submit,
  secondaryCTA,
  tertiaryCTA,
  backCTA,
  includeCloseCta,
  closeCta,
  closeCtaClassName,
  onClickCloseCta,
  cta,
  ctaEnabled,
  disabledMessage,
  fullWidthSubmit,
  submitColor,
  useRadixButton,
  bodyRef,
}) => {
  return (
    <div
      className={clsx("modal-content", className, {
        "modal-borderless-header": borderlessHeader,
        "modal-borderless-footer": borderlessFooter,
      })}
      style={{
        height: sizeY === "max" ? "95vh" : "",
        maxHeight: sizeY ? "" : size === "fill" ? "" : "95vh",
        ...(sizeY
          ? { display: "flex" as const, flexDirection: "column" as const }
          : {}),
      }}
    >
      {loading && <LoadingOverlay />}
      <ModalHeader
        header={header}
        subHeader={subHeader}
        showHeaderCloseButton={showHeaderCloseButton}
        close={close}
        docSection={docSection}
        headerClassName={headerClassName}
        backgroundlessHeader={backgroundlessHeader}
      />
      <ModalBody
        ref={bodyRef}
        bodyClassName={bodyClassName}
        hasHeader={!!header}
        showHeaderCloseButton={showHeaderCloseButton}
        close={close}
        overflowAuto={overflowAuto}
        stickyFooter={stickyFooter}
        sizeY={sizeY}
        isSuccess={isSuccess}
        successMessage={successMessage}
        error={error}
        aboveBodyContent={aboveBodyContent}
      >
        {children}
      </ModalBody>
      <ModalFooter
        hideCta={hideCta}
        submit={submit}
        secondaryCTA={secondaryCTA}
        tertiaryCTA={tertiaryCTA}
        backCTA={backCTA}
        close={close}
        includeCloseCta={includeCloseCta}
        closeCta={closeCta}
        closeCtaClassName={closeCtaClassName}
        onClickCloseCta={onClickCloseCta}
        cta={cta}
        ctaEnabled={ctaEnabled}
        disabledMessage={disabledMessage}
        fullWidthSubmit={fullWidthSubmit}
        submitColor={submitColor}
        stickyFooter={stickyFooter}
        isSuccess={isSuccess}
        successMessage={successMessage}
        useRadixButton={useRadixButton}
        borderlessFooter={borderlessFooter}
      />
    </div>
  );
};

export default ModalContents;
