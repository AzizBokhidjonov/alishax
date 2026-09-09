import { useTranslation } from "react-i18next";
import { useRouterState } from "@tanstack/react-router";
import { CalendarDays, ChevronRight, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navTrailFor } from "@/config/navigation";
import { formatDate, todayIso } from "@/lib/dates";
import { LANGUAGES } from "@/i18n";
import { useLanguage } from "@/i18n/useLanguage";
import { BranchSwitcher } from "./BranchSwitcher";
import { GlobalSearch } from "./GlobalSearch";
import { SidebarContent } from "./SidebarContent";
import { cn, focusRing } from "@/lib/utils";
import mark from "@/assets/logo-mark.png";

interface TopbarProps {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onLogout: () => void;
}

/**
 * Yuqori panel.
 *
 * Hisob bilan bog'liq hamma narsa yon panelning pastki blokiga ko'chdi, bu
 * yerda esa joylashuv qoldi: qaysi bo'limning qaysi sahifasidasiz. Sahifa
 * sarlavhasi (`h1`) tarkibning o'zida bo'lgani uchun bu yerda takrorlanmaydi
 * — zanjir undan boshqa narsani aytadi, ya'ni BO'LIMni.
 */
export function Topbar({ mobileOpen, onMobileOpenChange, onLogout }: TopbarProps) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const trail = navTrailFor(pathname);
  const todayLabel = formatDate(todayIso());

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
            <SheetTrigger
              aria-label={t("nav.openMenu")}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-secondary lg:hidden",
                focusRing,
              )}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            {/*
              `SheetContent` blok konteyner: ustun bo'lmasa yon panelning
              `flex-1` scroll maydoni ishlamaydi va 23 ta menyu elementi
              ekrandan chiqib ketardi.
            */}
            <SheetContent side="left" className="flex w-72 flex-col gap-0 bg-card p-0">
              {/* Radix panelning nomini talab qiladi; nom ko'rinmaydi. */}
              <SheetTitle className="sr-only">{t("nav.menu")}</SheetTitle>
              <SidebarContent onLogout={onLogout} onNavigate={() => onMobileOpenChange(false)} />
            </SheetContent>
          </Sheet>

          {/* Kichik ekranda yon panel yopiq — brend belgisi shu yerda qoladi. */}
          <img
            src={mark}
            alt=""
            width={256}
            height={256}
            className="h-8 w-8 rounded-lg lg:hidden"
          />

          {trail ? (
            <nav aria-label={t("nav.breadcrumb")} className="hidden min-w-0 md:block">
              <ol className="flex min-w-0 items-center gap-1.5">
                <li className="shrink-0 text-sm text-muted-foreground">{t(trail.sectionKey)}</li>
                <li aria-hidden className="shrink-0 text-muted-foreground/60">
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
                <li aria-current="page" className="truncate text-sm font-bold">
                  {t(trail.labelKey)}
                </li>
              </ol>
            </nav>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Qabulxona uchun eng qisqa yo'l — `/` bilan ham ochiladi (§3.1). */}
          <GlobalSearch />

          <BranchSwitcher />

          {/*
            Ish sanasi. Bog'chada deyarli har bir amal «bugun» ga bog'langan,
            shuning uchun sana qaysi sahifada bo'lmasin ko'rinib turadi.
          */}
          <span className="hidden items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold sm:inline-flex">
            <CalendarDays aria-hidden className="h-3.5 w-3.5 text-brand-ink" />
            <span className="sr-only">{t("common.labels.date")}: </span>
            {todayLabel}
          </span>

          {/* Ikki til uchun ro'yxat ochish ortiqcha — kirish sahifasidagi kabi ikkita tugma. */}
          <div
            role="group"
            aria-label={t("common.language.switch")}
            className="inline-flex rounded-full border border-border bg-card p-0.5"
          >
            {LANGUAGES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                aria-pressed={language === code}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold uppercase transition-colors",
                  focusRing,
                  language === code
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
