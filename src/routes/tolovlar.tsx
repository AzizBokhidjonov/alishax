import { createFileRoute } from "@tanstack/react-router";
import { validateListSearch } from "@/config/list-search";
import { PaymentsPage } from "@/features/finance/PaymentsPage";

export const Route = createFileRoute("/tolovlar")({
  // Filtr va sahifa manzilda saqlanadi — F5 va havola ishlashi uchun (§2.8).
  validateSearch: validateListSearch,
  head: () => ({ meta: [{ title: "To'lovlar — Alishax Kids" }] }),
  component: PaymentsPage,
});
