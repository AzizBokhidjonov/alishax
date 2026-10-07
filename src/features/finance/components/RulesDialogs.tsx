import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlaskConical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Money } from "@/components/common/Money";
import { ChildPicker } from "@/components/common/EntityPicker";
import { DatePicker } from "@/components/common/DateField";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import {
  billingRulesSchema,
  simulateSchema,
  type BillingRulesFormValues,
  type SimulateFormValues,
} from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { currentPeriod, todayIso } from "@/lib/dates";
import { useCreateBillingRules, useSimulateBilling } from "../api";
import { RulesSimulatePanel } from "./RulesSimulatePanel";

function parseRules(json: string): Record<string, unknown> {
  return JSON.parse(json) as Record<string, unknown>;
}

/** Yangi versiya yaratish — mavjud versiya hech qachon o'zgartirilmaydi. */
export function RulesFormDialog({ template }: { template?: Record<string, unknown> }) {
  const { t } = useTranslation();
  const create = useCreateBillingRules();
  /*
    Tekshirilgan JSON matni. Foydalanuvchi qoidalarni tekshirgandan keyin
    tahrirni davom ettirsa, bu qiymat joriy matnga mos kelmay qoladi va
    saqlash yana to'siladi — «tekshirmasdan saqlash» yo'q (§7.1).
  */
  const [simulatedJson, setSimulatedJson] = useState<string | null>(null);

  const form = useEntityForm<BillingRulesFormValues>({
    schema: billingRulesSchema,
    defaults: () => ({
      effectiveFrom: todayIso(),
      rulesJson: JSON.stringify(template ?? {}, null, 2),
    }),
    onSubmit: async (values) => {
      let rules: Record<string, unknown>;
      try {
        rules = parseRules(values.rulesJson);
      } catch {
        form.form.setError("rulesJson", { message: "billing.rules.invalidJson" });
        throw new Error("invalid json");
      }
      await create.mutateAsync({
        effectiveFrom: values.effectiveFrom,
        rules,
        note: values.note,
      });
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);
  const rulesJson = watch("rulesJson") ?? "";
  const simulated = simulatedJson !== null && simulatedJson === rulesJson;

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button className="h-11">
          <Plus className="mr-2 h-4 w-4" />
          {t("billing.rules.create")}
        </Button>
      }
      title={t("billing.rules.create")}
      submitLabel={t("common.actions.save")}
      description={t("billing.rules.createHint")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit && simulated}
      pending={form.pending}
      contentClassName="max-w-2xl"
    >
      <div className="space-y-3">
        <Field label={t("billing.rules.effectiveFrom")} error={error("effectiveFrom")}>
          <DatePicker
            value={watch("effectiveFrom") ?? ""}
            onChange={(value) => setValue("effectiveFrom", value, { shouldValidate: true })}
          />
        </Field>
        <Field label={t("billing.rules.note")} error={error("note")}>
          <Input className="h-11" {...register("note")} />
        </Field>
        <Field label={t("billing.rules.json")} error={error("rulesJson")}>
          <Textarea rows={16} className="font-mono text-xs" {...register("rulesJson")} />
        </Field>

        <RulesSimulatePanel rulesJson={rulesJson} onSimulated={setSimulatedJson} />

        {!simulated ? (
          <p className="text-xs text-st-warn-fg">{t("billing.rules.simulateBeforeSave")}</p>
        ) : null}
      </div>
    </FormDialog>
  );
}

/** Saqlashdan oldin bitta bolada natijani tekshirish (`/billing-rules/simulate`). */
export function SimulateDialog() {
  const { t } = useTranslation();
  const simulate = useSimulateBilling();
  const period = currentPeriod();

  const form = useEntityForm<SimulateFormValues>({
    schema: simulateSchema,
    defaults: () => ({ childId: "", year: period.year, month: period.month }),
    onSubmit: async (values) => {
      await simulate.mutateAsync(values);
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button variant="outline" className="h-11">
          <FlaskConical className="mr-2 h-4 w-4" />
          {t("billing.rules.simulate")}
        </Button>
      }
      title={t("billing.rules.simulate")}
      description={t("billing.rules.simulateHint")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
      submitLabel={t("billing.rules.simulate")}
    >
      <div className="space-y-3">
        <ChildPicker
          permission="billing_rules:manage"
          label={t("billing.rules.simulateChild")}
          value={watch("childId")}
          onChange={(value) => setValue("childId", value, { shouldValidate: true })}
          error={error("childId")}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("common.labels.year")} error={error("year")}>
            <Input type="number" className="h-11" {...register("year")} />
          </Field>
          <Field label={t("common.labels.month")} error={error("month")}>
            <Input type="number" min={1} max={12} className="h-11" {...register("month")} />
          </Field>
        </div>
        {simulate.data ? (
          <div className="rounded-xl border border-border p-3">
            <div className="text-sm text-muted-foreground">{t("billing.rules.simulateResult")}</div>
            <Money value={simulate.data.amountTiyin} className="text-xl font-bold" />
          </div>
        ) : null}
      </div>
    </FormDialog>
  );
}
