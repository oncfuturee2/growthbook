import { ReactNode } from "react";
import clsx from "clsx";
import ConditionalWrapper from "@/components/ConditionalWrapper";
import Button from "@/ui/Button";
import Tooltip from "@/components/Tooltip/Tooltip";

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
  closeCta: string | ReactNode;
  closeCtaClassName: string;
  onClickCloseCta?: () => Promise<void> | void;
  isSuccess: boolean;
  successMessage?: string;
  cta: string | ReactNode;
  ctaEnabled: boolean;
  disabledMessage?: string;
  submitColor: string;
  fullWidthSubmit: boolean;
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
  closeCta,
  closeCtaClassName,
  onClickCloseCta,
  isSuccess,
  successMessage,
  cta,
  ctaEnabled,
  disabledMessage,
  submitColor,
  fullWidthSubmit,
}: ModalFooterProps) {
  if (
    hideCta ||
    !(submit || secondaryCTA || tertiaryCTA || backCTA || (close && includeCloseCta))
  ) {
    return null;
  }

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
          <>
            {useRadixButton ? (
              <div className="mr-1">
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await onClickCloseCta?.();
                    close();
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
                  await onClickCloseCta?.();
                  close();
                }}
              >
                {isSuccess && successMessage ? "Close" : closeCta}
              </button>
            )}
          </>
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