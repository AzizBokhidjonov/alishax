import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryState } from "@/components/common/QueryState";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { ListPagination } from "@/components/common/ListPagination";
import { RefreshButton } from "@/components/common/RefreshButton";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { useListParams } from "@/hooks/use-list-params";
import { ChildFilters } from "./components/ChildFilters";
import { ChildEnrollmentWizard } from "./components/ChildEnrollmentWizard";
import { ChildRow } from "./components/ChildRow";
import { useChildren, useDeleteChild } from "./api";

/**
 * Holat tablari. Ro'yxatdagi yettita holatning hammasi emas — kundalik ishda
 * ishlatiladigan to'rttasi va «Barchasi». Qolganlari (bitirgan, chiqarilgan,
 * arxiv) kamdan-kam kerak bo'ladi, shuning uchun ular tabga chiqarilmadi;
 * ularni ko'rish uchun holat tanlovi baribir so'rovda qoladi.
 */
const STATUS_TABS: { value: string; labelKey: string }[] = [
  { value: "all", labelKey: "common.actions.all" },
  { value: "active", labelKey: "domain.childStatus.active" },
  { value: "applicant", labelKey: "domain.childStatus.applicant" },
  { value: "temporarily_absent", labelKey: "domain.childStatus.temporarily_absent" },
  { value: "suspended", labelKey: "domain.childStatus.suspended" },
  { value: "archived", labelKey: "domain.childStatus.archived" },
];

export function ChildrenPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canSeeDebt = can(P.debtRead);
  const canSeeAlerts = can(P.medicalAlerts);
  // `scope` — filtr va sahifa raqami bo'limlar orasida yurganda saqlanadi.
  const params = useListParams({ groupId: "all", status: "all" }, "lastName:asc");
  const { data, isLoading, isPlaceholderData, isFetching, error, refetch, dataUpdatedAt } =
    useChildren({
      ...params.query,
      hasDebt: canSeeDebt && params.filters.hasDebt === "true" ? true : undefined,
      hasMedicalAlert: canSeeAlerts && params.filters.hasMedicalAlert === "true" ? true : undefined,
    });
  const remove = useDeleteChild();

  const canCreate = can(P.childCreate);
  const canEdit = can(P.childUpdate);
  const canDelete = can(P.childDelete);

  const handleDelete = useCallback(
    (id: string) => {
      remove.mutate(id);
    },
    [remove],
  );

  const status = params.filters.status ?? "all";

  /*
    Panel faqat holatdan boshqa filtrlarni sanaydi — holat tabda ko'rinib
    turadi va uni «yoqilgan filtr» deb ikki marta aytish shart emas.
  */
  const activeCount = useMemo(() => {
    let count = params.q.trim() ? 1 : 0;
    if (params.filters.groupId && params.filters.groupId !== "all") count += 1;
    if (canSeeDebt && params.filters.hasDebt === "true") count += 1;
    if (canSeeAlerts && params.filters.hasMedicalAlert === "true") count += 1;
    return count;
  }, [params.q, params.filters, canSeeDebt, canSeeAlerts]);

  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("children.title")}
        subtitle={t("children.subtitle", { count: data?.meta.total ?? 0 })}
      >
        {/* Guruhlashni `PageHeader` ning o'zi qiladi — bu yerda o'rash ortiqcha. */}
        <RefreshButton
          onRefresh={() => void refetch()}
          isFetching={isFetching}
          updatedAt={dataUpdatedAt}
        />
        {canCreate ? (
          <ChildEnrollmentWizard
            trigger={
              <Button className="h-11 rounded-xl">
                <UserPlus className="h-4 w-4" />
                {t("children.add")}
              </Button>
            }
          />
        ) : null}
      </PageHeader>

      <ChildFilters
        query={params.q}
        onQueryChange={params.setQuery}
        filters={params.filters}
        onFilterChange={params.setFilter}
        activeCount={activeCount}
        onReset={params.reset}
      />

      {/*
        Holat tablari. `Tabs` bu yerda tarkibni almashtirmaydi — jadval bitta,
        faqat so'rov filtri o'zgaradi. Shuning uchun `TabsContent` yo'q va
        jadval tablardan tashqarida turadi.
      */}
      <Tabs value={status} onValueChange={(value) => params.setFilter("status", value)}>
        <TabsList aria-label={t("children.filters.status")}>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        onRetry={() => void refetch()}
        skeleton={<TableSkeleton columns={6} />}
        emptyDescription={t("children.emptyHint")}
        emptyAction={
          activeCount > 0 || status !== "all" ? (
            <Button variant="outline" onClick={params.reset}>
              {t("common.filters.clear")}
            </Button>
          ) : canEdit ? (
            <ChildEnrollmentWizard
              trigger={
                <Button className="h-11 rounded-xl">
                  <UserPlus className="h-4 w-4" />
                  {t("children.add")}
                </Button>
              }
            />
          ) : null
        }
      >
        {/*
          Xiralashuv faqat FILTR yoki sahifa almashganda: shunda ekranda hali
          eski natija turadi (`placeholderData`) va u kelayotgan natijaga mos
          emasligini bildirish kerak. Fonda ketayotgan oddiy yangilashda
          jadval qimirlamaydi — aks holda har qaytishda ko'z oldida
          o'chib-yonardi.
        */}
        <TableCard
          className={cn("transition-opacity duration-200", isPlaceholderData && "opacity-55")}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("children.columns.child")}</TableHead>
                <TableHead className="w-20">{t("children.columns.age")}</TableHead>
                <TableHead>{t("children.columns.group")}</TableHead>
                <TableHead className="w-36">{t("children.columns.status")}</TableHead>
                <TableHead className="w-36 text-right">{t("children.columns.debt")}</TableHead>
                <TableHead className="w-28 text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((child) => (
                <ChildRow
                  key={child.id}
                  child={child}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onDelete={handleDelete}
                />
              ))}
            </TableBody>
          </Table>
        </TableCard>
        <ListPagination
          meta={data?.meta}
          onPageChange={params.setPage}
          onLimitChange={params.setLimit}
        />
      </QueryState>
    </div>
  );
}
