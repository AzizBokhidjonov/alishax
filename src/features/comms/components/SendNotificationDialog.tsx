import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { NotificationChannel } from "@/api";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { SelectField } from "@/components/common/SelectField";
import { GuardianPicker } from "@/components/common/EntityPicker";
import {
  sendNotificationSchema,
  type SendNotificationFormValues,
} from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { useIdempotencyKey } from "@/lib/idempotency";
import { useSendNotification, useTemplates } from "../api";

const CHANNELS: NotificationChannel[] = ["telegram", "internal"];

/**
 * Xabarnoma yuborish. `Idempotency-Key` majburiy (Integration Guide §8),
 * matn esa serverda shablon bo'yicha render qilinadi.
 */
export function SendNotificationDialog({ trigger }: { trigger: ReactNode }) {
  const { t } = useTranslation();
  const templates = useTemplates();
  const send = useSendNotification();
  const idempotency = useIdempotencyKey();
  const [guardianId, setGuardianId] = useState("");

  const form = useEntityForm<SendNotificationFormValues>({
    schema: sendNotificationSchema,
    defaults: () => ({
      templateKey: "",
      channel: "telegram" as NotificationChannel,
      recipientIds: [],
      dataJson: "{}",
    }),
    onSubmit: async (values) => {
      let data: Record<string, string> = {};
      if (values.dataJson) {
        try {
          data = JSON.parse(values.dataJson) as Record<string, string>;
        } catch {
          form.form.setError("dataJson", { message: "billing.rules.invalidJson" });
          throw new Error("invalid json");
        }
      }
      await send.mutateAsync({
        dto: {
          templateKey: values.templateKey,
          channel: values.channel,
          recipients: values.recipientIds.map((id) => ({ guardianId: id })),
          data,
        },
        idempotencyKey: idempotency.get(),
      });
      idempotency.reset();
      setGuardianId("");
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={(next) => {
        form.setOpen(next);
        if (next) idempotency.get();
      }}
      trigger={trigger}
      title={t("notifications.send.title")}
      description={t("notifications.send.rateHint")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
      submitLabel={t("notifications.send.submit")}
    >
      <div className="space-y-3">
        <SelectField
          label={t("notifications.send.template")}
          value={watch("templateKey")}
          onChange={(value) => setValue("templateKey", value, { shouldValidate: true })}
          options={(templates.data ?? []).map((template) => ({
            value: template.templateKey,
            label: t(`domain.templateKey.${template.templateKey}`, {
              defaultValue: template.templateKey,
            }),
          }))}
          error={error("templateKey")}
        />
        <SelectField
          label={t("notifications.send.channel")}
          value={watch("channel")}
          onChange={(value) =>
            setValue("channel", value as NotificationChannel, { shouldValidate: true })
          }
          options={CHANNELS.map((channel) => ({
            value: channel,
            label: t(`domain.channel.${channel}`),
          }))}
          error={error("channel")}
        />
        <GuardianPicker
          label={t("notifications.send.recipients")}
          value={guardianId}
          onChange={(value) => {
            setGuardianId(value);
            setValue("recipientIds", value ? [value] : [], { shouldValidate: true });
          }}
          error={error("recipientIds")}
        />
        <Field
          label={t("notifications.send.data")}
          hint={t("notifications.templates.variablesHint")}
          error={error("dataJson")}
        >
          <Textarea rows={4} className="font-mono text-xs" {...register("dataJson")} />
        </Field>
      </div>
    </FormDialog>
  );
}
