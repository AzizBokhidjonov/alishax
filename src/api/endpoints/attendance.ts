import { api, type QueryParams } from "../http";
import { toPage } from "../types";
import {
  normalizeAttendance,
  normalizeAttendanceBoard,
  type AttendanceResponse,
  type AttendanceBoardResponse,
} from "../adapters/attendance";
import type {
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

const normalizeRows = (rows: AttendanceResponse[]) => rows.map(normalizeAttendance);

export const attendanceApi = {
  // Yozuvsiz bolalar ham qaytadi; null davomat «hali belgilanmagan» degani.
  board: (params: { groupId?: string; branchId?: string } = {}) =>
    api
      .get<AttendanceBoardResponse>("/attendance/board", params as QueryParams)
      .then(normalizeAttendanceBoard),

  today: (params: { groupId?: string; branchId?: string } = {}) =>
    api.get<AttendanceResponse[]>("/attendance/today", params as QueryParams).then(normalizeRows),

  async list(params: AttendanceListParams = {}): Promise<Paginated<AttendanceRecord>> {
    const response = await api.get<Paginated<AttendanceResponse> | AttendanceResponse[]>(
      "/attendance",
      params as QueryParams,
    );
    const page = toPage(response);
    return { ...page, data: normalizeRows(page.data) };
  },

  inside: () => api.get<AttendanceResponse[]>("/attendance/inside").then(normalizeRows),
  absent: (date: string) =>
    api.get<AttendanceResponse[]>("/attendance/absent", { date }).then(normalizeRows),
  notPickedUp: () => api.get<AttendanceResponse[]>("/attendance/not-picked-up").then(normalizeRows),

  calendar: (childId: Id, year: number, month: number) =>
    api
      .get<AttendanceResponse[]>("/attendance/calendar", { childId, year, month })
      .then(normalizeRows),
  summary: (params: { groupId?: string; from?: string; to?: string }) =>
    api.get<AttendanceSummaryRow[]>("/attendance/summary", params as QueryParams),

  checkIn: (dto: CheckInDto) =>
    api.post<AttendanceResponse>("/attendance/check-in", dto).then(normalizeAttendance),
  checkOut: (dto: CheckOutDto) =>
    api.post<AttendanceResponse>("/attendance/check-out", dto).then(normalizeAttendance),
  setStatus: (dto: SetAttendanceStatusDto) =>
    api.post<AttendanceResponse>("/attendance/status", dto).then(normalizeAttendance),

  correct: (id: Id, dto: CorrectAttendanceDto) =>
    api.post<AttendanceResponse>(`/attendance/${id}/correct`, dto).then(normalizeAttendance),
  corrections: (params: { from?: string; to?: string; userId?: string } = {}) =>
    api.get<AttendanceCorrection[]>("/attendance/corrections", params as QueryParams),
};
