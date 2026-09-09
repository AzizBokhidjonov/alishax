import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LogOut, UserRoundSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/PageHeader";
import { ChildPicker } from "@/components/common/EntityPicker";
import { EmptyState } from "@/components/common/EmptyState";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { useInside } from "@/features/attendance/api";
import { childDisplayName, useChildLookup } from "@/features/children/use-child-lookup";
import { PickupPersonsPanel } from "./components/PickupPersonsPanel";
import { PickupPersonPicker } from "./components/PickupPersonPicker";
import { PickupVerdict } from "./components/PickupVerdict";
import { usePickupCheckOut } from "./use-pickup-checkout";

/**
 * Qabulxonaning xavfsizlik ekrani (§5.2).
 *
 * Oqim uch qadam va ular ekranda ham shu tartibda turadi: bola → olib
 * ketuvchi → hukm va tasdiq. Tasdiq AYNAN shu yerda, chunki qo'llanma
 * talabi bitta: `POST /attendance/check-out` ga yagona yo'l tekshiruvdan
 * o'tadi. Ilgari bu sahifa faqat «tekshirar», chiqish esa davomat taxtasida
 * qayd etilardi — ya'ni tekshiruvni butunlay chetlab o'tsa bo'lardi.
 */
export function PickupPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [childId, setChildId] = useState("");

  const lookup = useChildLookup();
  const childName = childId ? childDisplayName(lookup, childId, undefined) : "";

  /*
    Ichkarida bo'lmagan bolani berib bo'lmaydi va buni server ham aytadi
    (`NOT_CHECKED_IN`). Lekin bu holat tanlash paytidayoq ma'lum — tugmani
    bosib, xato kutib o'tirish shart emas (§5.2 «sabab va keyingi qadam»).
  */
  const inside = useInside();
  const isInside = (inside.data ?? []).some((row) => row.childId === childId);

  const flow = usePickupCheckOut(childId, { childName, enabled: Boolean(childId) });

  const selectChild = (value: string) => {
    setChildId(value);
    flow.reset();
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("pickup.title")} subtitle={t("pickup.verify.hint")} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("pickup.verify.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChildPicker label={t("pickup.verify.child")} value={childId} onChange={selectChild} />

            {childId ? (
              <div className="space-y-2">
                <span className="text-sm font-medium">{t("pickup.verify.person")}</span>
                <PickupPersonPicker
                  childId={childId}
                  value={flow.personId}
                  onChange={flow.selectPerson}
                  className="max-h-96 overflow-y-auto"
                />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card
          className={
            !childId || !flow.personId || flow.verify.isLoading || flow.verifyError
              ? undefined
              : flow.allowed
                ? "border-st-ok-border bg-st-ok-soft"
                : "border-st-danger-border bg-st-danger-soft"
          }
        >
          <CardContent className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center">
            <PickupVerdict
              childId={childId}
              personId={flow.personId}
              data={flow.verdict}
              isLoading={flow.verify.isLoading}
              error={flow.verifyError}
            />

            {/*
              Tasdiq faqat ruxsat berilganda ko'rinadi. «Ichkarida emas»
              holati alohida aytiladi: bu rad etish emas, tartib xatosi —
              avval kirish qayd etilishi kerak.
            */}
            {flow.allowed ? (
              isInside ? (
                <div className="w-full space-y-3 pt-2">
                  <Textarea
                    rows={2}
                    placeholder={t("attendance.noteOptional")}
                    value={flow.note}
                    onChange={(event) => flow.setNote(event.target.value)}
                  />
                  <Button
                    className="h-12 w-full text-base"
                    disabled={flow.pending}
                    onClick={flow.submit}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    {t("attendance.checkOut")}
                  </Button>
                </div>
              ) : (
                <p className="text-sm font-medium text-st-warn-fg">
                  {t("pickup.verify.notInside")}
                </p>
              )
            ) : null}
          </CardContent>
        </Card>
      </div>

      {childId ? (
        <PickupPersonsPanel childId={childId} canManage={can(P.pickupManage)} />
      ) : (
        /*
          Bola tanlanmaguncha sahifada faqat ikkita bo'sh karta turardi va
          nima qilish kerakligi aytilmasdi.
        */
        <EmptyState icon={UserRoundSearch} title={t("pickup.selectChild")} />
      )}
    </div>
  );
}
