import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRightLeft, UserPlus } from "lucide-react";
import { isApiError, type ChildDetail } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/forms/FormDialog";
import { SelectField } from "@/components/common/SelectField";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { todayIso } from "@/lib/dates";
import { useAssignChildToGroup, useGroupOptions, useTransferChild } from "@/features/groups/api";
import { DatePicker } from "@/components/common/DateField";

/**
 * Bola profilidagi guruh kartasi.
 *
 * Guruh a'zoligi bolaning maydoni emas — u sana bilan yoziladigan tarix,
 * shuning uchun bu yerda ham alohida amallar ishlatiladi:
 * `POST /groups/:id/children` (biriktirish) va `POST /groups/:id/transfer`
 * (ko'chirish).
 */
export function ChildGroupCard({ child }: { child: ChildDetail }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const groups = useGroupOptions();
  const assign = useAssignChildToGroup();
  const currentGroupId = child.groupId ?? child.group?.id ?? "";
  const transfer = useTransferChild(currentGroupId);

  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(todayIso());
  const [reason, setReason] = useState("");
  const [capacityHit, setCapacityHit] = useState(false);

  const canManage = can(P.groupManage);
  const canForce = can(P.groupCapacityOverride);
  const isTransfer = Boolean(currentGroupId);

  const submit = async (force = false) => {
    try {
      if (isTransfer) {
        await transfer.mutateAsync({
          dto: {
            childId: child.id,
            toGroupId: groupId,
            effectiveDate,
            reason: reason || undefined,
          },
          force,
        });
      } else {
        await assign.mutateAsync({ groupId, dto: { childId: child.id, effectiveDate }, force });
      }
      setOpen(false);
      setCapacityHit(false);
    } catch (error) {
      // Sig'im to'lganda majburiy variantni faqat ruxsati borlarga ko'rsatamiz.
      if (isApiError(error) && error.code === "CAPACITY_EXCEEDED" && canForce) setCapacityHit(true);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("common.labels.group")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-lg font-semibold">
          {child.groupName ?? child.group?.name ?? t("children.noGroup")}
        </div>

        {canManage ? (
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) setCapacityHit(false);
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                {isTransfer ? (
                  <>
                    <ArrowRightLeft className="mr-1 h-4 w-4" />
                    {t("groups.transfer.title")}
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-1 h-4 w-4" />
                    {t("groups.assign.title")}
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {isTransfer ? t("groups.transfer.title") : t("groups.assign.title")}
                </DialogTitle>
                <DialogDescription>{t("enroll.groupHint")}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <SelectField
                  label={isTransfer ? t("groups.transfer.toGroup") : t("common.labels.group")}
                  value={groupId}
                  onChange={setGroupId}
                  options={groups.filter((group) => group.value !== currentGroupId)}
                />
                <Field label={t("groups.assign.effectiveDate")}>
                  <DatePicker value={effectiveDate} onChange={setEffectiveDate} clearable={false} />
                </Field>
                {isTransfer ? (
                  <Field label={t("groups.transfer.reason")}>
                    <Textarea
                      rows={2}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                    />
                  </Field>
                ) : null}

                {capacityHit ? (
                  <div className="rounded-xl border border-st-warn-border bg-st-warn-soft p-3 text-sm text-st-warn-fg">
                    {t("groups.assign.forceText")}
                  </div>
                ) : null}
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  {t("common.actions.cancel")}
                </Button>
                {capacityHit ? (
                  <Button variant="outline" onClick={() => void submit(true)}>
                    {t("groups.assign.force")}
                  </Button>
                ) : null}
                <Button disabled={!groupId} onClick={() => void submit(false)}>
                  {t("common.actions.save")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardContent>
    </Card>
  );
}
