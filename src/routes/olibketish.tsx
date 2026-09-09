import { createFileRoute } from "@tanstack/react-router";
import { PickupPage } from "@/features/pickup/PickupPage";

export const Route = createFileRoute("/olibketish")({
  head: () => ({ meta: [{ title: "Olib ketish nazorati — Alishax Kids" }] }),
  component: PickupPage,
});
