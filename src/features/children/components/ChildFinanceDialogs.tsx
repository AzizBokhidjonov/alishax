import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/common/SelectField";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import {
  assignTariffSchema,
  discountSchema,
  type AssignTariffFormValues,
  type DiscountFormValues,
} from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { todayIso } from "@/lib/dates";
import { percentToBasisPoints, toTiyin } from "@/lib/money";
import { useAssignTariff, useCreateDiscount, useTariffs } from "@/features/finance/api";
import { DatePicker } from "@/components/common/DateField";

export function AssignTariffDialog({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const { data } = useTariffs({ active: true });
  const assign = useAssignTariff(childId);

  const form = useEntityForm<AssignTariffFormValues>({
    schema: assignTariffSchema,
    defaults: () => ({ tariffId: "", effectiveFrom: todayIso() }),
    onSubmit: async (values) => {
      await assign.mutateAsync(values);
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button size="sm" variant="outline">
          <Plus className="mr-1 h-4 w-4" />
          {t("tariffs.assign.title")}
        </Button>
      }
      title={t("tariffs.assign.title")}
      submitLabel={t("common.actions.assign")}
      description={t("tariffs.futureOnlyHint")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <SelectField
          label={t("tariffs.assign.tariff")}
          value={watch("tariffId")}
          onChange={(value) => setValue("tariffId", value, { shouldValidate: true })}
          options={(data?.data ?? []).map((tariff) => ({
            value: tariff.id,
            label: tariff.name,
          }))}
          error={error("tariffId")}
        />
        <Field label={t("tariffs.assign.effectiveFrom")} error={error("effectiveFrom")}>
          <DatePicker
            value={watch("effectiveFrom") ?? ""}
            onChange={(value) => setValue("effectiveFrom", value, { shouldValidate: true })}
          />
        </Field>
        <Field label={t("tariffs.assign.effectiveTo")} error={error("effectiveTo")}>
          <DatePicker
            value={watch("effectiveTo") ?? ""}
            onChange={(value) => setValue("effectiveTo", value, { shouldValidate: true })}
          />
        </Field>
      </div>
    </FormDialog>
  );
}

export function DiscountDialog({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const create = useCreateDiscount(childId);

  const form = useEntityForm<DiscountFormValues>({
    schema: discountSchema,
    defaults: () => ({ kind: "percent", value: "", validFrom: todayIso(), reason: "" }),
    onSubmit: async (values) => {
      // `percent` bazis punktda, `fixed` esa tiyinda yuboriladi.
      await create.mutateAsync({
        kind: values.kind,
        value:
          values.kind === "percent" ? percentToBasisPoints(values.value) : toTiyin(values.value),
        validFrom: values.validFrom,
        validTo: values.validTo,
        reason: values.reason,
      });
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);
  const kind = watch("kind");

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button size="sm" variant="outline">
          <Plus className="mr-1 h-4 w-4" />
          {t("tariffs.discounts.add")}
        </Button>
      }
      title={t("tariffs.discounts.add")}
      description={t("flows.discountHint")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <SelectField
          label={t("tariffs.discounts.kind")}
          value={kind}
          onChange={(value) => {
            setValue("kind", value as DiscountFormValues["kind"], { shouldValidate: true });
            setValue("value", "", { shouldValidate: true });
          }}
          options={[
            { value: "percent", label: t("domain.discountKind.percent") },
            { value: "fixed", label: t("domain.discountKind.fixed") },
          ]}
        />
        <Field
          label={t(kind === "percent" ? "flows.percent" : "flows.fixed")}
          hint={
            kind === "percent"
              ? t("tariffs.discounts.percentHint")
              : t("tariffs.discounts.fixedHint")
          }
          error={error("value")}
        >
          <Input className="h-11" inputMode="decimal" {...register("value")} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("tariffs.discounts.validFrom")} error={error("validFrom")}>
            <DatePicker
              value={watch("validFrom") ?? ""}
              onChange={(value) => setValue("validFrom", value, { shouldValidate: true })}
            />
          </Field>
          <Field label={t("tariffs.discounts.validTo")} error={error("validTo")}>
            <DatePicker
              value={watch("validTo") ?? ""}
              onChange={(value) => setValue("validTo", value, { shouldValidate: true })}
            />
          </Field>
        </div>
        <Field label={t("tariffs.discounts.reason")} error={error("reason")}>
          <Textarea rows={2} {...register("reason")} />
        </Field>
      </div>
    </FormDialog>
  );
}
