import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryState } from "@/components/common/QueryState";
import { SelectField } from "@/components/common/SelectField";
import { FileUploadField } from "@/components/common/FileUploadField";
import { Field } from "@/components/forms/FormDialog";
import { settingsSchema, type SettingsFormValues } from "@/components/forms/schemas";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { BranchesTab } from "./components/BranchesTab";
import { HolidaysTab } from "./components/HolidaysTab";
import { ChangePasswordCard } from "./components/ChangePasswordCard";
import { useSettings, useUpdateSettings } from "./api";
import { focusRing } from "@/lib/utils";
import { TimeInput } from "@/components/common/DateField";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

function GeneralTab({ canManage }: { canManage: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useSettings();
  const update = useUpdateSettings();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { workingDays: [] },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({
      displayName: data.displayName ?? undefined,
      address: data.address ?? undefined,
      phones: (data.phones ?? []).join(", ") || undefined,
      workingDays: data.workingDays ?? [],
      open: data.workingHours?.open,
      close: data.workingHours?.close,
      defaultLanguage: data.defaultLanguage,
      currency: data.currency ?? undefined,
      timezone: data.timezone ?? undefined,
      receiptNumberFormat: data.receiptNumberFormat ?? undefined,
      paymentDueDay: data.paymentDueDay,
      logoFileId: data.logoFileId ?? undefined,
      bankDetailsJson: data.bankDetails ? JSON.stringify(data.bankDetails, null, 2) : undefined,
      taxInfoJson: data.taxInfo ? JSON.stringify(data.taxInfo, null, 2) : undefined,
    });
  }, [data, form]);

  const submit = form.handleSubmit(async (values) => {
    const parse = (json?: string): Record<string, string> | undefined => {
      if (!json?.trim()) return undefined;
      try {
        return JSON.parse(json) as Record<string, string>;
      } catch {
        return undefined;
      }
    };

    await update.mutateAsync({
      displayName: values.displayName,
      address: values.address,
      phones: values.phones
        ? values.phones
            .split(",")
            .map((phone) => phone.trim())
            .filter(Boolean)
        : [],
      workingDays: values.workingDays,
      workingHours:
        values.open && values.close ? { open: values.open, close: values.close } : undefined,
      defaultLanguage: values.defaultLanguage,
      currency: values.currency,
      timezone: values.timezone,
      receiptNumberFormat: values.receiptNumberFormat,
      paymentDueDay: values.paymentDueDay,
      logoFileId: values.logoFileId,
      bankDetails: parse(values.bankDetailsJson),
      taxInfo: parse(values.taxInfoJson),
    });
  });

  const workingDays = form.watch("workingDays") ?? [];

  const toggleDay = (day: number) => {
    const next = workingDays.includes(day)
      ? workingDays.filter((value) => value !== day)
      : [...workingDays, day].sort();
    form.setValue("workingDays", next);
  };

  return (
    <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()} rows={4}>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.tabs.general")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label={t("settings.form.displayName")} className="sm:col-span-2">
              <Input className="h-11" disabled={!canManage} {...form.register("displayName")} />
            </Field>
            <Field label={t("settings.form.address")}>
              <Input className="h-11" disabled={!canManage} {...form.register("address")} />
            </Field>
            <Field label={t("settings.form.phones")} hint={t("settings.form.phonesHint")}>
              <Input className="h-11" disabled={!canManage} {...form.register("phones")} />
            </Field>
            <Field label={t("settings.form.workingHoursOpen")}>
              <TimeInput
                value={form.watch("open") ?? ""}
                onChange={(value) => form.setValue("open", value)}
                disabled={!canManage}
              />
            </Field>
            <Field label={t("settings.form.workingHoursClose")}>
              <TimeInput
                value={form.watch("close") ?? ""}
                onChange={(value) => form.setValue("close", value)}
                disabled={!canManage}
              />
            </Field>
            <div className="sm:col-span-2">
              <div className="mb-1 text-sm font-medium">{t("settings.form.workingDays")}</div>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    disabled={!canManage}
                    onClick={() => toggleDay(day)}
                    className={`rounded-xl px-3 py-2 text-sm ${focusRing} ${
                      workingDays.includes(day)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    }`}
                  >
                    {t(`settings.weekdays.${day}`)}
                  </button>
                ))}
              </div>
            </div>
            <SelectField
              label={t("settings.form.defaultLanguage")}
              value={form.watch("defaultLanguage") ?? ""}
              onChange={(value) =>
                form.setValue("defaultLanguage", value as SettingsFormValues["defaultLanguage"])
              }
              options={[
                { value: "uz", label: t("common.language.uz") },
                { value: "ru", label: t("common.language.ru") },
              ]}
              disabled={!canManage}
            />
            <Field label={t("settings.form.currency")}>
              <Input className="h-11" disabled={!canManage} {...form.register("currency")} />
            </Field>
            <Field label={t("settings.form.timezone")}>
              <Input className="h-11" disabled={!canManage} {...form.register("timezone")} />
            </Field>
            <Field label={t("settings.form.receiptNumberFormat")}>
              <Input
                className="h-11"
                disabled={!canManage}
                {...form.register("receiptNumberFormat")}
              />
            </Field>
            <Field label={t("settings.form.paymentDueDay")}>
              <Input
                type="number"
                min={1}
                max={28}
                className="h-11"
                disabled={!canManage}
                {...form.register("paymentDueDay")}
              />
            </Field>
            <div className="sm:col-span-2">
              <FileUploadField
                label={t("settings.form.logo")}
                value={form.watch("logoFileId")}
                onChange={(fileId) => form.setValue("logoFileId", fileId)}
                entityType="settings_logo"
                accept="image/png,image/jpeg,image/webp"
                disabled={!canManage}
              />
            </div>
          </CardContent>
        </Card>

        {canManage ? (
          <div className="flex justify-end">
            <Button type="submit" className="h-11" disabled={update.isPending}>
              {t("common.actions.save")}
            </Button>
          </div>
        ) : null}
      </form>
    </QueryState>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();

  return (
    <div className="space-y-6">
      <PageHeader title={t("settings.title")} />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t("settings.tabs.general")}</TabsTrigger>
          <TabsTrigger value="branches">{t("settings.tabs.branches")}</TabsTrigger>
          <TabsTrigger value="holidays">{t("settings.tabs.holidays")}</TabsTrigger>
          <TabsTrigger value="security">{t("settings.tabs.security")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab canManage={can(P.settingsManage)} />
        </TabsContent>
        <TabsContent value="branches">
          <BranchesTab canManage={can(P.branchManage)} />
        </TabsContent>
        <TabsContent value="holidays">
          <HolidaysTab canManage={can(P.holidayManage)} />
        </TabsContent>
        <TabsContent value="security">
          <ChangePasswordCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
