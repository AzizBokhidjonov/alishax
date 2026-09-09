import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import type { ChildDetail } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/common/Money";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { ageFromBirth, formatDate } from "@/lib/dates";
import { useChildDebt } from "@/features/finance/api";
import { ChildDebtCard } from "./ChildDebtCard";
import { ChildGroupCard } from "./ChildGroupCard";

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export function ChildOverviewTab({ child }: { child: ChildDetail }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canSeeDebt = can(P.debtRead);
  const { data: debt } = useChildDebt(canSeeDebt ? child.id : "");
  const age = ageFromBirth(child.birthDate);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t("children.tabs.overview")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-8 sm:grid-cols-2">
          <div>
            <Row label={t("children.form.birthDate")} value={formatDate(child.birthDate)} />
            <Row
              label={t("children.columns.age")}
              value={age === null ? null : t("children.ageYears", { count: age })}
            />
            <Row
              label={t("children.form.gender")}
              value={child.gender ? t(`domain.gender.${child.gender}`) : null}
            />
            <Row label={t("children.form.address")} value={child.address} />
          </div>
          <div>
            <Row
              label={t("children.form.enrollmentDate")}
              value={formatDate(child.enrollmentDate)}
            />
            <Row label={t("children.form.contractNumber")} value={child.contractNumber} />
            <Row label={t("children.form.registrationNumber")} value={child.registrationNumber} />
            <Row
              label={t("common.labels.group")}
              value={child.groupName ?? child.group?.name ?? null}
            />
          </div>
          {child.note ? (
            <p className="mt-3 text-sm text-muted-foreground sm:col-span-2">{child.note}</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <ChildGroupCard child={child} />

        {child.alerts && child.alerts.length > 0 ? (
          <Card className="border-st-danger-border bg-st-danger-soft">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-st-danger-fg">
                <AlertTriangle className="h-4 w-4" />
                {t("children.medical.alertsTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {child.alerts.map((alert, index) => (
                <div key={`${alert.allergen}-${index}`} className="text-sm text-st-danger-fg">
                  <div className="font-semibold">{alert.allergen}</div>
                  {alert.instruction ? <div>{alert.instruction}</div> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {child.tariff ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("tariffs.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{child.tariff.name}</div>
              <Money value={child.tariff.amountTiyin} className="text-lg font-semibold" />
            </CardContent>
          </Card>
        ) : null}

        {canSeeDebt && debt ? (
          <ChildDebtCard
            debt={debt}
            childId={child.id}
            childName={`${child.lastName} ${child.firstName}`}
          />
        ) : null}
      </div>
    </div>
  );
}
