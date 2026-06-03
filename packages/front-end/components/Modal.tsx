import { FC, ReactNode, CSSProperties } from "react";
import clsx from "clsx";
import { TrackEventProps } from "@/services/track";
import LoadingOverlay from "./LoadingOverlay";
import Portal from "./Modal/Portal";
import { useModalTracking } from "./Modal/useModalTracking";
import { useModalKeyboard } from "./Modal/useModalKeyboard";
import { useModalState } from "./Modal/useModalState";
import { ModalHeader } from "./Modal/ModalHeader";
import { ModalBody } from "./Modal/ModalBody";
import { ModalFooter } from "./Modal/ModalFooter";

type ModalProps = {
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
  docSection?: unknown;
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
  const { trackSubmitSuccess, trackSubmitError } = useModalTracking(
    trackingEventModalType,
    trackingEventModalSource,
    allowlistedTrackingEventProps,
    _modalUuid,
    trackOnSubmit,
    open,
  );

  const { modalRef, handleOverlayClick } = useModalKeyboard(
    dismissible,
    open,
    close,
    onBackdropClick,
  );

  const {
    loading,
    setLoading,
    error,
    setError,
    isSuccess,
    setIsSuccess,
    bodyRef,
    scrollToTop,
  } = useModalState(
    externalError,
    externalLoading,
    successMessage,
    open,
    autoFocusSelector,
  );

  let effectiveSize = size;
  if (inline) {
    effectiveSize = "fill";
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setError(null);
    setLoading(true);
    if (customValidation) {
      const resp = await customValidation();
      if (resp === false) {
        setLoading(false);
        return;
      }
    }
    try {
      await submit!();
      setLoading(false);
      if (successMessage) {
        setIsSuccess(true);
      } else if (close && autoCloseOnSubmit) {
        close();
      }
      trackSubmitSuccess();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An error occurred";
      setError(errorMessage);
      scrollToTop();
      setLoading(false);
      trackSubmitError(errorMessage);
    }
  };

  const contents = (
    <div
      className={clsx("modal-content", className, {
        "modal-borderless-header": borderlessHeader,
        "modal-borderless-footer": borderlessFooter,
      })}
      style={{
        height: sizeY === "max" ? "95vh" : "",
        maxHeight: sizeY ? "" : effectiveSize === "fill" ? "" : "95vh",
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
        headerClassName={headerClassName}
        docSection={docSection}
        backgroundlessHeader={backgroundlessHeader}
      />
      <ModalBody
        bodyRef={bodyRef}
        isSuccess={isSuccess}
        successMessage={successMessage}
        error={error}
        aboveBodyContent={aboveBodyContent}
        bodyClassName={bodyClassName}
        overflowAuto={overflowAuto}
        stickyFooter={stickyFooter}
        sizeY={sizeY}
        header={header}
        showHeaderCloseButton={showHeaderCloseButton}
        close={close}
      >
        {children}
      </ModalBody>
      <ModalFooter
        hideCta={hideCta}
        submit={submit}
        isSuccess={isSuccess}
        successMessage={successMessage}
        close={close}
        includeCloseCta={includeCloseCta}
        closeCta={closeCta}
        onClickCloseCta={onClickCloseCta}
        useRadixButton={useRadixButton}
        closeCtaClassName={closeCtaClassName}
        secondaryCTA={secondaryCTA}
        tertiaryCTA={tertiaryCTA}
        backCTA={backCTA}
        cta={cta}
        ctaEnabled={ctaEnabled}
        disabledMessage={disabledMessage}
        fullWidthSubmit={fullWidthSubmit}
        submitColor={submitColor}
        stickyFooter={stickyFooter}
      />
    </div>
  );

  const overlayStyle: CSSProperties = solidOverlay
    ? {
        opacity: 1,
      }
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
      onClick={handleOverlayClick}
    >
      <div
        className={`modal-dialog modal-${effectiveSize}`}
        style={
          effectiveSize === "max"
            ? { width: "95vw", maxWidth: 1400, margin: "2vh auto" }
            : effectiveSize === "fill"
              ? { width: "100%", maxWidth: "100%" }
              : {}
        }
      >
        {submit && !isSuccess ? (
          <form ref={formRef} onSubmit={handleSubmit}>
            {contents}
          </form>
        ) : (
          contents
        )}
      </div>
    </div>
  );

  if (inline) {
    return modalHtml;
  }

  return (
    <Portal>
      <div
        className={clsx("modal-backdrop fade", {
          show: open,
          "d-none": !open,
          "bg-dark": solidOverlay,
        })}
        style={overlayStyle}
      />
      {modalHtml}
    </Portal>
  );
};

export default Modal;
