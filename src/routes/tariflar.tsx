import { createFileRoute } from "@tanstack/react-router";
import { TariffsPage } from "@/features/finance/TariffsPage";

export const Route = createFileRoute("/tariflar")({
  head: () => ({ meta: [{ title: "Tariflar — Alishax Kids" }] }),
  component: TariffsPage,
});
