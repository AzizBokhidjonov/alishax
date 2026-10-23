import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import type { PaymentMethod } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { SelectField } from "@/components/common/SelectField";
import { MoneyInput } from "@/components/common/MoneyInput";
import { ChildPicker, PayerPicker } from "@/components/common/EntityPicker";
import { FileUploadField } from "@/components/common/FileUploadField";
import { paymentSchema, type PaymentFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { isoToLocalInput, localInputToIso } from "@/lib/dates";
import { useClosedPeriod } from "../use-closed-period";
import { ClosedPeriodNotice } from "./ClosedPeriodNotice";
import { useIdempotencyKey } from "@/lib/idempotency";
import { toTiyin } from "@/lib/money";
import { useCreatePayment } from "../api";
import { PaymentAllocations, type AllocationMap } from "./PaymentAllocations";
import { DateTimePicker } from "@/components/common/DateField";

const METHODS: PaymentMethod[] = ["cash", "bank", "card", "online", "other"];

/**
 * To'lov qabul qilish (B14).
 *
 * `Idempotency-Key` forma ochilganda yaratiladi va qayta urinishda o'zgarmaydi.
 * Taqsimot bo'sh bo'lsa server FIFO bo'yicha eng eski hisobdan yopadi, ortiqcha
 * summa avans sifatida qoladi.
 */
export function PaymentFormDialog({ childId }: { childId?: string }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const create = useCreatePayment();
  const idempotency = useIdempotencyKey();
  const [manual, setManual] = useState(false);
  const [allocations, setAllocations] = useState<AllocationMap>({});

  const form = useEntityForm<PaymentFormValues>({
    schema: paymentSchema,
    defaults: () => ({
      childId: childId ?? "",
      amountSom: "",
      method: "cash" as PaymentMethod,
      paidAt: isoToLocalInput(new Date().toISOString()),
    }),
    onSubmit: async (values) => {
      const list = Object.entries(allocations)
        .filter(([, amount]) => amount.trim() !== "")
        .map(([chargeId, amount]) => ({ chargeId, amountTiyin: toTiyin(amount) }));

      await create.mutateAsync({
        dto: {
          childId: values.childId,
          payerGuardianId: values.payerGuardianId,
          amountTiyin: toTiyin(values.amountSom),
          method: values.method,
          paidAt: localInputToIso(values.paidAt),
          receiptNo: values.receiptNo,
          bankRef: values.bankRef,
          attachmentFileId: values.attachmentFileId,
          note: values.note,
          allocations: can(P.chargeRead) && manual && list.length > 0 ? list : undefined,
        },
        idempotencyKey: idempotency.get(),
      });
      idempotency.reset();
      setAllocations({});
      setManual(false);
    },
  });

  const { register, watch, setValue, formState } = form.form;
  // `datetime-local` qiymatining sana qismi davrni aniqlaydi.
  const paidDate = (watch("paidAt") ?? "").slice(0, 10);
  const { closed: periodClosed } = useClosedPeriod(paidDate);
  const error = useFieldError(formState.errors);
  const selectedChild = watch("childId");

  return (
    <FormDialog
      open={form.open}
      onOpenChange={(next) => {
        form.setOpen(next);
        if (next) idempotency.get();
      }}
      trigger={
        <Button className="h-11">
          <Plus className="mr-2 h-4 w-4" />
          {t("payments.add")}
        </Button>
      }
      title={t("payments.add")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit && !periodClosed}
      pending={form.pending}
      contentClassName="max-w-lg"
    >
      <div className="space-y-3">
        {childId ? null : (
          <ChildPicker
            permission="payment:create"
            label={t("payments.form.child")}
            value={selectedChild}
            onChange={(value) => {
              setValue("childId", value, { shouldValidate: true });
              /*
                Bola almashdi — to'lovchi va qo'lda taqsimot YARAMAYDI:
                ular oldingi bolaning yozuvlariga tegishli. Tozalanmasa,
                boshqa bolaning ota-onasi to'lovchi bo'lib qolardi (§0).
              */
              setValue("payerGuardianId", undefined);
              setAllocations({});
              setManual(false);
            }}
            error={error("childId")}
          />
        )}
        {/*
          To'lovchi FAQAT shu bolaga bog'langanlar ichidan tanlanadi.
          Ilgari bu butun vasiylar katalogi edi.
        */}
        <PayerPicker
          label={t("payments.form.payer")}
          childId={selectedChild}
          value={watch("payerGuardianId") ?? ""}
          onChange={(value) => setValue("payerGuardianId", value)}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <MoneyInput
            label={t("payments.form.amount")}
            value={watch("amountSom")}
            onChange={(value) => setValue("amountSom", value, { shouldValidate: true })}
            error={error("amountSom")}
          />
          <SelectField
            label={t("payments.form.method")}
            value={watch("method")}
            onChange={(value) =>
              setValue("method", value as PaymentMethod, { shouldValidate: true })
            }
            options={METHODS.map((method) => ({
              value: method,
              label: t(`domain.paymentMethod.${method}`),
            }))}
            error={error("method")}
          />
          <Field label={t("payments.form.paidAt")} error={error("paidAt")}>
            <DateTimePicker
              value={watch("paidAt") ?? ""}
              onChange={(value) => setValue("paidAt", value, { shouldValidate: true })}
            />
          </Field>
          {/* Yopiq davrga to'lov yozib bo'lmaydi — sana tanlangan zahoti aytiladi. */}
          <ClosedPeriodNotice date={paidDate} />
          <Field label={t("payments.form.receiptNo")} error={error("receiptNo")}>
            <Input className="h-11" {...register("receiptNo")} />
          </Field>
          <Field label={t("payments.form.bankRef")} error={error("bankRef")}>
            <Input className="h-11" {...register("bankRef")} />
          </Field>
        </div>

        {can(P.fileManage) ? (
          <FileUploadField
            label={t("payments.form.attachment")}
            value={watch("attachmentFileId")}
            onChange={(fileId) => setValue("attachmentFileId", fileId)}
          />
        ) : null}

        {can(P.chargeRead) ? (
          <div className="space-y-2 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="manual-allocation">{t("payments.form.allocationsTitle")}</Label>
              <Switch id="manual-allocation" checked={manual} onCheckedChange={setManual} />
            </div>
            {manual && selectedChild ? (
              <PaymentAllocations
                childId={selectedChild}
                amountSom={watch("amountSom")}
                allocations={allocations}
                onChange={setAllocations}
              />
            ) : (
              <p className="text-xs text-muted-foreground">{t("payments.form.allocationsHint")}</p>
            )}
          </div>
        ) : null}

        <Field label={t("payments.form.note")} error={error("note")}>
          <Textarea rows={2} {...register("note")} />
        </Field>
      </div>
    </FormDialog>
  );
}
