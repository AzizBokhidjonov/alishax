import { createFileRoute } from "@tanstack/react-router";
import { validateListSearch } from "@/config/list-search";
import { GuardiansPage } from "@/features/guardians/GuardiansPage";

export const Route = createFileRoute("/otaonalar")({
  // Filtr va sahifa manzilda saqlanadi — F5 va havola ishlashi uchun (§2.8).
  validateSearch: validateListSearch,
  head: () => ({ meta: [{ title: "Ota-onalar — Alishax Kids" }] }),
  component: GuardiansPage,
});
