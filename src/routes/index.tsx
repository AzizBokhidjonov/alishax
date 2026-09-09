import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/features/landing/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alishax Kids — Toshkentdagi zamonaviy xususiy bog'cha" },
      {
        name: "description",
        content:
          "Alishax Kids bog'chasi: 1,5 yoshdan 7 yoshgacha qabul. Ingliz va rus tili, matematika, logopediya, karate, kuniga 5 mahal ovqat.",
      },
      { property: "og:title", content: "Alishax Kids bog'chasi" },
      {
        property: "og:description",
        content:
          "1,5 yoshdan 7 yoshgacha bolalar qabul. Xavfsiz muhit, ijodiy mashg'ulotlar va onlayn davomat nazorati.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});
