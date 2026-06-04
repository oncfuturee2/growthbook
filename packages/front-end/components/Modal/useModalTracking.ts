import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import track, { TrackEventProps } from "@/services/track";

type UseModalTrackingProps = {
  trackingEventModalType: string;
  trackingEventModalSource?: string;
  allowlistedTrackingEventProps?: TrackEventProps;
  modalUuid?: string;
};

export function useModalTracking({
  trackingEventModalType,
  trackingEventModalSource,
  allowlistedTrackingEventProps = {},
  modalUuid: _modalUuid,
}: UseModalTrackingProps) {
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
    ],
  );

  return { modalUuid, sendTrackingEvent };
}
