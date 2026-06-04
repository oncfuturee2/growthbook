import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import track from "@/services/track";
import { ModalProps, SendTrackingEvent } from "./shared";

type UseModalTrackingProps = Pick<
  ModalProps,
  | "allowlistedTrackingEventProps"
  | "modalUuid"
  | "trackingEventModalSource"
  | "trackingEventModalType"
> & {
  open: boolean;
};

export default function useModalTracking({
  allowlistedTrackingEventProps = {},
  modalUuid: initialModalUuid,
  trackingEventModalSource,
  trackingEventModalType,
  open,
}: UseModalTrackingProps): SendTrackingEvent {
  const [modalUuid] = useState(initialModalUuid || uuidv4());
  const sendTrackingEvent = useCallback<SendTrackingEvent>(
    (eventName, additionalProps) => {
      if (trackingEventModalType === "") {
        return;
      }
      track(eventName, {
        type: trackingEventModalType,
        source: trackingEventModalSource,
        eventGroupUuid: modalUuid,
        ...allowlistedTrackingEventProps,
        ...(additionalProps || {}),
      });
    },
    [
      allowlistedTrackingEventProps,
      modalUuid,
      trackingEventModalSource,
      trackingEventModalType,
    ],
  );

  const sendTrackingEventRef = useRef(sendTrackingEvent);

  useEffect(() => {
    sendTrackingEventRef.current = sendTrackingEvent;
  }, [sendTrackingEvent]);

  useEffect(() => {
    if (open) {
      sendTrackingEventRef.current("modal-open");
    }
  }, [open]);

  return sendTrackingEvent;
}
