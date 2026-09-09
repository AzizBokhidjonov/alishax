import { createFileRoute } from "@tanstack/react-router";
import { validateListSearch } from "@/config/list-search";
import { AuditPage } from "@/features/audit/AuditPage";

export const Route = createFileRoute("/audit")({
  // Filtr va sahifa manzilda saqlanadi — F5 va havola ishlashi uchun (§2.8).
  validateSearch: validateListSearch,
  head: () => ({ meta: [{ title: "Audit jurnali — Alishax Kids" }] }),
  component: AuditPage,
});
