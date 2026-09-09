import { createFileRoute } from "@tanstack/react-router";
import { AttendancePage } from "@/features/attendance/AttendancePage";

export const Route = createFileRoute("/davomat")({
  head: () => ({ meta: [{ title: "Davomat — Alishax Kids" }] }),
  component: AttendancePage,
});
