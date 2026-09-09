import { createFileRoute } from "@tanstack/react-router";
import { BillingPage } from "@/features/finance/BillingPage";

export const Route = createFileRoute("/hisoblash")({
  head: () => ({ meta: [{ title: "Hisoblash — Alishax Kids" }] }),
  component: BillingPage,
});
