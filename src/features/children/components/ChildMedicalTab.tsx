import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QueryState } from "@/components/common/QueryState";
import { SelectField } from "@/components/common/SelectField";
import { Field } from "@/components/forms/FormDialog";
import { medicalSchema, type MedicalFormValues } from "@/components/forms/schemas";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { useMedical, useMedicalAlerts, useSaveMedical } from "../api";

const SEVERITIES = ["mild", "moderate", "severe", "anaphylactic"] as const;

/** Tarbiyachi va qabulxona uchun: faqat allergen va ko'rsatma. */
function AlertsOnly({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useMedicalAlerts(childId, true);
  const alerts = data ?? [];

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      isEmpty={alerts.length === 0}
      emptyTitle={t("children.medical.empty")}
      onRetry={() => void refetch()}
      rows={2}
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{t("children.medical.alertsOnly")}</p>
        {alerts.map((alert, index) => (
          <Card
            key={`${alert.allergen}-${index}`}
            className="border-st-danger-border bg-st-danger-soft"
          >
            <CardContent className="flex gap-3 p-4 text-st-danger-fg">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <div className="font-semibold">{alert.allergen}</div>
                {alert.severity ? (
                  <div className="text-xs">{t(`domain.allergySeverity.${alert.severity}`)}</div>
                ) : null}
                {alert.instruction ? <div className="mt-1 text-sm">{alert.instruction}</div> : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </QueryState>
  );
}

function MedicalEditor({ childId, canWrite }: { childId: string; canWrite: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useMedical(childId, true);
  const save = useSaveMedical(childId);

  const form = useForm<MedicalFormValues>({
    resolver: zodResolver(medicalSchema),
    defaultValues: { allergies: [], medications: [] },
  });
  const allergies = useFieldArray({ control: form.control, name: "allergies" });
  const medications = useFieldArray({ control: form.control, name: "medications" });

  useEffect(() => {
    if (data)
      form.reset({ ...data, allergies: data.allergies ?? [], medications: data.medications ?? [] });
  }, [data, form]);

  const submit = form.handleSubmit(async (values) => {
    await save.mutateAsync(values);
  });

  return (
    <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()} rows={4}>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("children.medical.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label={t("children.medical.bloodType")}>
              <Input className="h-11" {...form.register("bloodType")} />
            </Field>
            <Field label={t("children.medical.doctorName")}>
              <Input className="h-11" {...form.register("doctorName")} />
            </Field>
            <Field label={t("children.medical.doctorPhone")}>
              <Input className="h-11" {...form.register("doctorPhone")} />
            </Field>
            <Field label={t("children.medical.clinic")}>
              <Input className="h-11" {...form.register("clinic")} />
            </Field>
            <Field label={t("children.medical.chronicConditions")} className="sm:col-span-2">
              <Textarea rows={2} {...form.register("chronicConditions")} />
            </Field>
            <Field label={t("children.medical.emergencyInstructions")} className="sm:col-span-2">
              <Textarea rows={2} {...form.register("emergencyInstructions")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>{t("children.medical.allergies")}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => allergies.append({ allergen: "" })}
            >
              <Plus className="mr-1 h-4 w-4" />
              {t("children.medical.addAllergy")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {allergies.fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 sm:grid-cols-[1fr_160px_1fr_auto]">
                <Input
                  placeholder={t("children.medical.allergen")}
                  className="h-11"
                  {...form.register(`allergies.${index}.allergen`)}
                />
                <SelectField
                  value={form.watch(`allergies.${index}.severity`) ?? ""}
                  onChange={(value) =>
                    form.setValue(
                      `allergies.${index}.severity`,
                      value as (typeof SEVERITIES)[number],
                    )
                  }
                  options={SEVERITIES.map((severity) => ({
                    value: severity,
                    label: t(`domain.allergySeverity.${severity}`),
                  }))}
                  placeholder={t("children.medical.severity")}
                />
                <Input
                  placeholder={t("children.medical.instruction")}
                  className="h-11"
                  {...form.register(`allergies.${index}.instruction`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 text-destructive"
                  onClick={() => allergies.remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>{t("children.medical.medications")}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => medications.append({ name: "" })}
            >
              <Plus className="mr-1 h-4 w-4" />
              {t("children.medical.addMedication")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {medications.fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <Input
                  placeholder={t("children.medical.medicationName")}
                  className="h-11"
                  {...form.register(`medications.${index}.name`)}
                />
                <Input
                  placeholder={t("children.medical.dosage")}
                  className="h-11"
                  {...form.register(`medications.${index}.dosage`)}
                />
                <Input
                  placeholder={t("children.medical.schedule")}
                  className="h-11"
                  {...form.register(`medications.${index}.schedule`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 text-destructive"
                  onClick={() => medications.remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {canWrite ? (
          <div className="flex justify-end">
            <Button type="submit" className="h-11" disabled={save.isPending}>
              {t("common.actions.save")}
            </Button>
          </div>
        ) : null}
      </form>
    </QueryState>
  );
}

/**
 * Ikki xil interfeys (B6): to'liq yozuv faqat `medical:read` bilan, qolganlar
 * uchun esa faqat ogohlantirishlar. To'liq maydonlar ogohlantirish
 * ko'rinishiga hech qachon tushmaydi.
 */
export function ChildMedicalTab({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const { can } = usePermissions();

  if (can(P.medicalRead)) return <MedicalEditor childId={childId} canWrite={can(P.medicalWrite)} />;
  if (can(P.medicalAlerts)) return <AlertsOnly childId={childId} />;
  return <p className="text-sm text-muted-foreground">{t("children.medical.restricted")}</p>;
}
