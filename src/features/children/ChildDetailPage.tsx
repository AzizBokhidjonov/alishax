import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryState } from "@/components/common/QueryState";
import { ChildStatusBadge } from "@/components/common/StatusBadge";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { ChildFormDialog } from "./components/ChildFormDialog";
import { ChildStatusDialog } from "./components/ChildStatusDialog";
import { ChildOverviewTab } from "./components/ChildOverviewTab";
import { ChildGuardiansTab } from "./components/ChildGuardiansTab";
import { ChildDocumentsTab } from "./components/ChildDocumentsTab";
import { ChildMedicalTab } from "./components/ChildMedicalTab";
import { ChildConsentsTab } from "./components/ChildConsentsTab";
import { ChildHistoryTab } from "./components/ChildHistoryTab";
import { ChildFinanceTab } from "./components/ChildFinanceTab";
import { ChildAttendanceTab } from "./components/ChildAttendanceTab";
import { ChildPickupTab } from "./components/ChildPickupTab";
import { useChild } from "./api";

export function ChildDetailPage({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const { can, canAny } = usePermissions();
  const { data: child, isLoading, error, refetch } = useChild(childId);

  const canManage = canAny(P.childCreate, P.childUpdate);
  const canSeeMedical = canAny(P.medicalRead, P.medicalAlerts);
  const canSeeFinance = canAny(P.paymentRead, P.debtRead, P.chargeRead);
  const canSeePickup = canAny(P.pickupRead, P.pickupManage);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/bolalar">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("children.title")}
        </Link>
      </Button>

      <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()} rows={4}>
        {child ? (
          <>
            <PageHeader
              title={`${child.lastName} ${child.firstName}`}
              subtitle={
                <span className="flex items-center gap-2">
                  <ChildStatusBadge status={child.status} />
                  <span>{child.groupName ?? child.group?.name ?? t("children.noGroup")}</span>
                </span>
              }
            >
              {canManage ? (
                <div className="flex gap-2">
                  {can(P.childStatus) ? <ChildStatusDialog child={child} /> : null}
                  <ChildFormDialog
                    child={child}
                    trigger={
                      <Button variant="outline" className="h-11">
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("common.actions.edit")}
                      </Button>
                    }
                  />
                </div>
              ) : null}
            </PageHeader>

            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">{t("children.tabs.overview")}</TabsTrigger>
                <TabsTrigger value="guardians">{t("children.tabs.guardians")}</TabsTrigger>
                <TabsTrigger value="documents">{t("children.tabs.documents")}</TabsTrigger>
                {canSeeMedical ? (
                  <TabsTrigger value="medical">{t("children.tabs.medical")}</TabsTrigger>
                ) : null}
                <TabsTrigger value="attendance">{t("children.tabs.attendance")}</TabsTrigger>
                {canSeePickup ? (
                  <TabsTrigger value="pickup">{t("children.tabs.pickup")}</TabsTrigger>
                ) : null}
                {canSeeFinance ? (
                  <TabsTrigger value="finance">{t("children.tabs.finance")}</TabsTrigger>
                ) : null}
                <TabsTrigger value="consents">{t("children.tabs.consents")}</TabsTrigger>
                <TabsTrigger value="history">{t("children.tabs.history")}</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <ChildOverviewTab child={child} />
              </TabsContent>
              <TabsContent value="guardians">
                <ChildGuardiansTab childId={child.id} canManage={can(P.guardianManage)} />
              </TabsContent>
              <TabsContent value="documents">
                <ChildDocumentsTab childId={child.id} canManage={canManage} />
              </TabsContent>
              {canSeeMedical ? (
                <TabsContent value="medical">
                  <ChildMedicalTab childId={child.id} />
                </TabsContent>
              ) : null}
              <TabsContent value="attendance">
                <ChildAttendanceTab childId={child.id} />
              </TabsContent>
              {canSeePickup ? (
                <TabsContent value="pickup">
                  <ChildPickupTab childId={child.id} canManage={can(P.pickupManage)} />
                </TabsContent>
              ) : null}
              {canSeeFinance ? (
                <TabsContent value="finance">
                  <ChildFinanceTab childId={child.id} />
                </TabsContent>
              ) : null}
              <TabsContent value="consents">
                <ChildConsentsTab childId={child.id} canManage={can(P.consentManage)} />
              </TabsContent>
              <TabsContent value="history">
                <ChildHistoryTab childId={child.id} />
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
