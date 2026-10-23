import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Settings } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QueryState } from "@/components/common/QueryState";
import { SelectField } from "@/components/common/SelectField";
import { AuthImage } from "@/components/common/AuthImage";
import { TimeInput } from "@/components/common/DateField";
import { Field } from "@/components/forms/FormDialog";
import { settingsSchema, type SettingsFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { cn, focusRing } from "@/lib/utils";
import { useSettings, useUpdateSettings } from "../api";
import { settingsToDto, settingsToForm } from "../settings-form";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
const CHANGED = { shouldDirty: true, shouldValidate: true };
const TEXT_FIELDS = ["currency", "timezone", "receiptNumberFormat"] as const;

export function GeneralSettingsForm({
  settings,
  canManage,
}: {
  settings: Settings;
  canManage: boolean;
}) {
  const { t } = useTranslation();
  const update = useUpdateSettings();
  const editor = useEntityForm<SettingsFormValues>({
    schema: settingsSchema,
    defaults: settingsToForm(settings),
    onSubmit: save,
  });
  const { form } = editor;
  const { register, watch, setValue, reset, formState } = form;
  const fieldError = useFieldError(formState.errors);
  const hasEdits = Object.keys(formState.dirtyFields).length > 0;
  const disabled = !canManage || editor.pending;

  useEffect(() => {
    // Fon so'rovi foydalanuvchi tahrirlayotgan maydonlarni almashtirmasin.
    reset(settingsToForm(settings), { keepDirtyValues: true });
  }, [settings, reset]);

  async function save(values: SettingsFormValues): Promise<void> {
    const saved = await update.mutateAsync(settingsToDto(values));
    reset(settingsToForm(saved));
  }

  const workingDays = watch("workingDays");
  function toggleDay(day: number) {
    const next = workingDays.includes(day)
      ? workingDays.filter((value) => value !== day)
      : [...workingDays, day].sort();
    setValue("workingDays", next, CHANGED);
  }

  return (
    <form onSubmit={editor.submit} noValidate>
      <fieldset disabled={disabled} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.tabs.general")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t("settings.form.displayName")}
              error={fieldError("displayName")}
              className="sm:col-span-2"
              required
            >
              <Input className="h-11" {...register("displayName")} />
            </Field>
            <Field label={t("settings.form.address")} error={fieldError("address")}>
              <Input className="h-11" {...register("address")} />
            </Field>
            <Field
              label={t("settings.form.phones")}
              error={fieldError("phones")}
              hint={t("settings.form.phonesHint")}
            >
              <Input className="h-11" {...register("phones")} />
            </Field>
            <Field label={t("settings.form.workingHoursOpen")} error={fieldError("open")}>
              <TimeInput
                value={watch("open")}
                onChange={(value) => setValue("open", value, CHANGED)}
                disabled={disabled}
              />
            </Field>
            <Field label={t("settings.form.workingHoursClose")} error={fieldError("close")}>
              <TimeInput
                value={watch("close")}
                onChange={(value) => setValue("close", value, CHANGED)}
                disabled={disabled}
              />
            </Field>
            <Field
              label={t("settings.form.workingDays")}
              error={fieldError("workingDays")}
              className="sm:col-span-2"
            >
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    aria-pressed={workingDays.includes(day)}
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm",
                      focusRing,
                      workingDays.includes(day)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary",
                    )}
                  >
                    {t("settings.weekdays." + day)}
                  </button>
                ))}
              </div>
            </Field>
            <SelectField
              label={t("settings.form.defaultLanguage")}
              error={fieldError("defaultLanguage")}
              value={watch("defaultLanguage")}
              onChange={(value) =>
                setValue("defaultLanguage", value as SettingsFormValues["defaultLanguage"], CHANGED)
              }
              options={[
                { value: "uz", label: t("common.language.uz") },
                { value: "ru", label: t("common.language.ru") },
              ]}
              disabled={disabled}
            />
            {TEXT_FIELDS.map((name) => (
              <Field
                key={name}
                label={t("settings.form." + name)}
                error={fieldError(name)}
                required
              >
                <Input className="h-11" {...register(name)} />
              </Field>
            ))}
            <Field
              label={t("settings.form.paymentDueDay")}
              error={fieldError("paymentDueDay")}
              required
            >
              <Input
                type="number"
                min={1}
                max={28}
                className="h-11"
                {...register("paymentDueDay")}
              />
            </Field>
            <div className="space-y-1.5 sm:col-span-2">
              <p className="text-sm font-medium">{t("settings.form.logo")}</p>
              {settings.logoFileId ? (
                <AuthImage
                  fileId={settings.logoFileId}
                  alt={t("settings.form.logo")}
                  className="h-16 w-16 rounded-lg"
                />
              ) : null}
              <p className="text-xs text-muted-foreground">{t("settings.form.logoUnavailable")}</p>
            </div>
          </CardContent>
        </Card>
        {canManage ? (
          <div className="flex justify-end">
            <Button type="submit" className="h-11" disabled={editor.pending || !hasEdits}>
              {t("common.actions.save")}
            </Button>
          </div>
        ) : null}
      </fieldset>
    </form>
  );
}

export function GeneralTab({ canManage }: { canManage: boolean }) {
  const { data, isLoading, error, refetch } = useSettings();
  return (
    <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()} rows={4}>
      {data ? <GeneralSettingsForm settings={data} canManage={canManage} /> : null}
    </QueryState>
  );
}
