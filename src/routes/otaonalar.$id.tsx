import { createFileRoute } from "@tanstack/react-router";
import { GuardianDetailPage } from "@/features/guardians/GuardianDetailPage";

export const Route = createFileRoute("/otaonalar/$id")({
  head: () => ({ meta: [{ title: "Ota-ona — Alishax Kids" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <GuardianDetailPage guardianId={id} />;
}
