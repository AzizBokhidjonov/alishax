import { createFileRoute } from "@tanstack/react-router";
import { InsidePage } from "@/features/attendance/InsidePage";

export const Route = createFileRoute("/ichkarida")({
  head: () => ({ meta: [{ title: "Kim ichkarida — Alishax Kids" }] }),
  component: InsidePage,
});
