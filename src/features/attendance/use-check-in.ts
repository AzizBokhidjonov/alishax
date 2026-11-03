import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { isApiError } from "@/api";
import { useErrorToast } from "@/lib/query";
import { patchBoard, applyRecord, restoreBoard } from "./board-cache";
import {
  checkInQueueGeneration,
  enqueueCheckIn,
  isRetryable,
  setCheckInQueueHandlers,
  submitCheckIn,
} from "./checkin-queue";

type Arrival = { childId: string; at?: string };

export function useCheckIn() {
  const { t } = useTranslation();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const prepared = useRef(new WeakMap<Arrival, number>());

  useEffect(() => {
    setCheckInQueueHandlers({
      onSettled: () => void queryClient.invalidateQueries({ queryKey: ["attendance"] }),
    });
    return () => setCheckInQueueHandlers({});
  }, [queryClient]);

  return useMutation({
    mutationFn: (dto: Arrival) => submitCheckIn(dto, prepared.current.get(dto)),
    onMutate: async (dto: Arrival) => {
      const generation = checkInQueueGeneration();
      prepared.current.set(dto, generation);
      const item = enqueueCheckIn(dto.childId, dto.at);
      await queryClient.cancelQueries({ queryKey: ["attendance", "board"] });
      if (generation !== checkInQueueGeneration()) return { generation };
      return {
        generation,
        snapshot: patchBoard(queryClient, dto.childId, {
          checkInAt: item.at,
          status: "present",
        }),
      };
    },
    onSuccess: (record, _dto, context) => {
      if (context?.generation === checkInQueueGeneration()) applyRecord(queryClient, record);
    },
    onError: (error, _dto, context) => {
      if (context?.generation !== checkInQueueGeneration()) return;
      if (isApiError(error) && error.code === "ALREADY_CHECKED_IN") {
        toast.info(t("attendance.alreadyCheckedIn"));
      } else if (isRetryable(error)) {
        toast.info(t("attendance.offlineHint"), { id: "checkin-queue" });
      } else {
        restoreBoard(queryClient, context?.snapshot);
        showError(error);
      }
    },
    onSettled: (_record, _error, _dto, context) => {
      if (context?.generation === checkInQueueGeneration()) {
        void queryClient.invalidateQueries({ queryKey: ["attendance"], type: "active" });
      }
    },
  });
}
