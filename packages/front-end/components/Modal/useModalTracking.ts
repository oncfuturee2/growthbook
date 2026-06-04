import { useEffect, useCallback } from "react";
import track, { TrackEventProps } from "@/services/track";

export function useModalTracking({
  trackingEventModalType,
  trackingEventModalSource,
  allowlistedTrackingEventProps,
  modalUuid,
  open,
}: {
  trackingEventModalType: string;
  trackingEventModalSource?: string;
  allowlistedTrackingEventProps: TrackEventProps;
  modalUuid: string;
  open: boolean;
}) {
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
    ],
  );

  useEffect(() => {
    if (open) {
      sendTrackingEvent("modal-open");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return sendTrackingEvent;
}