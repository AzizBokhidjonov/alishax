import { createFileRoute } from "@tanstack/react-router";
import { validateListSearch } from "@/config/list-search";
import { ExpensesPage } from "@/features/expenses/ExpensesPage";

export const Route = createFileRoute("/xarajatlar")({
  // Filtr va sahifa manzilda saqlanadi — F5 va havola ishlashi uchun (§2.8).
  validateSearch: validateListSearch,
  head: () => ({ meta: [{ title: "Xarajatlar — Alishax Kids" }] }),
  component: ExpensesPage,
});
