import { ReactNode } from "react";
import clsx from "clsx";
import { Flex, Text } from "@radix-ui/themes";
import { DocLink, DocSection } from "@/components/DocLink";
import Tooltip from "@/components/Tooltip/Tooltip";
import styles from "@/components/Modal.module.scss";

type ModalHeaderProps = {
  header: "logo" | string | ReactNode | boolean;
  subHeader?: string | ReactNode;
  headerClassName?: string;
  close?: () => void;
  showHeaderCloseButton: boolean;
  docSection?: DocSection;
  backgroundlessHeader: boolean;
};

export default function ModalHeader({
  header,
  subHeader,
  headerClassName,
  close,
  showHeaderCloseButton,
  docSection,
  backgroundlessHeader,
}: ModalHeaderProps) {
  if (!header) {
    if (close && showHeaderCloseButton) {
      return (
        <Flex justify="end">
          <button
            type="button"
            className="close px-3 py-1"
            onClick={(e) => {
              e.preventDefault();
              close();
            }}
            aria-label="Close"
          >
            <Text aria-hidden="true" size="6">
              &times;
            </Text>
          </button>
        </Flex>
      );
    }
    return null;
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