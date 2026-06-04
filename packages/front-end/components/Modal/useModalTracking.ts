import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import track, { TrackEventProps } from "@/services/track";

export function useModalTracking({
  trackingEventModalType,
  trackingEventModalSource,
  allowlistedTrackingEventProps = {},
  modalUuid: _modalUuid,
  open,
}: {
  trackingEventModalType: string;
  trackingEventModalSource?: string;
  allowlistedTrackingEventProps?: TrackEventProps;
  modalUuid?: string;
  open: boolean;
}) {
  const [modalUuid] = useState(_modalUuid || uuidv4());

  const sendTrackingEvent = useCallback(
    (eventName: string, additionalProps?: Record<string, unknown>) => {
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
      trackingEventModalType,
      trackingEventModalSource,
      allowlistedTrackingEventProps,
      modalUuid,
    ]
  );

  useEffect(() => {
    if (open) {
      sendTrackingEvent("modal-open");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { sendTrackingEvent };
}
