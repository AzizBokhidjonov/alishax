import { useTranslation } from "react-i18next";
import { cn, focusRing } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Clock, Instagram, LogIn, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INSTAGRAM, PHONE, PHONE_HREF, TELEGRAM, YANDEX } from "../constants";
import { Reveal } from "./Reveal";

const CONTACT_LINK_CLASS = cn(
  "flex min-w-0 items-center gap-3 rounded-sm transition-transform hover:translate-x-1 [&>span]:min-w-0 [&>span]:[overflow-wrap:anywhere]",
  focusRing,
);

export function ContactSection() {
  const { t } = useTranslation();
  return (
    <section id="aloqa" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-brand p-5 text-brand-foreground shadow-xl sm:p-8 md:p-12">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 animate-[blob_16s_ease-in-out_infinite] rounded-full bg-berry/25 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 left-10 h-56 w-56 animate-[blob_20s_ease-in-out_infinite_reverse] rounded-full bg-sky/30 blur-3xl" />

            <div className="relative grid min-w-0 items-center gap-8 lg:grid-cols-2">
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                  {t("landing.contactTitle")}
                </h2>
                <p className="mt-3 text-brand-foreground/90">{t("landing.contactText")}</p>

                <div className="mt-6 space-y-3 text-sm font-semibold">
                  <a href={PHONE_HREF} className={CONTACT_LINK_CLASS}>
                    <Phone className="h-5 w-5 shrink-0" /> <span>{PHONE}</span>
                  </a>
                  <a
                    href={TELEGRAM}
                    target="_blank"
                    rel="noreferrer"
                    className={CONTACT_LINK_CLASS}
                  >
                    <Send className="h-5 w-5 shrink-0" /> <span>t.me/alishax_kids_uz</span>
                  </a>
                  <a
                    href={INSTAGRAM}
                    target="_blank"
                    rel="noreferrer"
                    className={CONTACT_LINK_CLASS}
                  >
                    <Instagram className="h-5 w-5 shrink-0" /> <span>alishax.kids</span>
                  </a>
                  <a href={YANDEX} target="_blank" rel="noreferrer" className={CONTACT_LINK_CLASS}>
                    <MapPin className="h-5 w-5 shrink-0" /> <span>{t("landing.mapLink")}</span>
                  </a>
                  <div className="flex min-w-0 items-center gap-3">
                    <Clock className="h-5 w-5 shrink-0" />{" "}
                    <span className="min-w-0">{t("landing.hours")}</span>
                  </div>
                </div>
              </div>

              <div className="min-w-0 rounded-3xl bg-card p-5 text-card-foreground shadow-lg [overflow-wrap:anywhere] sm:p-6">
                <h3 className="text-lg font-bold">{t("landing.staff")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t("landing.staffText")}</p>
                <Button
                  asChild
                  size="lg"
                  className="mt-5 h-auto min-h-11 w-full whitespace-normal rounded-full bg-brand py-3 text-center text-brand-foreground transition-all hover:-translate-y-0.5 hover:bg-brand/90"
                >
                  <Link to="/kirish">
                    <LogIn className="mr-2 h-4 w-4" /> {t("landing.staffLogin")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
