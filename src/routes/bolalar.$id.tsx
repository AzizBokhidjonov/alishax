import { createFileRoute } from "@tanstack/react-router";
import { validateListSearch } from "@/config/list-search";
import { ChildDetailPage } from "@/features/children/ChildDetailPage";

export const Route = createFileRoute("/bolalar/$id")({
  validateSearch: validateListSearch,
  head: () => ({ meta: [{ title: "Bola profili — Alishax Kids" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <ChildDetailPage childId={id} />;
}
