import { FC, ReactNode } from "react";
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
  closeCta: string | ReactNode;
  closeCtaClassName: string;
  onClickCloseCta?: () => Promise<void> | void;
  cta: string | ReactNode;
  ctaEnabled: boolean;
  disabledMessage?: string;
  fullWidthSubmit: boolean;
  submitColor: string;
  stickyFooter: boolean;
  isSuccess: boolean;
  successMessage?: string;
  useRadixButton?: boolean;
  borderlessFooter: boolean;
};

const ModalFooter: FC<ModalFooterProps> = ({
  hideCta,
  submit,
  secondaryCTA,
  tertiaryCTA,
  backCTA,
  close,
  includeCloseCta,
  closeCta,
  closeCtaClassName,
  onClickCloseCta,
  cta,
  ctaEnabled,
  disabledMessage,
  fullWidthSubmit,
  submitColor,
  stickyFooter,
  isSuccess,
  successMessage,
  useRadixButton,
  borderlessFooter,
}) => {
  if (
    hideCta &&
    !submit &&
    !secondaryCTA &&
    !tertiaryCTA &&
    !backCTA &&
    !(close && includeCloseCta)
  ) {
    return null;
  }

  const showFooter =
    !hideCta &&
    (submit ||
      secondaryCTA ||
      tertiaryCTA ||
      backCTA ||
      (close && includeCloseCta));

  if (!showFooter) {
    return null;
  }

  const closeButtonText = isSuccess && successMessage ? "Close" : closeCta;

  return (
    <div
      className={clsx("modal-footer", {
        "sticky-footer": stickyFooter,
        "modal-borderless-footer": borderlessFooter,
      })}
    >
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
                  {closeButtonText}
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
                {closeButtonText}
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
};

export default ModalFooter;
