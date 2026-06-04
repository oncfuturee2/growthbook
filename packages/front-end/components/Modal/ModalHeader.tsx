import { ReactNode } from "react";
import clsx from "clsx";
import { Flex } from "@radix-ui/themes";
import Tooltip from "@/components/Tooltip/Tooltip";
import { DocLink, DocSection } from "@/components/DocLink";
import styles from "@/components/Modal.module.scss";

type ModalHeaderProps = {
  header: "logo" | string | ReactNode | boolean;
  subHeader?: string | ReactNode;
  showHeaderCloseButton: boolean;
  close?: () => void;
  docSection?: DocSection;
  headerClassName: string;
  backgroundlessHeader: boolean;
};

export default function ModalHeader({
  header,
  subHeader,
  showHeaderCloseButton,
  close,
  docSection,
  headerClassName,
  backgroundlessHeader,
}: ModalHeaderProps) {
  const closeButton = close && showHeaderCloseButton && (
    <button
      type="button"
      className={header ? "close" : "close px-3 py-1"}
      onClick={(e) => {
        e.preventDefault();
        close();
      }}
      aria-label="Close"
    >
      {header ? (
        <span aria-hidden="true">×</span>
      ) : (
        <span aria-hidden="true" style={{ fontSize: "var(--font-size-6)" }}>
          &times;
        </span>
      )}
    </button>
  );

  if (!header) {
    return closeButton ? <Flex justify="end">{closeButton}</Flex> : null;
  }

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
      {closeButton}
    </div>
  );
}
