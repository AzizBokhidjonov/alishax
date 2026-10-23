import type { AttendanceBoard, AttendanceBoardItem, AttendanceRecord } from "../types";

interface ChildResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  photoFileId?: string;
  groupAssignment?: { groupId: string; childGroup: { name: string } }[];
}

export interface AttendanceResponse extends Omit<AttendanceRecord, "date" | "groupId"> {
  attendanceDate: string;
  groupId?: string | null;
  child?: ChildResponse;
}

export interface AttendanceBoardResponse {
  date: string;
  data: {
    child: ChildResponse;
    attendance: AttendanceResponse | null;
    recorded?: boolean;
  }[];
}

export function normalizeAttendance(row: AttendanceResponse): AttendanceRecord {
  return {
    ...row,
    // Postgres DATE qiymati brauzer vaqt mintaqasiga o'tkazilmaydi.
    date: row.attendanceDate.slice(0, 10),
    groupId: row.groupId ?? undefined,
    childName: row.child
      ? [row.child.lastName, row.child.firstName].filter(Boolean).join(" ")
      : row.childName,
  };
}

export function normalizeAttendanceBoard(response: AttendanceBoardResponse): AttendanceBoard {
  return {
    date: response.date,
    data: response.data.map((item): AttendanceBoardItem => {
      const assignment = item.child.groupAssignment?.[0];
      return {
        ...item,
        child: {
          ...item.child,
          groupId: assignment?.groupId,
          groupName: assignment?.childGroup.name,
        },
        attendance: item.attendance ? normalizeAttendance(item.attendance) : null,
      };
    }),
  };
}
