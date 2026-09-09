import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePermissions } from "@/auth/auth-context";
import { NAV_SECTIONS } from "@/config/navigation";
import { cn, focusRing } from "@/lib/utils";

/**
 * Yon menyu. Har bir bo'lim va element foydalanuvchining RUXSATLARI bo'yicha
 * filtrlanadi — rol nomiga qarab emas.
 *
 * Panel yig'ilganda faqat ikonkalar qoladi. Yozuvlar DOM da qoladi (ekran
 * o'quvchi ularni o'qiydi), lekin ko'rinmaydi — nomi esa sichqoncha yoki
 * fokus ostida maslahat oynasida chiqadi.
 */
export function NavList({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const { canAny } = usePermissions();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => item.permissions.length === 0 || canAny(...item.permissions),
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <nav aria-label={t("nav.primary")} className="flex flex-col gap-4 px-3 py-4">
      {sections.map((section, sectionIndex) => (
        <div key={section.titleKey} className="flex flex-col gap-1">
          {/*
            Ko'rinadigan sarlavha `aria-hidden` — uning matni quyidagi
            ro'yxatning `aria-label` ida allaqachon bor, aks holda ekran
            o'quvchi uni ikki marta o'qir edi. Panel yig'ilganda sarlavha
            o'rniga qisqa chiziq qoladi: guruhlar ajralib turadi, lekin joy
            egallamaydi.
          */}
          {collapsed ? (
            // Birinchi bo'lim ustida chiziq kerak emas — u sarlavha chegarasiga tegib qolardi.
            sectionIndex === 0 ? null : (
              <div aria-hidden className="mx-auto my-1.5 h-px w-6 rounded-full bg-border" />
            )
          ) : (
            <div
              aria-hidden
              className="px-2 pb-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              {t(section.titleKey)}
            </div>
          )}

          <ul aria-label={t(section.titleKey)} className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
              const Icon = item.icon;
              const label = t(item.labelKey);

              const link = (
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  // Faol sahifa ilgari faqat rang bilan ko'rsatilardi.
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group/nav relative flex h-11 items-center gap-3 overflow-hidden rounded-xl px-2 text-sm transition-colors",
                    focusRing,
                    active
                      ? "bg-brand-soft font-semibold text-foreground"
                      : "font-medium text-foreground/85 hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {/* Faol sahifaning chap chetidagi amber belgisi. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-brand transition-all duration-300",
                      active ? "h-5 opacity-100" : "h-0 opacity-0",
                    )}
                  />
                  <span className="grid w-9 shrink-0 place-items-center">
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-transform duration-200 group-hover/nav:scale-110",
                        active && "text-brand-ink",
                      )}
                    />
                  </span>
                  <span
                    className={cn(
                      "truncate transition-[opacity,transform] duration-200",
                      collapsed && "-translate-x-2 opacity-0",
                    )}
                  >
                    {label}
                  </span>
                </Link>
              );

              return <li key={item.to}>{collapsed ? withTooltip(link, label) : link}</li>;
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Yig'ilgan paneldagi ikonka nomini ko'rsatadi. */
function withTooltip(trigger: ReactNode, label: string) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10} className="font-semibold">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
