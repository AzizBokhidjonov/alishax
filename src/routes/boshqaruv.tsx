import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

export const Route = createFileRoute("/boshqaruv")({
  head: () => ({ meta: [{ title: "Bosh sahifa — Alishax Kids" }] }),
  component: DashboardPage,
});
