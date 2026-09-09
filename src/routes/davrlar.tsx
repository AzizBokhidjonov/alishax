import { createFileRoute } from "@tanstack/react-router";
import { PeriodsPage } from "@/features/finance/PeriodsPage";

export const Route = createFileRoute("/davrlar")({
  head: () => ({ meta: [{ title: "Hisob davrlari — Alishax Kids" }] }),
  component: PeriodsPage,
});
