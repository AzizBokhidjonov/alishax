import { createFileRoute } from "@tanstack/react-router";
import { validateListSearch } from "@/config/list-search";
import { DebtsPage } from "@/features/finance/DebtsPage";

export const Route = createFileRoute("/qarzlar")({
  // Filtr va sahifa manzilda saqlanadi — F5 va havola ishlashi uchun (§2.8).
  validateSearch: validateListSearch,
  head: () => ({ meta: [{ title: "Qarzdorliklar — Alishax Kids" }] }),
  component: DebtsPage,
});
