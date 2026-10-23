import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/api";
import type { AttendanceListParams } from "@/api/endpoints/attendance";
import { ATTENDANCE_POLL_MS } from "@/config/constants";
import { qk } from "@/lib/query";

export function useAttendanceToday(params: { groupId?: string; branchId?: string }) {
  return useQuery({
    queryKey: qk.attendanceToday(params),
    queryFn: () => attendanceApi.today(params),
    // SSE yo'q — taxta 25 soniyada va oynaga qaytilganda yangilanadi (§5.1).
    refetchInterval: ATTENDANCE_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useAttendanceList(params: AttendanceListParams) {
  return useQuery({
    queryKey: qk.attendance(params),
    queryFn: () => attendanceApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useInside(enabled = true) {
  return useQuery({
    queryKey: qk.attendanceInside,
    queryFn: () => attendanceApi.inside(),
    enabled,
    refetchInterval: ATTENDANCE_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useAbsent(date: string) {
  return useQuery({
    queryKey: qk.attendanceAbsent(date),
    queryFn: () => attendanceApi.absent(date),
  });
}

export function useNotPickedUp() {
  return useQuery({
    queryKey: qk.attendanceNotPickedUp,
    queryFn: () => attendanceApi.notPickedUp(),
    refetchInterval: ATTENDANCE_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useAttendanceCalendar(childId: string, year: number, month: number) {
  return useQuery({
    queryKey: qk.attendanceCalendar({ childId, year, month }),
    queryFn: () => attendanceApi.calendar(childId, year, month),
    enabled: Boolean(childId),
  });
}

export function useAttendanceSummary(params: { groupId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: qk.attendanceSummary(params),
    queryFn: () => attendanceApi.summary(params),
  });
}

export function useCorrections(params: { from?: string; to?: string; userId?: string }) {
  return useQuery({
    queryKey: qk.attendanceCorrections(params),
    queryFn: () => attendanceApi.corrections(params),
  });
}
