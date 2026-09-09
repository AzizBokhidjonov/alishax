import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/LoginPage";

export const Route = createFileRoute("/kirish")({
  head: () => ({
    meta: [
      { title: "Tizimga kirish — Alishax Kids" },
      {
        name: "description",
        content: "Bog'cha xodimlari uchun boshqaruv tizimiga login va parol orqali kirish.",
      },
      { property: "og:title", content: "Tizimga kirish — Alishax Kids" },
      { property: "og:description", content: "Xodimlar uchun boshqaruv paneliga kirish sahifasi." },
    ],
  }),
  component: LoginPage,
});
