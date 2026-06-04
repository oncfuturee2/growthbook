import { FC } from "react";
import clsx from "clsx";

type ModalOverlayProps = {
  open: boolean;
  solidOverlay: boolean;
  increasedElevation?: boolean;
};

const ModalOverlay: FC<ModalOverlayProps> = ({
  open,
  solidOverlay,
  increasedElevation,
}) => {
  const overlayStyle: React.CSSProperties = solidOverlay
    ? {
        opacity: 1,
      }
    : {};

  if (increasedElevation) {
    overlayStyle.zIndex = 1500;
  }

  return (
    <div
      className={clsx("modal-backdrop fade", {
        show: open,
        "d-none": !open,
        "bg-dark": solidOverlay,
      })}
      style={overlayStyle}
    />
  );
};

export default ModalOverlay;
