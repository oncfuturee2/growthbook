import { FC, useRef, useEffect, ReactNode, CSSProperties } from "react";
import clsx from "clsx";
import { TrackEventProps } from "@/services/track";
import Portal from "./Modal/Portal";
import ModalContents from "./Modal/ModalContents";
import ModalOverlay from "./Modal/ModalOverlay";
import { useModalTracking } from "./Modal/useModalTracking";
import { useModalKeyboard } from "./Modal/useModalKeyboard";
import { useModalForm } from "./Modal/useModalForm";
import { DocSection } from "./DocLink";

export type ModalProps = {
  header?: "logo" | string | ReactNode | boolean;
  subHeader?: string | ReactNode;
  showHeaderCloseButton?: boolean;
  open: boolean;
  hideCta?: boolean;
  trackingEventModalType: string;
  trackingEventModalSource?: string;
  allowlistedTrackingEventProps?: TrackEventProps;
  modalUuid?: string;
  trackOnSubmit?: boolean;
  className?: string;
  submitColor?: string;
  cta?: string | ReactNode;
  ctaEnabled?: boolean;
  closeCta?: string | ReactNode;
  includeCloseCta?: boolean;
  onClickCloseCta?: () => Promise<void> | void;
  closeCtaClassName?: string;
  disabledMessage?: string;
  docSection?: DocSection;
  error?: string;
  loading?: boolean;
  size?: "md" | "lg" | "max" | "fill";
  sizeY?: "max" | "fill";
  inline?: boolean;
  overflowAuto?: boolean;
  autoFocusSelector?: string;
  autoCloseOnSubmit?: boolean;
  solidOverlay?: boolean;
  close?: () => void;
  submit?: () => void | Promise<void>;
  fullWidthSubmit?: boolean;
  secondaryCTA?: ReactNode;
  tertiaryCTA?: ReactNode;
  backCTA?: ReactNode;
  successMessage?: string;
  children: ReactNode;
  bodyClassName?: string;
  headerClassName?: string;
  formRef?: React.RefObject<HTMLFormElement>;
  customValidation?: () => Promise<boolean> | boolean;
  increasedElevation?: boolean;
  stickyFooter?: boolean;
  aboveBodyContent?: ReactNode;
  useRadixButton?: boolean;
  borderlessHeader?: boolean;
  backgroundlessHeader?: boolean;
  borderlessFooter?: boolean;
  onBackdropClick?: () => void;
  dismissible?: boolean;
};

