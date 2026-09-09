import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REPORTS, type ReportDef } from "../constants";
import { focusRing } from "@/lib/utils";

const GROUPS = ["attendance", "children", "finance", "expenses"] as const;

/** Chap ustundagi hisobotlar ro'yxati, guruhlarga ajratilgan. */
export function ReportPicker({
  selected,
  onSelect,
}: {
  selected: ReportDef;
  onSelect: (report: ReportDef) => void;
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("reports.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {GROUPS.map((group) => (
          <div key={group}>
            <div className="px-2 pb-1 text-xs font-semibold uppercase text-muted-foreground">
              {t(`reports.groups.${group}`)}
            </div>
            {REPORTS.filter((report) => report.group === group).map((report) => (
              <button
                key={report.path}
                type="button"
                onClick={() => onSelect(report)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm ${focusRing} ${
                  report.path === selected.path
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                }`}
              >
                {t(`reports.items.${report.path}`)}
              </button>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
