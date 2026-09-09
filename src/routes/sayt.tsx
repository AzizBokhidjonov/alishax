import { createFileRoute } from "@tanstack/react-router";
import { WebsitePage } from "@/features/website/WebsitePage";

export const Route = createFileRoute("/sayt")({
  head: () => ({ meta: [{ title: "Sayt — Alishax Kids" }] }),
  component: WebsitePage,
});
