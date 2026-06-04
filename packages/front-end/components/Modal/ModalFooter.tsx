import { ReactNode } from "react";
import clsx from "clsx";
import ConditionalWrapper from "@/components/ConditionalWrapper";
import Tooltip from "@/components/Tooltip/Tooltip";
import Button from "@/ui/Button";

type ModalFooterProps = {
  hideCta: boolean;
  submit?: () => void | Promise<void>;
  secondaryCTA?: ReactNode;
  tertiaryCTA?: ReactNode;
  backCTA?: ReactNode;
  close?: () => void;
  includeCloseCta: boolean;
  stickyFooter: boolean;
  useRadixButton?: boolean;
  onClickCloseCta?: () => Promise<void> | void;
  closeCtaClassName: string;
  isSuccess: boolean;
  successMessage?: string;
  closeCta: string | ReactNode;
  disabledMessage?: string;
  ctaEnabled: boolean;
  fullWidthSubmit: boolean;
  submitColor: string;
  cta: string | ReactNode;
};

export default function ModalFooter({
  hideCta,
  submit,
  secondaryCTA,
  tertiaryCTA,
  backCTA,
  close,
  includeCloseCta,
  stickyFooter,
  useRadixButton,
  onClickCloseCta,
  closeCtaClassName,
  isSuccess,
  successMessage,
  closeCta,
  disabledMessage,
  ctaEnabled,
  fullWidthSubmit,
  submitColor,
  cta,
}: ModalFooterProps) {
  if (
    hideCta ||
    !(
      submit ||
      secondaryCTA ||
      tertiaryCTA ||
      backCTA ||
      (close && includeCloseCta)
    )
  ) {
    return null;
  }

  const handleClose = async () => {
    await onClickCloseCta?.();
    close?.();
  };

  return (
    <div className={clsx("modal-footer", { "sticky-footer": stickyFooter })}>
      {backCTA ? (
        <>
          {backCTA}
          <div className="flex-1" />
        </>
      ) : null}
      <ConditionalWrapper
        condition={stickyFooter}
        wrapper={
          <div
            className="container pagecontents mx-auto text-right"
            style={{ maxWidth: 1100 }}
          />
        }
      >
        {close && includeCloseCta ? (
          useRadixButton ? (
            <div className="mr-1">
              <Button
                variant="ghost"
                onClick={async () => {
                  await handleClose();
                }}
              >
                {isSuccess && successMessage ? "Close" : closeCta}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              className={closeCtaClassName}
              onClick={async (e) => {
                e.preventDefault();
                await handleClose();
              }}
            >
              {isSuccess && successMessage ? "Close" : closeCta}
            </button>
          )
        ) : null}
        {secondaryCTA}
        {submit && !isSuccess ? (
          <Tooltip
            body={disabledMessage || ""}
            shouldDisplay={!ctaEnabled && !!disabledMessage}
            tipPosition="top"
            className={fullWidthSubmit ? "w-100" : ""}
          >
            {useRadixButton ? (
              <Button
                type="submit"
                disabled={!ctaEnabled}
                ml="3"
                color={submitColor === "danger" ? "red" : undefined}
              >
                {cta}
              </Button>
            ) : (
              <button
                className={`btn btn-${submitColor} ${
                  fullWidthSubmit ? "w-100" : ""
                } ${stickyFooter ? "ml-auto mr-5" : ""}`}
                type="submit"
                disabled={!ctaEnabled}
              >
                {cta}
              </button>
            )}
          </Tooltip>
        ) : null}
        {tertiaryCTA}
      </ConditionalWrapper>
    </div>
  );
}
