import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CloudOff } from "lucide-react";
import type { AttendanceRecord } from "@/api";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/common/QueryState";
import { TableSkeleton } from "@/components/common/TableCard";
import { useBranch } from "@/auth/use-branch";
import { useUrlState } from "@/hooks/use-url-state";
import { childDisplayName, useChildLookup } from "@/features/children/use-child-lookup";
import { useGroupOptions } from "@/features/groups/api";
import { useCheckIn, useNotPickedUp, useSetAttendanceStatus } from "../api";
import { usePendingCheckIns } from "../checkin-queue";
import { useBoardRows } from "../use-board-rows";
import { AttendanceBoardHeader, type Counter } from "./AttendanceBoardHeader";
import { AttendanceGroupSection } from "./AttendanceGroupSection";

/** Hali hech qanday qayd qo'yilmagan: na kirish, na sabab. */
function isPending(row: AttendanceRecord): boolean {
  return !row.checkInAt && !row.status;
}

function matches(row: AttendanceRecord, counter: Counter, lateIds: Set<string>): boolean {
  switch (counter) {
    case "pending":
      return isPending(row);
    case "inside":
      return Boolean(row.checkInAt && !row.checkOutAt);
    case "absent":
      // Sabab qo'yilgan (kelmadi/kasal/ta'til/sababli) — belgilanmagan emas.
      return !row.checkInAt && Boolean(row.status);
    case "notPickedUp":
      // Kimni olib ketishmagani — serverning qarori (ish vaqti, bayramlar).
      return lateIds.has(row.childId);
    default:
      return true;
  }
}

/**
 * Qabulxona taxtasi — binodagi eng ko'p ishlatiladigan ekran (§5.1).
 *
 * Ilgari bu oltita ustunli jadval edi: surat yo'q, teginish maydonlari kichik,
 * hisoblagichlar shunchaki matn. Ertalabki 90 daqiqada bir kishi 40 ta bolani
 * qabul qiladi va har amalda ota-ona qarshida turadi — shuning uchun endi
 * SURATLI KARTOCHKALAR, bitta teginishli kirish va bosiladigan hisoblagichlar.
 */
