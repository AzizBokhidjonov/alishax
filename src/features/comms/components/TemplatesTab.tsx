import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { NotificationTemplate } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { QueryState } from "@/components/common/QueryState";
import { Field } from "@/components/forms/FormDialog";
import { usePreviewTemplate, useSaveTemplate, useTemplates } from "../api";
import { focusRing } from "@/lib/utils";

/**
 * Shablonlar ikkala tilda saqlanadi va SERVERDA render qilinadi — mijoz
 * bu matnlarni tarjima qilmaydi (B16).
 */
export function TemplatesTab({ canManage }: { canManage: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useTemplates();
  const save = useSaveTemplate();
  const preview = usePreviewTemplate();

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<NotificationTemplate | null>(null);

  const templates = data ?? [];
  const current =
    templates.find((template) => template.templateKey === selectedKey) ?? templates[0];

  useEffect(() => {
    if (current) setDraft({ ...current });
  }, [current]);

  const update = (patch: Partial<NotificationTemplate>) =>
    setDraft((value) => (value ? { ...value, ...patch } : value));

  const submit = () => {
    if (!draft) return;
    save.mutate({
      key: draft.templateKey,
      dto: {
        bodyUz: draft.bodyUz,
        bodyRu: draft.bodyRu,
        variables: draft.variables,
        enabled: draft.enabled,
        includeAmounts: draft.includeAmounts,
      },
    });
  };

  const runPreview = () => {
    if (!draft) return;
    const sampleData = Object.fromEntries(
      draft.variables.map((variable) => [variable, `{${variable}}`]),
    );
    preview.mutate({ key: draft.templateKey, sampleData });
  };

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      isEmpty={templates.length === 0}
      emptyTitle={t("notifications.templates.empty")}
      onRetry={() => void refetch()}
      rows={3}
    >
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("notifications.templates.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            {templates.map((template) => (
              <button
                key={template.templateKey}
                type="button"
                onClick={() => setSelectedKey(template.templateKey)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm ${focusRing} ${
                  template.templateKey === current?.templateKey
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                }`}
              >
                {t(`domain.templateKey.${template.templateKey}`, {
                  defaultValue: template.templateKey,
                })}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {draft
                ? t(`domain.templateKey.${draft.templateKey}`, { defaultValue: draft.templateKey })
                : "—"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t("notifications.templates.hint")}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {draft ? (
              <>
                <Field label={t("notifications.templates.bodyUz")}>
                  <Textarea
                    rows={3}
                    value={draft.bodyUz}
                    disabled={!canManage}
                    onChange={(event) => update({ bodyUz: event.target.value })}
                  />
                </Field>
                <Field label={t("notifications.templates.bodyRu")}>
                  <Textarea
                    rows={3}
                    value={draft.bodyRu}
                    disabled={!canManage}
                    onChange={(event) => update({ bodyRu: event.target.value })}
                  />
                </Field>
                <Field
                  label={t("notifications.templates.variables")}
                  hint={t("notifications.templates.variablesHint")}
                >
                  <Input
                    className="h-11"
                    value={draft.variables.join(", ")}
                    disabled={!canManage}
                    onChange={(event) =>
                      update({
                        variables: event.target.value
                          .split(",")
                          .map((value) => value.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </Field>

                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={draft.enabled !== false}
                      disabled={!canManage}
                      onCheckedChange={(checked) => update({ enabled: checked })}
                    />
                    {t("notifications.templates.enabled")}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={draft.includeAmounts !== false}
                      disabled={!canManage}
                      onCheckedChange={(checked) => update({ includeAmounts: checked })}
                    />
                    {t("notifications.templates.includeAmounts")}
                  </label>
                </div>

                {preview.data ? (
                  <div className="rounded-xl border border-border bg-secondary p-3 text-sm">
                    <Label className="mb-1 block">
                      {t("notifications.templates.previewTitle")}
                    </Label>
                    <div>{preview.data.uz ?? preview.data.body ?? ""}</div>
                    <div className="mt-1 text-muted-foreground">{preview.data.ru ?? ""}</div>
                  </div>
                ) : null}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={runPreview}>
                    {t("notifications.templates.preview")}
                  </Button>
                  {canManage ? (
                    <Button onClick={submit} disabled={save.isPending}>
                      {t("common.actions.save")}
                    </Button>
                  ) : null}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </QueryState>
  );
}
