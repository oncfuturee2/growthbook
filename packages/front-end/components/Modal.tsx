import { FC, useRef, useState } from "react";
import clsx from "clsx";
import { v4 as uuidv4 } from "uuid";
import LoadingOverlay from "./LoadingOverlay";
import Portal from "./Modal/Portal";
import { ModalProps, OverlayStyle } from "./Modal/types";
import { useModalTracking } from "./Modal/useModalTracking";
import { useModalAutoFocus } from "./Modal/useModalAutoFocus";
import { useModalDismissible } from "./Modal/useModalDismissible";
import { useModalForm } from "./Modal/useModalForm";
import ModalHeader from "./Modal/ModalHeader";
import ModalBody from "./Modal/ModalBody";
import ModalFooter from "./Modal/ModalFooter";

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
  const [modalUuid] = useState(_modalUuid || uuidv4());
  const modalRef = useRef<HTMLDivElement>(null);

  const resolvedSize = inline ? "fill" : size;

  const sendTrackingEvent = useModalTracking({
    trackingEventModalType,
    trackingEventModalSource,
    allowlistedTrackingEventProps,
    modalUuid,
    open,
  });

  const { loading, error, isSuccess, bodyRef, handleSubmit } = useModalForm({
    externalError,
    externalLoading,
    submit,
    close,
    autoCloseOnSubmit,
    successMessage,
    customValidation,
    trackOnSubmit,
    sendTrackingEvent,
  });

  useModalAutoFocus({
    open,
    autoFocusSelector,
    bodyRef,
  });

  useModalDismissible({
    dismissible,
    close,
    open,
    modalRef,
    onBackdropClick,
  });

  const contents = (
    <div
      className={clsx("modal-content", className, {
        "modal-borderless-header": borderlessHeader,
        "modal-borderless-footer": borderlessFooter,
      })}
      style={{
        height: sizeY === "max" ? "95vh" : "",
        maxHeight: sizeY ? "" : resolvedSize === "fill" ? "" : "95vh",
        ...(sizeY
          ? { display: "flex" as const, flexDirection: "column" as const }
          : {}),
      }}
    >
      {loading && <LoadingOverlay />}
      <ModalHeader
        header={header}
        subHeader={subHeader}
        headerClassName={headerClassName}
        close={close}
        showHeaderCloseButton={showHeaderCloseButton}
        docSection={docSection}
        backgroundlessHeader={backgroundlessHeader}
      />
      <ModalBody
        bodyClassName={bodyClassName}
        bodyRef={bodyRef}
        isSuccess={isSuccess}
        successMessage={successMessage}
        error={error}
        aboveBodyContent={aboveBodyContent}
        overflowAuto={overflowAuto}
        sizeY={sizeY}
        stickyFooter={stickyFooter}
        headerUnset={!header && (!close || !showHeaderCloseButton)}
      >
        {children}
      </ModalBody>
      <ModalFooter
        hideCta={hideCta}
        submit={isSuccess ? undefined : submit}
        secondaryCTA={secondaryCTA}
        tertiaryCTA={tertiaryCTA}
        backCTA={backCTA}
        close={close}
        includeCloseCta={includeCloseCta}
        stickyFooter={stickyFooter}
        useRadixButton={useRadixButton}
        closeCta={closeCta}
        closeCtaClassName={closeCtaClassName}
        onClickCloseCta={onClickCloseCta}
        isSuccess={isSuccess}
        successMessage={successMessage}
        cta={cta}
        ctaEnabled={ctaEnabled}
        disabledMessage={disabledMessage}
        submitColor={submitColor}
        fullWidthSubmit={fullWidthSubmit}
      />
    </div>
  );

  const overlayStyle: OverlayStyle = solidOverlay
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