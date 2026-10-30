import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MoneyInput } from "@/components/common/MoneyInput";
import { SelectField } from "@/components/common/SelectField";
import { DatePicker } from "@/components/common/DateField";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { adjustmentSchema, type AdjustmentFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { toTiyin } from "@/lib/money";
import { todayIso } from "@/lib/dates";
import { formatPeriod } from "@/lib/billing-labels";
import {
  useCreateAdjustment,
  usePeriods,
  useRecalculateChildBilling,
} from "@/features/finance/api";
export function AdjustmentDialog({ childId }: { childId: string }) {
  const { t, i18n } = useTranslation();
  const periods = usePeriods();
  const adjust = useCreateAdjustment();

  const form = useEntityForm<AdjustmentFormValues>({
    schema: adjustmentSchema,
    defaults: () => ({ periodId: "", sign: "-1", amountSom: "", reason: "" }),
    onSubmit: async (values) => {
      await adjust.mutateAsync({
        childId,
        periodId: values.periodId,
        sign: values.sign === "-1" ? -1 : 1,
        amountTiyin: toTiyin(values.amountSom),
        reason: values.reason,
        dueDate: values.dueDate,
      });
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);
  const sign = watch("sign");

  /* Faqat OCHIQ davrga tuzatish kiritiladi — yopilgani serverda rad etiladi. */
  const openPeriods = (periods.data ?? []).filter((period) => period.status !== "closed");

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button size="sm" variant="outline">
          <Plus className="mr-1 h-4 w-4" />
          {t("charges.adjust.title")}
        </Button>
      }
      title={t("charges.adjust.title")}
      description={t("charges.adjust.hint")}
      submitLabel={t("common.actions.save")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <SelectField
          label={t("charges.columns.period")}
          value={watch("periodId")}
          onChange={(value) => setValue("periodId", value, { shouldValidate: true })}
          options={openPeriods.map((period) => ({
            value: period.id,
            label: formatPeriod(period, i18n.language),
          }))}
          error={error("periodId")}
        />

        <SelectField
          label={t("charges.adjust.direction")}
          value={sign}
          onChange={(value) => setValue("sign", value as "-1" | "1", { shouldValidate: true })}
          options={[
            { value: "-1", label: t("charges.adjust.credit") },
            { value: "1", label: t("charges.adjust.debit") },
          ]}
          error={error("sign")}
        />

        <MoneyInput
          label={t("charges.columns.amount")}
          value={watch("amountSom")}
          onChange={(value) => setValue("amountSom", value, { shouldValidate: true })}
          error={error("amountSom")}
          hint={sign === "-1" ? t("charges.adjust.creditHint") : t("charges.adjust.debitHint")}
        />

        <Field label={t("common.labels.reason")} error={error("reason")}>
          <Textarea rows={3} {...register("reason")} />
        </Field>

        <Field label={t("charges.adjust.dueDate")} error={error("dueDate")}>
          <DatePicker
            value={watch("dueDate") ?? ""}
            onChange={(value) => setValue("dueDate", value, { shouldValidate: true })}
            clearable
          />
        </Field>
      </div>
    </FormDialog>
  );
}

export function RecalculateDialog({ childId }: { childId: string }) {
  const { t, i18n } = useTranslation();
  const [currentYear, currentMonth] = todayIso().split("-");
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(String(Number(currentMonth)));
  const recalculate = useRecalculateChildBilling(childId);

  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const valid =
    Number.isInteger(yearNumber) &&
    yearNumber >= 2000 &&
    yearNumber <= 2100 &&
    Number.isInteger(monthNumber) &&
    monthNumber >= 1 &&
    monthNumber <= 12;

  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="sm" variant="outline">
          <RefreshCw className="mr-1 h-4 w-4" />
          {t("charges.recalculate.title")}
        </Button>
      }
      title={t("charges.recalculate.title")}
      description={t("charges.recalculate.hint")}
      submitLabel={t("charges.recalculate.title")}
      canSubmit={valid}
      pending={recalculate.isPending}
      onSubmit={() =>
        recalculate.mutate(
          { year: yearNumber, month: monthNumber },
          { onSuccess: () => setOpen(false) },
        )
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("periods.columns.year")}>
          <Input
            inputMode="numeric"
            value={year}
            onChange={(event) => setYear(event.target.value)}
          />
        </Field>
        <SelectField
          label={t("periods.columns.month")}
          value={month}
          onChange={setMonth}
          options={Array.from({ length: 12 }, (_, index) => ({
            value: String(index + 1),
            label: formatPeriod({ year: yearNumber || 2026, month: index + 1 }, i18n.language),
          }))}
        />
      </div>
    </FormDialog>
  );
}
