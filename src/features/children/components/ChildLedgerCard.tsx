import { useTranslation } from "react-i18next";
import { Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { AdjustmentDialog, RecalculateDialog } from "./ChildLedgerDialogs";
import { CurrentCharges, LedgerTable } from "./ChildLedgerTables";
export function ChildLedgerCard({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const { can } = usePermissions();

  /*
    Tuzatish IKKI ruxsatni talab qiladi (§5, Adjustments) — server ham
    shunday tekshiradi. Bittasi bo'lsa tugma ko'rsatilmaydi: ko'rsatilgan,
    lekin har doim 403 beradigan tugma yomonroq.
  */
  const canAdjust = can(P.chargeGenerate) && can(P.chargeReverse);

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale aria-hidden className="h-4 w-4" />
          {t("charges.title")}
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          {canAdjust ? <AdjustmentDialog childId={childId} /> : null}
          {can(P.chargeGenerate) ? <RecalculateDialog childId={childId} /> : null}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="current">
          <TabsList className="mx-4 mt-1">
            <TabsTrigger value="current">{t("charges.tabs.current")}</TabsTrigger>
            <TabsTrigger value="ledger">{t("charges.tabs.ledger")}</TabsTrigger>
          </TabsList>
          <TabsContent value="current">
            <CurrentCharges childId={childId} />
          </TabsContent>
          <TabsContent value="ledger">
            <LedgerTable childId={childId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
