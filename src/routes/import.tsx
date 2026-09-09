import { createFileRoute } from "@tanstack/react-router";
import { ImportsPage } from "@/features/imports/ImportsPage";

export const Route = createFileRoute("/import")({
  head: () => ({ meta: [{ title: "Import — Alishax Kids" }] }),
  component: ImportsPage,
});
