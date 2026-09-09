import { createFileRoute } from "@tanstack/react-router";
import { validateListSearch } from "@/config/list-search";
import { ReportsPage } from "@/features/reports/ReportsPage";

export const Route = createFileRoute("/hisobotlar")({
  // Filtr va sahifa manzilda saqlanadi — F5 va havola ishlashi uchun (§2.8).
  validateSearch: validateListSearch,
  head: () => ({ meta: [{ title: "Hisobotlar — Alishax Kids" }] }),
  component: ReportsPage,
});
