import { FC, ReactNode } from "react";
import clsx from "clsx";
import { Flex, Text } from "@radix-ui/themes";
import { DocLink, DocSection } from "@/components/DocLink";
import Tooltip from "@/components/Tooltip/Tooltip";
import styles from "./Modal.module.scss";

type ModalHeaderProps = {
  header?: "logo" | string | ReactNode | boolean;
  subHeader?: string | ReactNode;
  showHeaderCloseButton: boolean;
  close?: () => void;
  docSection?: DocSection;
  headerClassName: string;
  backgroundlessHeader: boolean;
};

const ModalHeader: FC<ModalHeaderProps> = ({
  header = "logo",
  subHeader,
  showHeaderCloseButton,
  close,
  docSection,
  headerClassName,
  backgroundlessHeader,
}) => {
  if (!header && (!close || !showHeaderCloseButton)) {
    return null;
  }

  const closeHeaderContent = close && showHeaderCloseButton;

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
        {closeHeaderContent && (
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
      {closeHeaderContent && (
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
      )}
    </>
  );
};

export default ModalHeader;
