import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { truncateString } from "shared/util";
import track, { TrackEventProps } from "@/services/track";

export const useModalTracking = (
  trackingEventModalType: string,
  trackingEventModalSource?: string,
  allowlistedTrackingEventProps: TrackEventProps = {},
  modalUuid?: string,
  trackOnSubmit = true,
  open?: boolean,
) => {
  const [currentModalUuid] = useState(modalUuid || uuidv4());

  const sendTrackingEvent = useCallback(
    (eventName: string, additionalProps?: Record<string, unknown>) => {
      if (trackingEventModalType === "") {
        return;
      }
      track(eventName, {
        type: trackingEventModalType,
        source: trackingEventModalSource,
        eventGroupUuid: currentModalUuid,
        ...allowlistedTrackingEventProps,
        ...(additionalProps || {}),
      });
    },
    [
      trackingEventModalType,
      trackingEventModalSource,
      allowlistedTrackingEventProps,
      currentModalUuid,
    ],
  );

  useEffect(() => {
    if (open) {
      sendTrackingEvent("modal-open");
    }
  }, [open, sendTrackingEvent]);

  const trackSubmitSuccess = useCallback(() => {
    if (trackOnSubmit) {
      sendTrackingEvent("modal-submit-success");
    }
  }, [trackOnSubmit, sendTrackingEvent]);

  const trackSubmitError = useCallback(
    (errorMessage: string) => {
      if (trackOnSubmit) {
        sendTrackingEvent("modal-submit-error", {
          error: truncateString(errorMessage, 32),
        });
      }
    },
    [trackOnSubmit, sendTrackingEvent],
  );

  return {
    modalUuid: currentModalUuid,
    sendTrackingEvent,
    trackSubmitSuccess,
    trackSubmitError,
  };
};
