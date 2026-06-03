import { FC, ReactNode } from "react";
import clsx from "clsx";
import { DocLink, DocSection } from "@/components/DocLink";
import Tooltip from "@/components/Tooltip/Tooltip";
import styles from "@/components/Modal.module.scss";

type ModalHeaderProps = {
  header?: "logo" | string | ReactNode | boolean;
  subHeader?: string | ReactNode;
  showHeaderCloseButton?: boolean;
  close?: () => void;
  headerClassName?: string;
  docSection?: DocSection;
  borderlessHeader?: boolean;
  backgroundlessHeader?: boolean;
};

export const ModalHeader: FC<ModalHeaderProps> = ({
  header,
  subHeader,
  showHeaderCloseButton = true,
  close,
  headerClassName,
  docSection,
  backgroundlessHeader,
}) => {
  if (header) {
    return (
      <div
        className={clsx("modal-header", headerClassName, {
          [styles["modal-header-backgroundless"]]: backgroundlessHeader,
        })}
      >
        <div>
          <h4 className="modal-title">
            {header === "logo" ? (
              <img
                alt="GrowthBook"
                src="/logo/growthbook-logo.png"
                style={{ height: 40 }}
              />
            ) : (
              header
            )}
            {docSection && (
              <DocLink docSection={docSection}>
                <Tooltip body="View Documentation" className="ml-1 w-4 h-4" />
              </DocLink>
            )}
          </h4>
          {subHeader ? <div className="mt-1">{subHeader}</div> : null}
        </div>
        {close && showHeaderCloseButton && (
          <button
            type="button"
            className="close"
            onClick={(e) => {
              e.preventDefault();
              close();
            }}
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {close && showHeaderCloseButton && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="close px-3 py-1"
            onClick={(e) => {
              e.preventDefault();
              close();
            }}
            aria-label="Close"
          >
            <span aria-hidden="true" style={{ fontSize: "24px" }}>
              &times;
            </span>
          </button>
        </div>
      )}
    </>
  );
};