const Modal: FC<ModalProps> = ({
  header = "logo",
  subHeader = "",
  showHeaderCloseButton = true,
  children,
  close,
  submit,
  fullWidthSubmit = false,
  submitColor = "primary",
  open = true,
  hideCta = false,
  cta = "Save",
  ctaEnabled = true,
  closeCta = "Cancel",
  onClickCloseCta,
  closeCtaClassName = "btn btn-link",
  includeCloseCta = true,
  disabledMessage,
  inline = false,
  size = "md",
  sizeY,
  docSection,
  className = "",
  autoCloseOnSubmit = true,
  overflowAuto = true,
  autoFocusSelector = "input:not(:disabled),textarea:not(:disabled),select:not(:disabled)",
  solidOverlay = false,
  error: externalError,
  loading: externalLoading,
  secondaryCTA,
  tertiaryCTA,
  backCTA,
  successMessage,
  bodyClassName = "",
  headerClassName = "",
  formRef,
  customValidation,
  increasedElevation,
  stickyFooter = false,
  trackingEventModalType,
  trackingEventModalSource,
  allowlistedTrackingEventProps = {},
  modalUuid: _modalUuid,
  trackOnSubmit = true,
  useRadixButton,
  aboveBodyContent = null,
  borderlessHeader = false,
  backgroundlessHeader = false,
  borderlessFooter = false,
  onBackdropClick,
  dismissible = false,
}) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { modalUuid, sendTrackingEvent } = useModalTracking({
    trackingEventModalType,
    trackingEventModalSource,
    allowlistedTrackingEventProps,
    modalUuid: _modalUuid,
  });

  const {
    loading,
    setLoading,
    error,
    setError,
    isSuccess,
    handleSubmit,
    scrollToTop,
  } = useModalForm({
    externalError,
    externalLoading,
    autoCloseOnSubmit,
    trackOnSubmit,
    successMessage,
    close,
    submit,
    customValidation,
    sendTrackingEvent,
    trackingEventModalType,
    trackingEventModalSource,
    allowlistedTrackingEventProps,
  });

  useModalKeyboard({
    open,
    dismissible,
    close,
    autoFocusSelector,
    modalRef,
    bodyRef,
  });

  useEffect(() => {
    if (externalError) {
      scrollToTop(bodyRef.current);
    }
  }, [externalError, scrollToTop]);

  useEffect(() => {
    if (open) {
      sendTrackingEvent("modal-open");
    }
  }, [open, sendTrackingEvent]);

  let resolvedSize = size;
  if (inline) {
    resolvedSize = "fill";
  }

  const overlayStyle: CSSProperties = solidOverlay
    ? { opacity: 1 }
    : {};

  if (increasedElevation) {
    overlayStyle.zIndex = 1500;
  }

  const modalHtml = (
    <div
      ref={modalRef}
      className={clsx("modal", { show: open })}
      style={{
        display: open ? "block" : "none",
        position: inline ? "relative" : undefined,
        zIndex: inline ? 1 : increasedElevation ? 1550 : undefined,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (onBackdropClick) {
            onBackdropClick();
          } else if (dismissible && close) {
            close();
          }
        }
        e.stopPropagation();
      }}
    >
      <div
        className={`modal-dialog modal-${resolvedSize}`}
        style={
          resolvedSize === "max"
            ? { width: "95vw", maxWidth: 1400, margin: "2vh auto" }
            : resolvedSize === "fill"
              ? { width: "100%", maxWidth: "100%" }
              : {}
        }
      >
        {submit && !isSuccess ? (
          <form ref={formRef} onSubmit={(e) => handleSubmit(e, bodyRef.current)}>
            <ModalContents
              header={header}
              subHeader={subHeader}
              showHeaderCloseButton={showHeaderCloseButton}
              close={close}
              docSection={docSection}
              headerClassName={headerClassName}
              backgroundlessHeader={backgroundlessHeader}
              borderlessHeader={borderlessHeader}
              borderlessFooter={borderlessFooter}
              bodyClassName={bodyClassName}
              overflowAuto={overflowAuto}
              stickyFooter={stickyFooter}
              sizeY={sizeY}
              size={resolvedSize}
              className={className}
              loading={loading}
              error={error}
              isSuccess={isSuccess}
              successMessage={successMessage}
              aboveBodyContent={aboveBodyContent}
              hideCta={hideCta}
              submit={submit}
              secondaryCTA={secondaryCTA}
              tertiaryCTA={tertiaryCTA}
              backCTA={backCTA}
              includeCloseCta={includeCloseCta}
              closeCta={closeCta}
              closeCtaClassName={closeCtaClassName}
              onClickCloseCta={onClickCloseCta}
              cta={cta}
              ctaEnabled={ctaEnabled}
              disabledMessage={disabledMessage}
              fullWidthSubmit={fullWidthSubmit}
              submitColor={submitColor}
              useRadixButton={useRadixButton}
              bodyRef={bodyRef}
            >
              {children}
            </ModalContents>
          </form>
        ) : (
          <ModalContents
            header={header}
            subHeader={subHeader}
            showHeaderCloseButton={showHeaderCloseButton}
            close={close}
            docSection={docSection}
            headerClassName={headerClassName}
            backgroundlessHeader={backgroundlessHeader}
            borderlessHeader={borderlessHeader}
            borderlessFooter={borderlessFooter}
            bodyClassName={bodyClassName}
            overflowAuto={overflowAuto}
            stickyFooter={stickyFooter}
            sizeY={sizeY}
            size={resolvedSize}
            className={className}
            loading={loading}
            error={error}
            isSuccess={isSuccess}
            successMessage={successMessage}
            aboveBodyContent={aboveBodyContent}
            hideCta={hideCta}
            submit={submit}
            secondaryCTA={secondaryCTA}
            tertiaryCTA={tertiaryCTA}
            backCTA={backCTA}
            includeCloseCta={includeCloseCta}
            closeCta={closeCta}
            closeCtaClassName={closeCtaClassName}
            onClickCloseCta={onClickCloseCta}
            cta={cta}
            ctaEnabled={ctaEnabled}
            disabledMessage={disabledMessage}
            fullWidthSubmit={fullWidthSubmit}
            submitColor={submitColor}
            useRadixButton={useRadixButton}
            bodyRef={bodyRef}
          >
            {children}
          </ModalContents>
        )}
      </div>
    </div>
  );

  if (inline) {
    return modalHtml;
  }

  return (
    <Portal>
      <ModalOverlay
        open={open}
        solidOverlay={solidOverlay}
        increasedElevation={increasedElevation}
      />
      {modalHtml}
    </Portal>
  );
};

export default Modal;
