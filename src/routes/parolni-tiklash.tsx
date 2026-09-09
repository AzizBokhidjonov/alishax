import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";

export const Route = createFileRoute("/parolni-tiklash")({
  head: () => ({ meta: [{ title: "Parolni tiklash — Alishax Kids" }] }),
  component: ResetPasswordPage,
});
