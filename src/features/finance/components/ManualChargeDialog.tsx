import { useTranslation } from "react-i18next";
import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { MoneyInput } from "@/components/common/MoneyInput";
import { SelectField } from "@/components/common/SelectField";
import { ChildPicker } from "@/components/common/EntityPicker";
import { manualChargeSchema, type ManualChargeFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { currentPeriod, periodLabel } from "@/lib/dates";
import { toTiyin } from "@/lib/money";
import { useLanguage } from "@/i18n/useLanguage";
import { useCreateManualCharge, usePeriods } from "../api";

export function ManualChargeDialog() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { data: periods } = usePeriods(currentPeriod().year);
  const create = useCreateManualCharge();

  const form = useEntityForm<ManualChargeFormValues>({
    schema: manualChargeSchema,
    defaults: () => ({ childId: "", periodId: "", amountSom: "", description: "" }),
    onSubmit: async (values) => {
      await create.mutateAsync({
        childId: values.childId,
        periodId: values.periodId,
        amountTiyin: toTiyin(values.amountSom),
        description: values.description,
      });
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const selected = (periods ?? []).find((period) => period.id === watch("periodId"));
  const selectedClosed = selected?.status === "closed";
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button className="h-11">
          <Plus className="mr-2 h-4 w-4" />
          {t("charges.add")}
        </Button>
      }
      title={t("charges.manual.title")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit && !selectedClosed}
      pending={form.pending}
    >
      <div className="space-y-3">
        <ChildPicker
          label={t("charges.manual.child")}
          value={watch("childId")}
          onChange={(value) => setValue("childId", value, { shouldValidate: true })}
          error={error("childId")}
        />
        <SelectField
          label={t("charges.manual.period")}
          value={watch("periodId")}
          onChange={(value) => setValue("periodId", value, { shouldValidate: true })}
          /*
            Yopiq davr ro'yxatda ko'rinadi, lekin qulf bilan belgilanadi va
            tanlansa saqlash to'siladi — 409 ni submit'da kutmaymiz (§4.7).
          */
          options={(periods ?? []).map((period) => ({
            value: period.id,
            label:
              periodLabel(period.year, period.month, language) +
              (period.status === "closed" ? ` 🔒 ${t("domain.periodStatus.closed")}` : ""),
          }))}
          error={error("periodId")}
        />
        {selectedClosed ? (
          <div className="flex items-start gap-2 rounded-xl border border-st-danger-border bg-st-danger-soft p-3 text-sm text-st-danger-fg">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {t("periods.closedWall", {
                period: periodLabel(selected!.year, selected!.month, language),
              })}
            </span>
          </div>
        ) : null}
        <MoneyInput
          label={t("charges.manual.amount")}
          value={watch("amountSom") ?? ""}
          onChange={(value) => setValue("amountSom", value, { shouldValidate: true })}
          error={error("amountSom")}
        />
        <Field label={t("charges.manual.description")} error={error("description")}>
          <Input className="h-11" {...register("description")} />
        </Field>
      </div>
    </FormDialog>
  );
}
