import { api, type QueryParams } from "../http";
import { toPage } from "../types";
import type {
  AttendanceCalendarDay,
  AttendanceCorrection,
  AttendanceRecord,
  AttendanceSummaryRow,
  CheckInDto,
  CheckOutDto,
  CorrectAttendanceDto,
  Id,
  ListParams,
  Paginated,
  SetAttendanceStatusDto,
} from "../types";

export interface AttendanceListParams extends ListParams {
  date?: string;
  groupId?: string;
  childId?: string;
  from?: string;
  to?: string;
  status?: string;
}

export const attendanceApi = {
  today: (params: { groupId?: string; branchId?: string } = {}) =>
    api.get<AttendanceRecord[]>("/attendance/today", params as QueryParams),

  async list(params: AttendanceListParams = {}): Promise<Paginated<AttendanceRecord>> {
    const response = await api.get<Paginated<AttendanceRecord> | AttendanceRecord[]>(
      "/attendance",
      params as QueryParams,
    );
    return toPage(response);
  },

  inside: () => api.get<AttendanceRecord[]>("/attendance/inside"),
  absent: (date: string) => api.get<AttendanceRecord[]>("/attendance/absent", { date }),
  notPickedUp: () => api.get<AttendanceRecord[]>("/attendance/not-picked-up"),

  calendar: (childId: Id, year: number, month: number) =>
    api.get<AttendanceCalendarDay[]>("/attendance/calendar", { childId, year, month }),
  summary: (params: { groupId?: string; from?: string; to?: string }) =>
    api.get<AttendanceSummaryRow[]>("/attendance/summary", params as QueryParams),

  checkIn: (dto: CheckInDto) => api.post<AttendanceRecord>("/attendance/check-in", dto),
  checkOut: (dto: CheckOutDto) => api.post<AttendanceRecord>("/attendance/check-out", dto),
  setStatus: (dto: SetAttendanceStatusDto) => api.post<AttendanceRecord>("/attendance/status", dto),

  correct: (id: Id, dto: CorrectAttendanceDto) =>
    api.post<AttendanceRecord>(`/attendance/${id}/correct`, dto),
  corrections: (params: { from?: string; to?: string; userId?: string } = {}) =>
    api.get<AttendanceCorrection[]>("/attendance/corrections", params as QueryParams),
};
