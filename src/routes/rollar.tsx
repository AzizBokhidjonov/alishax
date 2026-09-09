import { createFileRoute } from "@tanstack/react-router";
import { RolesPage } from "@/features/users/RolesPage";

export const Route = createFileRoute("/rollar")({
  head: () => ({ meta: [{ title: "Rollar va ruxsatlar — Alishax Kids" }] }),
  component: RolesPage,
});
