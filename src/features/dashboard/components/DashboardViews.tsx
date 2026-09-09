import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  BellRing,
  CalendarCheck,
  DoorOpen,
  TrendingDown,
  UserX,
  Users,
  Wallet,
} from "lucide-react";
import { dashboardApi, type DebtBreakdown } from "@/api";
import { Money } from "@/components/common/Money";
import { QueryState } from "@/components/common/QueryState";
import { Skeleton } from "@/components/ui/skeleton";
import { periodLabel } from "@/lib/dates";
import { addTiyin } from "@/lib/money";
import { qk } from "@/lib/query";
import { useLanguage } from "@/i18n/useLanguage";
import { StatCard } from "./StatCard";

/** Muddat guruhlaridan umumiy qarzni yig'adi (server yig'indini bermaydi). */
function totalDebt(debt?: DebtBreakdown): string {
  if (!debt) return "0";
  return addTiyin(debt.ageing.notOverdue, debt.ageing.d1_7, debt.ageing.d8_30, debt.ageing.d30plus);
}

const GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-4";

/**
 * Yuklanish skeleti kartochkalar tartibini takrorlaydi. Standart `QueryState`
 * skeleti bir ustunli ro'yxat chizardi va yuklangach tartib sakrardi.
 */
function TilesSkeleton({ count }: { count: number }) {
  return (
    <div className={GRID}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-22 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function DirectorView() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: qk.dashboard("director"),
    queryFn: () => dashboardApi.director(),
  });

  return (
    <QueryState
      isLoading={query.isLoading}
      error={query.error}
      onRetry={() => void query.refetch()}
      skeleton={<TilesSkeleton count={7} />}
    >
      {query.data ? (
        <div className={GRID}>
          <StatCard
            icon={Users}
            label={t("dashboard.tiles.childrenActive")}
            to="/bolalar"
            value={query.data.activeChildren}
          />
          <StatCard
            icon={DoorOpen}
            label={t("dashboard.tiles.inside")}
            to="/ichkarida"
            value={query.data.currentlyInside}
          />
          <StatCard
            icon={UserX}
            label={t("dashboard.tiles.absentToday")}
            to="/davomat"
            value={query.data.absentToday}
          />
          <StatCard
            icon={BellRing}
            label={t("dashboard.tiles.telegramBound")}
            to="/otaonalar"
            value={`${query.data.telegramBound}/${query.data.telegramGuardianTotal}`}
          />
          <StatCard
            icon={Wallet}
            label={t("dashboard.tiles.paymentsMonth")}
            to="/tolovlar"
            tone="ok"
            value={<Money value={query.data.revenueThisMonthTiyin} />}
          />
          <StatCard
            icon={TrendingDown}
            label={t("dashboard.tiles.expensesMonth")}
            to="/xarajatlar"
            tone="warn"
            value={<Money value={query.data.expensesThisMonthTiyin} />}
          />
          <StatCard
            icon={TrendingDown}
            label={t("dashboard.tiles.debtTotal")}
            to="/qarzlar"
            tone="danger"
            value={<Money value={totalDebt(query.data.debt)} />}
          />
        </div>
      ) : null}
    </QueryState>
  );
}

export function AccountantView() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const query = useQuery({
    queryKey: qk.dashboard("accountant"),
    queryFn: () => dashboardApi.accountant(),
  });

  return (
    <QueryState
      isLoading={query.isLoading}
      error={query.error}
      onRetry={() => void query.refetch()}
      skeleton={<TilesSkeleton count={5} />}
    >
      {query.data ? (
        <div className={GRID}>
          <StatCard
            icon={Wallet}
            label={t("dashboard.tiles.paymentsToday")}
            to="/tolovlar"
            tone="ok"
            value={<Money value={query.data.paymentsToday.totalTiyin} />}
          />
          <StatCard
            icon={CalendarCheck}
            label={t("dashboard.tiles.chargesMonth")}
            to="/hisoblar"
            value={<Money value={query.data.chargesThisMonthTiyin} />}
          />
          <StatCard
            icon={TrendingDown}
            label={t("dashboard.tiles.expensesMonth")}
            to="/xarajatlar"
            tone="warn"
            value={<Money value={query.data.unpaidExpenses.totalTiyin} />}
          />
          <StatCard
            icon={CalendarCheck}
            label={t("dashboard.tiles.openPeriod")}
            to="/davrlar"
            value={
              query.data.openPeriod
                ? periodLabel(query.data.openPeriod.year, query.data.openPeriod.month, language)
                : "—"
            }
          />
          <StatCard
            icon={TrendingDown}
            label={t("dashboard.tiles.debtTotal")}
            to="/qarzlar"
            tone="danger"
            value={<Money value={totalDebt(query.data.debt)} />}
          />
        </div>
      ) : null}
    </QueryState>
  );
}

export function ReceptionView() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: qk.dashboard("reception"),
    queryFn: () => dashboardApi.reception(),
  });

  return (
    <QueryState
      isLoading={query.isLoading}
      error={query.error}
      onRetry={() => void query.refetch()}
      skeleton={<TilesSkeleton count={4} />}
    >
      {query.data ? (
        <div className={GRID}>
          <StatCard
            icon={DoorOpen}
            label={t("dashboard.tiles.inside")}
            to="/ichkarida"
            value={query.data.currentlyInside}
          />
          <StatCard
            icon={UserX}
            label={t("dashboard.tiles.absentToday")}
            to="/davomat"
            value={query.data.absentToday}
          />
          <StatCard
            icon={CalendarCheck}
            label={t("dashboard.tiles.notPickedUp")}
            to="/olibketish"
            tone="warn"
            value={query.data.notPickedUpYet}
          />
          <StatCard
            icon={BellRing}
            label={t("dashboard.tiles.telegramBound")}
            to="/otaonalar"
            value={query.data.unboundGuardianCount}
          />
        </div>
      ) : null}
    </QueryState>
  );
}
