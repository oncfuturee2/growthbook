import { CSSProperties, FC, useRef } from "react";
import clsx from "clsx";
import LoadingOverlay from "./LoadingOverlay";
import ModalBody from "./Modal/ModalBody";
import ModalFooter from "./Modal/ModalFooter";
import ModalHeader from "./Modal/ModalHeader";
import Portal from "./Modal/Portal";
import { ModalProps } from "./Modal/shared";
import useModalDismiss from "./Modal/useModalDismiss";
import useModalState from "./Modal/useModalState";
import useModalTracking from "./Modal/useModalTracking";

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
  size: initialSize = "md",
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
  modalUuid,
  trackOnSubmit = true,
  useRadixButton,
  aboveBodyContent = null,
  borderlessHeader = false,
  backgroundlessHeader = false,
  borderlessFooter = false,
  onBackdropClick,
  dismissible = false,
}) => {
  const size = inline ? "fill" : initialSize;
  const bodyRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const sendTrackingEvent = useModalTracking({
    allowlistedTrackingEventProps,
    modalUuid,
    open,
    trackingEventModalSource,
    trackingEventModalType,
  });

  const { error, handleSubmit, isSuccess, loading } = useModalState({
    autoCloseOnSubmit,
    autoFocusSelector,
    bodyRef,
    close,
    customValidation,
    externalError,
    externalLoading,
    open,
    sendTrackingEvent,
    submit,
    successMessage,
    trackOnSubmit,
  });

  const handleModalClick = useModalDismiss({
    close,
    dismissible,
    modalRef,
    onBackdropClick,
    open,
  });

  const contents = (
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
        header={header}
        close={close}
        showHeaderCloseButton={showHeaderCloseButton}
        bodyClassName={bodyClassName}
        bodyRef={bodyRef}
        overflowAuto={overflowAuto}
        stickyFooter={stickyFooter}
        sizeY={sizeY}
        aboveBodyContent={isSuccess ? null : aboveBodyContent}
        error={isSuccess ? null : error}
        bodyContent={
          isSuccess ? (
            <div className="alert alert-success">{successMessage}</div>
          ) : (
            children
          )
        }
      />
      <ModalFooter
        hideCta={hideCta}
        submit={submit}
        secondaryCTA={secondaryCTA}
        tertiaryCTA={tertiaryCTA}
        backCTA={backCTA}
        close={close}
        includeCloseCta={includeCloseCta}
        stickyFooter={stickyFooter}
        useRadixButton={useRadixButton}
        onClickCloseCta={onClickCloseCta}
        closeCtaClassName={closeCtaClassName}
        isSuccess={isSuccess}
        successMessage={successMessage}
        closeCta={closeCta}
        disabledMessage={disabledMessage}
        ctaEnabled={ctaEnabled}
        fullWidthSubmit={fullWidthSubmit}
        submitColor={submitColor}
        cta={cta}
      />
    </div>
  );

  const overlayStyle: CSSProperties = solidOverlay ? { opacity: 1 } : {};

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
      onClick={handleModalClick}
    >
      <div
        className={`modal-dialog modal-${size}`}
        style={
          size === "max"
            ? { width: "95vw", maxWidth: 1400, margin: "2vh auto" }
            : size === "fill"
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
