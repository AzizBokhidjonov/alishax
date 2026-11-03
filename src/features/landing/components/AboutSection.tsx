import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import aboutImg from "@/assets/landing-about.jpg";
import { HIGHLIGHTS } from "../constants";
import { Reveal } from "./Reveal";
import { Socials } from "./Socials";

export function AboutSection() {
  const { t } = useTranslation();
  return (
    <section id="biz-haqimizda" className="bg-card py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:px-6 lg:grid-cols-2">
        <Reveal className="relative">
          <img
            src={aboutImg}
            loading="lazy"
            width={1024}
            height={768}
            alt={t("landing.aboutAlt")}
            className="w-full rounded-[2rem] object-cover shadow-lg transition-transform duration-500 hover:-rotate-1 hover:scale-[1.02]"
          />
          <div className="absolute -bottom-6 -right-3 hidden animate-[float_7s_ease-in-out_infinite] rounded-2xl bg-brand px-5 py-4 text-brand-foreground shadow-lg sm:block">
            <div className="text-2xl font-extrabold">1:8</div>
            <div className="text-xs opacity-90">{t("landing.ratio")}</div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <span className="text-sm font-bold uppercase tracking-widest text-berry-ink">
            {t("landing.about")}
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            {t("landing.aboutTitle")}
          </h2>
          <p className="mt-4 text-muted-foreground">{t("landing.aboutText")}</p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {HIGHLIGHTS.map((item, index) => (
              <li
                key={item}
                style={{ transitionDelay: `${index * 60}ms` }}
                className="flex items-start gap-2 rounded-xl bg-secondary/60 px-3 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:bg-brand/15"
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                {t(item)}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Button
              asChild
              className="rounded-full bg-brand text-brand-foreground transition-all hover:-translate-y-0.5 hover:bg-brand/90"
            >
              <a href="#aloqa">{t("landing.introLesson")}</a>
            </Button>
            <Socials />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
