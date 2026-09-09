import { ArrowRight, Phone, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/landing-hero.jpg";
import { MARQUEE_ITEMS, PHONE, PHONE_HREF, STATS } from "../constants";

/** Bo'limlar orasidagi to'lqinli ajratgich. */
export function Wave({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("block h-[60px] w-full", className)}
    >
      <path
        d="M0,40 C240,90 480,0 720,30 C960,60 1200,90 1440,45 L1440,90 L0,90 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function HeroSection() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(1100px_520px_at_80%_-10%,var(--brand-soft),transparent)]" />
      <div className="absolute left-[-6%] top-10 -z-10 h-64 w-64 animate-[blob_14s_ease-in-out_infinite] rounded-full bg-sky/25 blur-3xl" />
      <div className="absolute right-[-4%] top-40 -z-10 h-72 w-72 animate-[blob_18s_ease-in-out_infinite_reverse] rounded-full bg-berry/20 blur-3xl" />
      <div className="absolute left-[6%] top-24 -z-10 h-24 w-24 animate-[float_7s_ease-in-out_infinite] rounded-full border-2 border-brand/40" />
      <div className="absolute bottom-16 right-[10%] -z-10 h-16 w-16 animate-[float_9s_ease-in-out_infinite] rounded-full bg-sun/40" />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:px-6 md:py-20 lg:grid-cols-2">
        <div className="animate-[pop-in_0.7s_ease-out_both]">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand/20 px-4 py-1.5 text-sm font-bold text-brand-foreground">
            <Sparkles className="h-4 w-4 animate-[wiggle_2.5s_ease-in-out_infinite]" /> 1,5 yoshdan
            7 yoshgacha qabul
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Farzandingiz{" "}
            <span className="animate-[shine_6s_linear_infinite] bg-[linear-gradient(90deg,var(--brand),var(--berry),var(--sky),var(--brand))] bg-[length:200%_auto] bg-clip-text text-transparent">
              gullab-yashnaydigan
            </span>{" "}
            joy
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Alishax Kids — mehribon tarbiyachilar, xavfsiz hovli, kuniga 5 mahal ovqat va har kuni
            yangi kashfiyot. Davomat, to'lovlar va olib ketish nazorati esa raqamli tizimda.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-brand text-brand-foreground shadow-md transition-all hover:-translate-y-1 hover:bg-brand/90 hover:shadow-xl"
            >
              <a href="#aloqa">
                Tashrif buyurish <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-berry-ink/60 text-berry-ink transition-all hover:-translate-y-1 hover:bg-berry/10"
            >
              <a href={PHONE_HREF}>
                <Phone className="mr-2 h-4 w-4" />
                {PHONE}
              </a>
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((stat, index) => (
              <div
                key={stat.label}
                style={{ animationDelay: `${150 * index}ms` }}
                className="animate-[pop-in_0.6s_ease-out_both] rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform hover:-translate-y-1.5"
              >
                {/*
                  `text-brand` (amber) oq kartada 1.77:1 edi — raqamlar
                  deyarli ko'rinmasdi. `brand-ink` — o'sha amberning matn
                  uchun to'q varianti, 5:1 dan yuqori.
                */}
                <div className="text-2xl font-extrabold text-brand-ink">{stat.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-[pop-in_0.9s_ease-out_both]">
          <div className="absolute -inset-4 -z-10 rotate-3 animate-[float_10s_ease-in-out_infinite] rounded-[3rem] bg-brand/15" />
          <img
            src={heroImg}
            width={1024}
            height={1024}
            alt="Bog'chada rangli kubiklar bilan o'ynayotgan quvnoq bola"
            className="aspect-square w-full rounded-[2.5rem] object-cover shadow-xl transition-transform duration-500 hover:scale-[1.02]"
          />
          <div className="absolute -bottom-5 -left-2 animate-[float_6s_ease-in-out_infinite] rounded-2xl border border-border bg-card px-4 py-3 shadow-lg sm:left-6">
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-sun text-sun" />
                ))}
              </div>
              <span className="text-sm font-semibold">4.9 / 5</span>
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">180+ ota-ona bahosi</div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden border-y border-border bg-brand py-3 text-brand-foreground">
        <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-8 pr-8">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="flex items-center gap-3 text-sm font-extrabold uppercase tracking-wide"
            >
              <Sparkles className="h-4 w-4" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="text-card">
        <Wave />
      </div>
    </section>
  );
}
