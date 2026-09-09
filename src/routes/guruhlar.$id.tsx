import { createFileRoute } from "@tanstack/react-router";
import { GroupDetailPage } from "@/features/groups/GroupDetailPage";

export const Route = createFileRoute("/guruhlar/$id")({
  head: () => ({ meta: [{ title: "Guruh — Alishax Kids" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <GroupDetailPage groupId={id} />;
}
