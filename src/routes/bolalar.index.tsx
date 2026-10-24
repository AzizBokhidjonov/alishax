import { createFileRoute } from "@tanstack/react-router";
import { validateListSearch } from "@/config/list-search";
import { ChildrenPage } from "@/features/children/ChildrenPage";

export const Route = createFileRoute("/bolalar/")({
  // Filtr va sahifa manzilda saqlanadi — F5 va havola ishlashi uchun (§2.8).
  validateSearch: validateListSearch,
  head: () => ({ meta: [{ title: "Bolalar bazasi — Alishax Kids" }] }),
  component: ChildrenPage,
});
