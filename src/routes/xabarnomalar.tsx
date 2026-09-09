import { createFileRoute } from "@tanstack/react-router";
import { validateListSearch } from "@/config/list-search";
import { NotificationsPage } from "@/features/comms/NotificationsPage";

export const Route = createFileRoute("/xabarnomalar")({
  // Filtr va sahifa manzilda saqlanadi — F5 va havola ishlashi uchun (§2.8).
  validateSearch: validateListSearch,
  head: () => ({ meta: [{ title: "Xabarnomalar — Alishax Kids" }] }),
  component: NotificationsPage,
});
