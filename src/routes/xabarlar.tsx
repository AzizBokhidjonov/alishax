import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementsPage } from "@/features/comms/AnnouncementsPage";

export const Route = createFileRoute("/xabarlar")({
  head: () => ({ meta: [{ title: "E'lonlar — Alishax Kids" }] }),
  component: AnnouncementsPage,
});
