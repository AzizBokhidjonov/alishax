import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { History } from "lucide-react";
import { billingApi, type BillingRun } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/common/Money";
import { formatDateTime } from "@/lib/dates";
import { useErrorToast } from "@/lib/query";
import { useBillingRuns } from "../api";

/**
 * Tugallanmagan hisoblashlar — yarim qolgan ishni tiklash.
 *
 * Oldindan ko'rish SERVERDA saqlanadi: `POST /billing-runs` yurishni yozadi,
 * lekin hisob yozmaydi. Ilgari bu ro'yxat o'qilmasdi va sahifa yopilsa,
 * ko'rib chiqilgan natija yo'qolgandek ko'rinardi — hisobchi esa hammasini
 * boshidan hisoblashga majbur bo'lardi. Yurish esa joyida turgan va uni
 * davom ettirish mumkin edi.
 *
 * Faqat `preview` holatidagilar ko'rsatiladi: tasdiqlangan va bekor
 * qilinganlar tiklanmaydi.
 */
export function UnfinishedRunsPanel({ onResume }: { onResume: (run: BillingRun) => void }) {
  const { t } = useTranslation();
  const showError = useErrorToast();
  const runs = useBillingRuns({ status: "preview" });

  /*
    Ro'yxatdagi yozuvda `lines` bo'lmasligi mumkin, ekran esa satrlarni
    ko'rsatadi — shuning uchun tiklashda to'liq yurish qayta o'qiladi.
  */
  const load = useMutation({
    mutationFn: (id: string) => billingApi.run(id),
    onSuccess: onResume,
    onError: (error) => showError(error),
  });

  const list = runs.data?.data ?? [];
  // Xato bo'lsa ham asosiy oqim ishlashi kerak — panel shunchaki chizilmaydi.
  if (runs.isLoading || runs.error || list.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History aria-hidden className="h-4 w-4" />
          {t("billing.unfinished.title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t("billing.unfinished.hint")}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {list.map((run) => (
          <div
            key={run.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
          >
            <span className="font-semibold tabular-nums">
              {run.month}.{run.year}
            </span>
            <Money value={run.totalTiyin} className="font-medium" />
            <span className="text-sm text-muted-foreground">
              {run.childrenCount ?? run.lines?.length ?? 0} {t("billing.preview.children")}
            </span>
            {run.createdAt ? (
              <span className="text-sm text-muted-foreground">{formatDateTime(run.createdAt)}</span>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              disabled={load.isPending}
              onClick={() => load.mutate(run.id)}
            >
              {t("billing.unfinished.resume")}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
