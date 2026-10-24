import { createFileRoute } from "@tanstack/react-router";
import { validateListSearch } from "@/config/list-search";
import { UsersPage } from "@/features/users/UsersPage";

export const Route = createFileRoute("/xodimlar/")({
  // Filtr va sahifa manzilda saqlanadi — F5 va havola ishlashi uchun (§2.8).
  validateSearch: validateListSearch,
  head: () => ({ meta: [{ title: "Xodimlar — Alishax Kids" }] }),
  component: UsersPage,
});
