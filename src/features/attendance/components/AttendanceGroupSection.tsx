import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useTranslation } from "react-i18next";
import { CheckCheck, ChevronDown } from "lucide-react";
import type { AbsenceStatus, AttendanceRecord } from "@/api";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { childDisplayName, type ChildLookupEntry } from "@/features/children/use-child-lookup";
import { cn, focusRing } from "@/lib/utils";
import { AttendanceCard } from "./AttendanceCard";
import { QuickMarkRow } from "./QuickMarkRow";
import type { BoardView } from "./AttendanceBoardHeader";

export interface BoardSection {
  key: string;
  name: string;
  rows: AttendanceRecord[];
  /** Hali hech qanday qayd qo'yilmaganlar. */
  pending: AttendanceRecord[];
}

interface AttendanceGroupSectionProps {
  section: BoardSection;
  view: BoardView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lookup: Map<string, ChildLookupEntry>;
  canManage: boolean;
  onCheckIn: (childId: string) => void;
  onSetStatus: (childId: string, date: string, status: AbsenceStatus) => void;
  onMarkAllPresent: (rows: AttendanceRecord[]) => void;
}

/**
 * Guruh bo'limi: sarlavha + belgilash jarayoni + bolalar ro'yxati.
 *
 * Sarlavhada «belgilangan / jami» turadi — tarbiyachi butun guruhni bir
 * o'tishda belgilaydi va ishi tugaganini har qatorni tekshirmasdan biladi.
 */
export function AttendanceGroupSection({
  section,
  view,
  open,
  onOpenChange,
  lookup,
  canManage,
  onCheckIn,
  onSetStatus,
  onMarkAllPresent,
}: AttendanceGroupSectionProps) {
  const { t } = useTranslation();
  const marked = section.rows.length - section.pending.length;
  const complete = section.pending.length === 0;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-wrap items-center gap-2">
        <CollapsibleTrigger
          className={cn(
            "flex min-h-11 flex-1 items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-secondary",
            focusRing,
          )}
        >
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", !open && "-rotate-90")}
          />
          <span className="font-bold">{section.name}</span>
          <span
            className={cn(
              "text-sm",
              complete ? "font-medium text-st-ok-fg" : "text-muted-foreground",
            )}
          >
            {marked} / {section.rows.length}
          </span>
        </CollapsibleTrigger>

        {/*
          Ertalab guruhning deyarli hammasi keladi: bittalab bosish o'rniga
          bir amal, keyin kelmaganlari alohida belgilanadi. Kirish qaydi bor
          bolalarga tegilmaydi.
        */}
        {canManage && !complete ? (
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm" className="h-11 shrink-0">
                <CheckCheck className="mr-1.5 h-4 w-4" />
                {t("attendance.markAllPresent", { count: section.pending.length })}
              </Button>
            }
            title={t("flows.bulkTitle")}
            description={t("flows.bulkHint", {
              group: section.name,
              count: section.pending.length,
            })}
            onConfirm={() => onMarkAllPresent(section.pending)}
          />
        ) : null}
      </div>

      <CollapsibleContent>
        {view === "quick" ? (
          <div className="overflow-hidden rounded-xl border border-border">
            {section.rows.map((row) => (
              <QuickMarkRow
                key={row.id ?? row.childId}
                row={row}
                name={childDisplayName(lookup, row.childId, row.childName)}
                photoFileId={lookup.get(row.childId)?.photoFileId}
                canManage={canManage}
                onCheckIn={onCheckIn}
                onSetStatus={(childId, status) => onSetStatus(childId, row.date, status)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3 pt-2">
            {section.rows.map((row) => (
              <AttendanceCard
                key={row.id ?? row.childId}
                row={row}
                name={childDisplayName(lookup, row.childId, row.childName)}
                photoFileId={lookup.get(row.childId)?.photoFileId}
                canManage={canManage}
                onCheckIn={onCheckIn}
                onSetStatus={(childId, status) => onSetStatus(childId, row.date, status)}
              />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
