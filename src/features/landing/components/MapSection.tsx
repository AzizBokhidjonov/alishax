import { useTranslation } from "react-i18next";
import { cn, focusRing } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { MAP_EMBED, YANDEX } from "../constants";
import { Reveal } from "./Reveal";
import { Socials } from "./Socials";

export function MapSection() {
  const { t } = useTranslation();
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Reveal>
          <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-lg">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_1.4fr]">
              <div className="p-6 md:p-8">
                <span className="text-sm font-bold uppercase tracking-widest text-berry-ink">
                  {t("landing.address")}
                </span>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
                  {t("landing.mapTitle")}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">{t("landing.mapText")}</p>
                <a
                  href={YANDEX}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg",
                    focusRing,
                  )}
                >
                  <MapPin className="h-4 w-4" /> {t("landing.openMap")}
                </a>
                <div className="mt-6">
                  <Socials />
                </div>
              </div>
              <iframe
                src={MAP_EMBED}
                title={t("landing.mapAlt")}
                loading="lazy"
                className="h-[320px] w-full border-0 lg:h-full"
                allowFullScreen
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
