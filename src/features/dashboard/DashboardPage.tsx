import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SelectField } from "@/components/common/SelectField";
import { cn, focusRing, hoverLiftSm } from "@/lib/utils";
import { useAuth, usePermissions } from "@/auth/auth-context";
import { P, roleLabelKey } from "@/config/permissions";
import { AccountantView, DirectorView, ReceptionView } from "./components/DashboardViews";

type View = "director" | "accountant" | "reception";

/** Tezkor havolalar — ruxsat bo'yicha filtrlanadi, ko'rinishi bir xil. */
const QUICK_LINKS = [
  { to: "/bolalar", labelKey: "nav.children", permissions: [P.childRead] },
  {
    to: "/davomat",
    labelKey: "nav.attendance",
    permissions: [P.attendanceRead, P.attendanceCheckIn],
  },
  { to: "/olibketish", labelKey: "nav.pickup", permissions: [P.pickupRead, P.pickupManage] },
  { to: "/tolovlar", labelKey: "nav.payments", permissions: [P.paymentRead, P.paymentCreate] },
  { to: "/qarzlar", labelKey: "nav.debts", permissions: [P.debtRead] },
] as const;

const QUICK_LINK_CLASS = cn(
  "rounded-xl bg-secondary px-3 py-2 text-sm hover:bg-accent",
  hoverLiftSm,
  focusRing,
);

/** Rol kodidan mos panel — bir nechta rol bo'lsa foydalanuvchi almashtira oladi. */
function defaultView(roleCodes: string[]): View {
  if (roleCodes.includes("accountant")) return "accountant";
  if (roleCodes.includes("reception") || roleCodes.includes("teacher")) return "reception";
  return "director";
}

/**
 * Har bir rol uchun bitta yig'ma so'rov (B18) — o'nlab endpointga
 * tarqalmaydi. Bir nechta roli borlar panelni almashtira oladi.
 */
export function DashboardPage() {
  const { t } = useTranslation();
  const { roles } = useAuth();
  const { can, canAny } = usePermissions();
  const roleCodes = roles.map((role) => role.code);
  const [view, setView] = useState<View>(() => defaultView(roleCodes));
  // Ba'zi rollarda (hamshira, tarbiyachi) `dashboard:read` yo'q — panel
  // so'ralmaydi, o'rniga tezkor havolalar ko'rsatiladi.
  const canSeeDashboard = can(P.dashboardRead);

  const views = useMemo(
    () =>
      (["director", "accountant", "reception"] as View[]).map((value) => ({
        value,
        label: t(`dashboard.views.${value}`),
      })),
    [t],
  );

  const roleLabel = roles.map((role) => t(roleLabelKey(role.code))).join(", ");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.title")}
        subtitle={roleLabel ? t("dashboard.subtitleFor", { role: roleLabel }) : undefined}
      >
        {canSeeDashboard ? (
          <SelectField
            // Sarlavha qatorida ko'rinadigan yorliqqa joy yo'q, shuning
            // uchun nom ekran o'quvchi uchun beriladi.
            ariaLabel={t("dashboard.switchView")}
            value={view}
            onChange={(value) => setView(value as View)}
            options={views}
            triggerClassName="w-48"
          />
        ) : null}
      </PageHeader>

      {canSeeDashboard ? (
        <>
          {view === "director" ? <DirectorView /> : null}
          {view === "accountant" ? <AccountantView /> : null}
          {view === "reception" ? <ReceptionView /> : null}
        </>
      ) : (
        <EmptyState icon={LayoutDashboard} title={t("dashboard.empty")} />
      )}

      <Card>
        <CardContent className="p-4">
          <nav aria-label={t("dashboard.quickLinks")} className="flex flex-wrap gap-2">
            <span className="mr-2 self-center text-sm font-medium">
              {t("dashboard.quickLinks")}
            </span>
            {QUICK_LINKS.filter((link) => canAny(...link.permissions)).map((link) => (
              <Link key={link.to} to={link.to} className={QUICK_LINK_CLASS}>
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}
