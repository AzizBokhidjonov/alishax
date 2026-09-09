import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LogIn, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, focusRing } from "@/lib/utils";
import logo from "@/assets/logo-alishax.png";
import { NAV_ANCHORS, type NavAnchor } from "../constants";
import { useActiveSection, useScrolled } from "../hooks";
import { Socials } from "./Socials";

/**
 * Yuqori menyu.
 *
 * Havolalar tashqaridan beriladi: sahifa CMS'dan kelgan bloklardan qurilganda
 * bo'limlar ro'yxati ham o'shalardan hosil bo'ladi. Zaxira (statik) rejimda
 * esa eski ro'yxat ishlatiladi.
 */
export function LandingHeader({ anchors = NAV_ANCHORS }: { anchors?: NavAnchor[] }) {
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled();
  const hrefs = useMemo(() => anchors.map((anchor) => anchor.href), [anchors]);
  const active = useActiveSection(hrefs, hrefs[0] ?? "");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-border bg-card/90 shadow-sm backdrop-blur" : "bg-transparent",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 lg:flex lg:justify-between">
          <a href="#top" className={cn("flex min-w-0 items-center gap-2 rounded-sm", focusRing)}>
            <img
              src={logo}
              alt="Alishax Kids logotipi"
              width={160}
              height={80}
              className={cn("w-auto transition-all duration-300", scrolled ? "h-9" : "h-11")}
            />
          </a>

          <nav
            className={cn(
              "hidden items-center gap-1 rounded-full border p-1 transition-all duration-300 lg:flex",
              scrolled
                ? "border-border bg-secondary/60 backdrop-blur"
                : "border-transparent bg-card/50 backdrop-blur",
            )}
          >
            {anchors.map((anchor) => {
              const isActive = active === anchor.href;
              return (
                <a
                  key={anchor.href}
                  href={anchor.href}
                  className={cn(
                    "group relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
                    focusRing,
                    isActive
                      ? "text-brand-foreground"
                      : "text-muted-foreground hover:-translate-y-0.5 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "absolute inset-0 rounded-full bg-brand shadow-[0_6px_18px_-6px_var(--brand)] transition-all duration-300",
                      isActive ? "scale-100 opacity-100" : "scale-75 opacity-0",
                    )}
                  />
                  <span
                    className={cn(
                      "absolute inset-0 rounded-full bg-secondary transition-opacity duration-300",
                      isActive ? "opacity-0" : "opacity-0 group-hover:opacity-100",
                    )}
                  />
                  <span className="relative z-10">{anchor.label}</span>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-berry transition-all duration-300",
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                    )}
                  />
                </a>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden md:block">
              <Socials compact />
            </div>
            <Button
              asChild
              className="hidden rounded-full bg-brand text-brand-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand/90 hover:shadow-md sm:inline-flex"
            >
              <Link to="/kirish">
                <LogIn className="mr-2 h-4 w-4" />
                Tizimga kirish
              </Link>
            </Button>
            <button
              onClick={() => setOpen((value) => !value)}
              aria-label="Menyu"
              aria-expanded={open}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-xl hover:bg-secondary lg:hidden",
                focusRing,
              )}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="animate-[pop-in_0.3s_ease-out] border-t border-border bg-card px-4 py-3 lg:hidden">
          {anchors.map((anchor, index) => (
            <a
              key={anchor.href}
              href={anchor.href}
              onClick={() => setOpen(false)}
              style={{ animationDelay: `${index * 60}ms` }}
              className={cn(
                "flex animate-[pop-in_0.35s_ease-out_both] items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition-all",
                focusRing,
                active === anchor.href
                  ? "bg-brand text-brand-foreground"
                  : "hover:translate-x-1 hover:bg-secondary",
              )}
            >
              {anchor.label}
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  active === anchor.href ? "bg-brand-foreground" : "bg-brand/50",
                )}
              />
            </a>
          ))}
          <div className="px-3 py-3">
            <Socials compact />
          </div>
          <Button
            asChild
            className="mt-1 w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <Link to="/kirish">Tizimga kirish</Link>
          </Button>
        </div>
      ) : null}
    </header>
  );
}
