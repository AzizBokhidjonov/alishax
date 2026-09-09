import { cn, focusRing } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Clock, Instagram, LogIn, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INSTAGRAM, PHONE, PHONE_HREF, TELEGRAM, YANDEX } from "../constants";
import { Reveal } from "./Reveal";

const CONTACT_LINK_CLASS = cn(
  "flex items-center gap-3 rounded-sm transition-transform hover:translate-x-1",
  focusRing,
);

export function ContactSection() {
  return (
    <section id="aloqa" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-brand p-8 text-brand-foreground shadow-xl md:p-12">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 animate-[blob_16s_ease-in-out_infinite] rounded-full bg-berry/25 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 left-10 h-56 w-56 animate-[blob_20s_ease-in-out_infinite_reverse] rounded-full bg-sky/30 blur-3xl" />

            <div className="relative grid items-center gap-8 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                  Bugun tashrif buyuring
                </h2>
                <p className="mt-3 text-brand-foreground/90">
                  Bog'chani o'z ko'zingiz bilan ko'ring, tarbiyachilar bilan tanishing va
                  savollaringizga javob oling.
                </p>

                <div className="mt-6 space-y-3 text-sm font-semibold">
                  <a href={PHONE_HREF} className={CONTACT_LINK_CLASS}>
                    <Phone className="h-5 w-5 shrink-0" /> {PHONE}
                  </a>
                  <a
                    href={TELEGRAM}
                    target="_blank"
                    rel="noreferrer"
                    className={CONTACT_LINK_CLASS}
                  >
                    <Send className="h-5 w-5 shrink-0" /> t.me/alishax_kids_uz
                  </a>
                  <a
                    href={INSTAGRAM}
                    target="_blank"
                    rel="noreferrer"
                    className={CONTACT_LINK_CLASS}
                  >
                    <Instagram className="h-5 w-5 shrink-0" /> alishax.kids
                  </a>
                  <a href={YANDEX} target="_blank" rel="noreferrer" className={CONTACT_LINK_CLASS}>
                    <MapPin className="h-5 w-5 shrink-0" /> Toshkent sh. — Yandex xarita
                  </a>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 shrink-0" /> Dushanba–Shanba, 07:30 – 19:00
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-card p-6 text-card-foreground shadow-lg">
                <h3 className="text-lg font-bold">Xodimlar uchun</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Boshqaruv tizimiga faqat login va parol bilan kiriladi: davomat, to'lovlar,
                  guruhlar va hisobotlar.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="mt-5 w-full rounded-full bg-brand text-brand-foreground transition-all hover:-translate-y-0.5 hover:bg-brand/90"
                >
                  <Link to="/kirish">
                    <LogIn className="mr-2 h-4 w-4" /> Adminkaga kirish
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
