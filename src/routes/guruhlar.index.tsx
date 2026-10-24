import { createFileRoute } from "@tanstack/react-router";
import { GroupsPage } from "@/features/groups/GroupsPage";

export const Route = createFileRoute("/guruhlar/")({
  head: () => ({ meta: [{ title: "Guruhlar — Alishax Kids" }] }),
  component: GroupsPage,
});