export function AttendanceBoard({ canManage }: { canManage: boolean }) {
  const { t } = useTranslation();
  const [groupId, setGroupId] = useUrlState("attendance.groupId", "all");
  const [counter, setCounter] = useUrlState("attendance.counter", "all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [term, setTerm] = useState("");
  /*
    Ikki ko'rinish, bitta ekran: kartochkalar — qabulxona uchun (yuzni
    taniydi), tez belgilash — tarbiyachi uchun (butun guruhni bir o'tishda
    belgilaydi). Tanlov saqlanadi, chunki har rol o'zinikini ishlatadi.
  */
  const [view, setView] = useUrlState("attendance.view", "cards");

  const groups = useGroupOptions();
  const { branchId } = useBranch();

  const { rows, isLoading, error, refetch } = useBoardRows({
    groupId: groupId === "all" ? undefined : groupId,
    branchId,
  });

  /*
    Davomat javobida surat yo'q, `childName` ham har doim kelmaydi —
    ikkalasi ham bolalar ro'yxatidan to'ldiriladi.
  */
  const lookup = useChildLookup();

  /*
    «Olib ketilmagan» ro'yxatini server hisoblaydi — ish kuni tugashi
    sozlamalarga bog'liq, uni mijozda taxmin qilib bo'lmaydi.
  */
  const notPickedUp = useNotPickedUp();
  const lateIds = useMemo(
    () => new Set((notPickedUp.data ?? []).map((row) => row.childId)),
    [notPickedUp.data],
  );

  const checkIn = useCheckIn();
  const setStatus = useSetAttendanceStatus();

  /** Yuborilishini kutayotgan kirish qaydlari — uzilishda ko'rsatkich (§4.9). */
  const queued = usePendingCheckIns();

  const inside = rows.filter((row) => row.checkInAt && !row.checkOutAt).length;
  // «Kelmadi» — ATAYLAB sabab qo'yilganlar; belgilanmaganlar bunga kirmaydi.
  const absent = rows.filter((row) => !row.checkInAt && row.status).length;

  const search = term.trim().toLowerCase();
  const visible = rows.filter((row) => {
    if (!matches(row, counter as Counter, lateIds)) return false;
    if (!search) return true;
    return childDisplayName(lookup, row.childId, row.childName).toLowerCase().includes(search);
  });

  /*
    Ro'yxatni qisqartirayotgan har qanday shart — tozalash tugmasi AYNAN
    shularni qaytaradi. Ilgari faqat hisoblagich hisobga olinardi va ismni
    yozib qo'yib, keyin uni unutgan foydalanuvchi bo'sh ekranda qolardi.
  */
  const filtered = counter !== "all" || Boolean(search);
  const resetFilters = () => {
    setCounter("all");
    setTerm("");
  };

  /** Guruh bo'yicha bo'limlar — qo'llanma «Sunflowers (12)» ko'rinishini so'raydi. */
  const sections = useMemo(() => {
    const map = new Map<string, { name: string; rows: AttendanceRecord[] }>();
    for (const row of visible) {
      const key = row.groupId ?? "none";
      const entry = map.get(key) ?? { name: row.groupName ?? t("common.labels.noGroup"), rows: [] };
      entry.rows.push(row);
      map.set(key, entry);
    }
    return [...map.entries()]
      .sort((a, b) => a[1].name.localeCompare(b[1].name))
      .map(([key, section]) => ({
        key,
        ...section,
        // Hali hech qanday qayd qo'yilmaganlar — ommaviy amal shularga tegadi.
        pending: section.rows.filter(isPending),
      }));
  }, [visible, t]);

  /** Guruhni birdaniga «keldi» deb belgilash. Har biri alohida so'rov. */
  const markAllPresent = (pending: AttendanceRecord[]) => {
    for (const row of pending) checkIn.mutate({ childId: row.childId });
  };

  return (
    <div className="space-y-4">
      <AttendanceBoardHeader
        term={term}
        onTermChange={setTerm}
        groupId={groupId}
        onGroupChange={setGroupId}
        groups={groups}
        counter={counter as Counter}
        onCounterChange={setCounter}
        counts={{
          pending: rows.filter(isPending).length,
          inside,
          absent,
          notPickedUp: lateIds.size,
          total: rows.length,
        }}
        view={view === "quick" ? "quick" : "cards"}
        onViewChange={setView}
      />

      {/* Kun oxiridagi eng muhim ogohlantirish — qo'llanma buni birinchi qatorga qo'yadi. */}
      {lateIds.size > 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-st-danger-border bg-st-danger-soft px-4 py-2.5 text-sm font-medium text-st-danger-fg">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t("attendance.notPickedUp.banner", { count: lateIds.size })}
          </span>
          <Button variant="outline" size="sm" asChild>
            {/* To'g'ridan-to'g'ri «olib ketilmagan» tabiga — sahifada qidirilmasin. */}
            <Link to="/ichkarida" search={{ tab: "late" }}>
              {t("common.actions.more")}
            </Link>
          </Button>
        </div>
      ) : null}

      {/*
        Yuborilmagan qaydlar (§4.9). Bu xato emas, holat: qayd ekranda turibdi
        va fonda yuborilmoqda — shuning uchun `info` ohangi va bloklovchi
        oyna emas, kichik qator.
      */}
      {queued > 0 ? (
        <div
          aria-live="polite"
          className="flex items-center gap-2 rounded-xl border border-st-info-border bg-st-info-soft px-4 py-2.5 text-sm font-medium text-st-info-fg"
        >
          <CloudOff className="h-4 w-4 shrink-0" />
          {t("attendance.pendingQueue", { count: queued })}
        </div>
      ) : null}

      {/* Ekran o'quvchi kirish/chiqishni eshitsin (§2.11). */}
      <p aria-live="polite" className="sr-only">
        {t("attendance.summary.inside")}: {inside}
      </p>

      {/*
        Bo'sh ekranning ikki sababi bor va ular boshqa-boshqa (§2.8):
        ro'yxatda umuman bola yo'q — yoki bola bor, lekin filtr hammasini
        kesib tashlagan.

        Birinchisida «bu kunda yozuv yo'q» deyish CHALG'ITADI: taxta yozuvlardan
        emas, bolalar reyestridan quriladi, ya'ni sabab — bu guruhda faol bola
        yo'qligi. Shuning uchun matn shuni aytadi va bolalar bazasiga yo'l
        ko'rsatadi. Ikkinchisida esa filtrni tozalash tugmasi kerak.
      */}
      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={visible.length === 0}
        emptyTitle={
          rows.length === 0
            ? t("attendance.noChildren")
            : counter === "pending"
              ? t("attendance.allMarked")
              : t("attendance.noMatch")
        }
        emptyDescription={
          rows.length === 0 ? t("attendance.noChildrenHint") : t("attendance.noMatchHint")
        }
        emptyAction={
          rows.length === 0 ? (
            <Button variant="outline" asChild>
              <Link to="/bolalar">{t("children.title")}</Link>
            </Button>
          ) : filtered ? (
            <Button variant="outline" onClick={resetFilters}>
              {t("common.filters.clear")}
            </Button>
          ) : null
        }
        onRetry={() => void refetch()}
        skeleton={<TableSkeleton columns={4} />}
      >
        <div className="space-y-4">
          {sections.map((section) => (
            <AttendanceGroupSection
              key={section.key}
              section={section}
              view={view === "quick" ? "quick" : "cards"}
              open={!collapsed[section.key]}
              onOpenChange={(next) => setCollapsed((prev) => ({ ...prev, [section.key]: !next }))}
              lookup={lookup}
              canManage={canManage}
              onCheckIn={(childId) => checkIn.mutate({ childId })}
              onSetStatus={(childId, date, status) => setStatus.mutate({ childId, date, status })}
              onMarkAllPresent={markAllPresent}
            />
          ))}
        </div>
      </QueryState>
    </div>
  );
}
