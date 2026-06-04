import {
  FC,
  useRef,
  useEffect,
  useState,
  ReactNode,
  CSSProperties,
} from "react";
import clsx from "clsx";
import { truncateString } from "shared/util";
import { v4 as uuidv4 } from "uuid";
import { TrackEventProps } from "@/services/track";
import LoadingOverlay from "./LoadingOverlay";
import Portal from "./Modal/Portal";
import { DocSection } from "./DocLink";
import { useModalTracking } from "./Modal/useModalTracking";
import { useModalEvents } from "./Modal/useModalEvents";
import { ModalHeader } from "./Modal/ModalHeader";
import { ModalBody } from "./Modal/ModalBody";
import { ModalFooter } from "./Modal/ModalFooter";

export type ModalProps = {
  header?: "logo" | string | ReactNode | boolean;
  subHeader?: string | ReactNode;
  showHeaderCloseButton?: boolean;
  open: boolean;
  hideCta?: boolean;
  // An empty string will prevent firing a tracking event, but the prop is still required to encourage developers to add tracking
  trackingEventModalType: string;
  // The source (likely page or component) causing the modal to be shown
  trackingEventModalSource?: string;
  // Currently the allowlist for what event props are valid is controlled outside of the codebase.
  // Make sure you've checked that any props you pass here are in the list!
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
  // Enables closing the modal via backdrop click and Escape key.
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
  const [modalUuid] = useState(_modalUuid || uuidv4());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const bodyRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    setTimeout(() => {
      if (bodyRef.current) {
        bodyRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 50);
  };

  if (inline) {
    size = "fill";
  }

  useEffect(() => {
    setError(externalError || null);
    externalError && scrollToTop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalError]);

  useEffect(() => {
    setLoading(externalLoading || false);
  }, [externalLoading]);

  useModalEvents({
    open,
    dismissible,
    close,
    autoFocusSelector,
    bodyRef,
    modalRef,
  });

  const { sendTrackingEvent } = useModalTracking({
    trackingEventModalType,
    trackingEventModalSource,
    allowlistedTrackingEventProps,
    modalUuid,
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
        headerClassName={headerClassName}
        backgroundlessHeader={backgroundlessHeader}
        docSection={docSection}
        close={close}
      />
      <ModalBody
        ref={bodyRef}
        bodyClassName={bodyClassName}
        hasHeader={!!header}
        hasClose={!!close}
        showHeaderCloseButton={showHeaderCloseButton}
        overflowAuto={overflowAuto}
        stickyFooter={stickyFooter}
        sizeY={sizeY}
        isSuccess={isSuccess}
        successMessage={successMessage}
        aboveBodyContent={aboveBodyContent}
        error={error}
      >
        {children}
      </ModalBody>
      <ModalFooter
        hideCta={hideCta}
        submit={!!submit}
        secondaryCTA={secondaryCTA}
        tertiaryCTA={tertiaryCTA}
        backCTA={backCTA}
        close={close}
        includeCloseCta={includeCloseCta}
        stickyFooter={stickyFooter}
        useRadixButton={useRadixButton}
        onClickCloseCta={onClickCloseCta}
        isSuccess={isSuccess}
        successMessage={successMessage}
        closeCta={closeCta}
        closeCtaClassName={closeCtaClassName}
        disabledMessage={disabledMessage}
        ctaEnabled={ctaEnabled}
        fullWidthSubmit={fullWidthSubmit}
        submitColor={submitColor}
        cta={cta}
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
          <form
            ref={formRef}
            onSubmit={async (e) => {
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
                await submit();

                setLoading(false);
                if (successMessage) {
                  setIsSuccess(true);
                } else if (close && autoCloseOnSubmit) {
                  close();
                }
                if (trackOnSubmit) {
                  sendTrackingEvent("modal-submit-success");
                }
              } catch (e: any) {
                setError(e.message);
                scrollToTop();
                setLoading(false);
                if (trackOnSubmit) {
                  sendTrackingEvent("modal-submit-error", {
                    error: truncateString(e.message, 32),
                  });
                }
              }
            }}
          >
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
