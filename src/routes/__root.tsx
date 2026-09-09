import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import { isPublicRoute } from "@/config/navigation";
import { useAuth } from "@/auth/auth-context";
import { AuthProvider } from "@/auth/AuthProvider";
import { AppShell } from "@/components/layout/AppShell";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { Toaster } from "@/components/ui/sonner";
import { useLanguageSync } from "@/i18n/useLanguage";
import "@/i18n";
import { focusRing } from "@/lib/utils";

function NotFoundComponent() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        {/* «404» — bezak raqami, sahifaning sarlavhasi emas. */}
        <p aria-hidden className="text-7xl font-bold text-foreground">
          404
        </p>
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          {t("common.page.notFoundTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("common.page.notFoundText")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className={`inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 ${focusRing}`}
          >
            {t("common.page.goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const { t } = useTranslation();
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">{t("common.page.errorTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("common.page.errorText")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className={`inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 ${focusRing}`}
          >
            {t("common.actions.retry")}
          </button>
          <a
            href="/"
            className={`inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent ${focusRing}`}
          >
            {t("common.page.goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Alishax Kids" },
      {
        name: "description",
        content: "Alishax Kids bog'chasi — bolalar, davomat va to'lovlarni boshqarish tizimi.",
      },
      { name: "author", content: "Alishax Kids" },
      { property: "og:site_name", content: "Alishax Kids" },
      { property: "og:title", content: "Alishax Kids" },
      {
        property: "og:description",
        content: "Alishax Kids bog'chasi — bolalar, davomat va to'lovlarni boshqarish tizimi.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "uz_UZ" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      // Brend shrifti — Montserrat (Logo Book, "Фирменный шрифт").
      // 400..800 oralig'i: matn 400/500, sarlavhalar 600/700/800. Kursiv
      // interfeysda ishlatilmaydi, shuning uchun yuklanmaydi.
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400..800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // Standart til — `uz`. Til almashsa `useLanguageSync` `lang` ni yangilaydi.
  return (
    <html lang="uz">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useLanguageSync();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LayoutGate />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

/**
 * Sessiya holatiga qarab qobiqni tanlaydi: ochiq sahifalar to'g'ridan-to'g'ri,
 * qolganlari `AppShell` ichida va route ruxsati tekshirilgan holda.
 */
function LayoutGate() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { status } = useAuth();
  const navigate = useNavigate();
  const isPublic = isPublicRoute(pathname);

  useEffect(() => {
    if (status === "anonymous" && !isPublic) {
      navigate({ to: "/kirish", replace: true });
    }
  }, [status, isPublic, navigate]);

  if (isPublic) return <Outlet />;

  if (status !== "authenticated") {
    return (
      // Matn halqaning yonida turadi: «kamroq harakat» yoqilganda animatsiya
      // to'xtaydi va halqa qimirlamaydi — holatni faqat matn bildiradi.
      <div role="status" className="flex min-h-screen flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-brand" />
        <p className="text-sm text-muted-foreground">{t("common.state.loading")}</p>
      </div>
    );
  }

  return (
    <AppShell>
      <RouteGuard pathname={pathname}>
        <Outlet />
      </RouteGuard>
    </AppShell>
  );
}
