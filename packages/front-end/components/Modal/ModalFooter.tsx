import { FC, ReactNode } from "react";
import clsx from "clsx";
import ConditionalWrapper from "@/components/ConditionalWrapper";
import Button from "@/ui/Button";
import Tooltip from "@/components/Tooltip/Tooltip";

type ModalFooterProps = {
  hideCta?: boolean;
  submit?: () => void | Promise<void>;
  isSuccess?: boolean;
  successMessage?: string;
  close?: () => void;
  includeCloseCta?: boolean;
  closeCta?: string | ReactNode;
  onClickCloseCta?: () => Promise<void> | void;
  useRadixButton?: boolean;
  closeCtaClassName?: string;
  secondaryCTA?: ReactNode;
  tertiaryCTA?: ReactNode;
  backCTA?: ReactNode;
  cta?: string | ReactNode;
  ctaEnabled?: boolean;
  disabledMessage?: string;
  fullWidthSubmit?: boolean;
  submitColor?: string;
  stickyFooter?: boolean;
};

export const ModalFooter: FC<ModalFooterProps> = ({
  hideCta = false,
  submit,
  isSuccess,
  successMessage,
  close,
  includeCloseCta = true,
  closeCta = "Cancel",
  onClickCloseCta,
  useRadixButton,
  closeCtaClassName = "btn btn-link",
  secondaryCTA,
  tertiaryCTA,
  backCTA,
  cta = "Save",
  ctaEnabled = true,
  disabledMessage,
  fullWidthSubmit = false,
  submitColor = "primary",
  stickyFooter = false,
}) => {
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
};
