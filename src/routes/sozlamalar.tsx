import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/settings/SettingsPage";

export const Route = createFileRoute("/sozlamalar")({
  head: () => ({ meta: [{ title: "Sozlamalar — Alishax Kids" }] }),
  component: SettingsPage,
});
