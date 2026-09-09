import { createFileRoute } from "@tanstack/react-router";
import { UserDetailPage } from "@/features/users/UserDetailPage";

export const Route = createFileRoute("/xodimlar/$id")({
  head: () => ({ meta: [{ title: "Xodim — Alishax Kids" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <UserDetailPage userId={id} />;
}
