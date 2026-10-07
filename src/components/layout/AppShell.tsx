import { useCallback, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PanelLeftClose } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/auth/auth-context";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn, focusRing } from "@/lib/utils";
import { SidebarContent } from "./SidebarContent";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggle, ready } = useSidebar();

  const handleLogout = useCallback(() => {
    void logout().finally(() => navigate({ to: "/kirish", replace: true }));
  }, [logout, navigate]);

  return (
    <TooltipProvider delayDuration={250} skipDelayDuration={400}>
      <div className="flex min-h-screen w-full bg-background">
        {/*
          Tabulyatsiyadagi birinchi element. Odatda ko'rinmaydi, fokus tushganda
          chiqadi — klaviatura bilan ishlaydigan foydalanuvchi har bir sahifada
          23 ta menyu havolasidan o'tmasdan asosiy tarkibga sakray oladi.
        */}
        <a
          href="#main"
          className={`sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground ${focusRing}`}
        >
          {t("nav.skipToContent")}
        </a>

        {/*
          Kenglik animatsiyasi faqat saqlangan holat o'qilgandan keyin yoqiladi
          (`ready`), aks holda yig'ilgan panel har yuklanishda ko'z oldida
          torayardi.
        */}
        <aside
          id="app-sidebar"
          aria-label={t("nav.sidebar")}
          className={cn(
            /*
              `sticky top-0` + `h-screen` — panel EKRAN balandligida qoladi va
              sahifa bilan birga surilmaydi.

              Ilgari u shunchaki `relative` edi va `min-h-screen` konteynerning
              bolasi sifatida sahifa bo'yiga cho'zilardi. Natijada `SidebarContent`
              ichidagi `flex-1 overflow-y-auto` hech qachon ishga tushmasdi:
              scroll qilinadigan yagona narsa sahifaning O'ZI edi, shuning uchun
              logotip ham, pastdagi foydalanuvchi bloki ham yuqoriga chiqib
              ko'rinmay qolardi. Balandlik ekranga bog'langach, menyu panel
              ichida suriladi, logotip va foydalanuvchi bloki esa joyida turadi.

              `z-40` — yopishqoq yuqori panel `z-30` da; chekkadagi yig'ish tugmasi
              uning tagida qolib ketmasligi uchun panel undan yuqorida turadi.
            */
            "sticky top-0 z-40 hidden h-screen shrink-0 flex-col border-r border-border bg-card lg:flex",
            ready && "transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            collapsed ? "w-19" : "w-72",
          )}
        >
          <SidebarContent collapsed={collapsed} onLogout={handleLogout} />

          {/*
            Yig'ish tugmasi panel chekkasida, sarlavha qatori balandligida
            turadi: u ikkala holatda ham bir joyda qoladi va menyu ustida
            suzib yurgandek ko'rinmaydi.
          */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggle}
                aria-label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
                aria-controls="app-sidebar"
                aria-expanded={!collapsed}
                className={cn(
                  "absolute -right-3 top-5 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-brand hover:text-foreground",
                  focusRing,
                )}
              >
                <PanelLeftClose
                  aria-hidden
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-300",
                    collapsed && "rotate-180",
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              {collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
              <span className="ml-2 opacity-60">Ctrl + B</span>
            </TooltipContent>
          </Tooltip>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            mobileOpen={mobileOpen}
            onMobileOpenChange={setMobileOpen}
            onLogout={handleLogout}
          />
          <main id="main" className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
