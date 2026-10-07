import { createFileRoute } from "@tanstack/react-router";
import { GuidePage } from "@/features/guide/GuidePage";

export const Route = createFileRoute("/qollanma")({
  head: () => ({
    meta: [
      { title: "Instruksiya — Alishax Kids" },
      {
        name: "description",
        content:
          "Har bir rol nima qila oladi va buni qanday bajaradi — ish tartibi bo'yicha qo'llanma.",
      },
    ],
  }),
  component: GuidePage,
});
