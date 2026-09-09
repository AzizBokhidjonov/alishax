import { useTranslation } from "react-i18next";
import { Megaphone } from "lucide-react";
import type { AnnouncementPriority, AudienceType } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/common/SelectField";
import { FileUploadField } from "@/components/common/FileUploadField";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { announcementSchema, type AnnouncementFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { localInputToIso } from "@/lib/dates";
import { useGroupOptions } from "@/features/groups/api";
import { useCreateAnnouncement } from "../api";
import { DateTimePicker } from "@/components/common/DateField";

const PRIORITIES: AnnouncementPriority[] = ["low", "normal", "high", "emergency"];
const AUDIENCES: AudienceType[] = ["all", "group", "children", "guardians", "staff"];

export function AnnouncementFormDialog() {
  const { t } = useTranslation();
  const groups = useGroupOptions();
  const create = useCreateAnnouncement();

  const form = useEntityForm<AnnouncementFormValues>({
    schema: announcementSchema,
    defaults: () => ({
      title: "",
      body: "",
      priority: "normal" as AnnouncementPriority,
      audienceType: "all" as AudienceType,
      audienceIds: [],
      fileIds: [],
    }),
    onSubmit: async (values) => {
      await create.mutateAsync({
        ...values,
        publishAt: values.publishAt ? localInputToIso(values.publishAt) : undefined,
        expiresAt: values.expiresAt ? localInputToIso(values.expiresAt) : undefined,
      });
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);
  const audienceType = watch("audienceType");

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button className="h-11">
          <Megaphone className="mr-2 h-4 w-4" />
          {t("announcements.add")}
        </Button>
      }
      title={t("announcements.add")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
      contentClassName="max-w-lg"
    >
      <div className="space-y-3">
        <Field label={t("announcements.form.title")} error={error("title")}>
          <Input className="h-11" {...register("title")} />
        </Field>
        <Field label={t("announcements.form.body")} error={error("body")}>
          <Textarea rows={5} {...register("body")} />
        </Field>
        {/* `fileIds` ilgari doim bo'sh ketardi — biriktirish imkoni yo'q edi. */}
        <FileUploadField
          label={t("announcements.form.attachment")}
          value={watch("fileIds")[0]}
          onChange={(fileId) =>
            setValue("fileIds", fileId ? [fileId] : [], { shouldValidate: true })
          }
          entityType="announcement"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label={t("announcements.form.priority")}
            value={watch("priority")}
            onChange={(value) => setValue("priority", value as AnnouncementPriority)}
            options={PRIORITIES.map((priority) => ({
              value: priority,
              label: t(`domain.priority.${priority}`),
            }))}
          />
          <SelectField
            label={t("announcements.form.audienceType")}
            value={audienceType}
            onChange={(value) => {
              setValue("audienceType", value as AudienceType, { shouldValidate: true });
              setValue("audienceIds", []);
            }}
            options={AUDIENCES.map((audience) => ({
              value: audience,
              label: t(`domain.audience.${audience}`),
            }))}
          />
        </div>

        {audienceType === "group" ? (
          <SelectField
            label={t("announcements.form.audienceIds")}
            value={watch("audienceIds")[0] ?? ""}
            onChange={(value) => setValue("audienceIds", [value])}
            options={groups}
          />
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("announcements.form.publishAt")} error={error("publishAt")}>
            <DateTimePicker
              clearable
              value={watch("publishAt") ?? ""}
              onChange={(value) => setValue("publishAt", value, { shouldValidate: true })}
            />
          </Field>
          <Field label={t("announcements.form.expiresAt")} error={error("expiresAt")}>
            <DateTimePicker
              clearable
              value={watch("expiresAt") ?? ""}
              onChange={(value) => setValue("expiresAt", value, { shouldValidate: true })}
            />
          </Field>
        </div>
      </div>
    </FormDialog>
  );
}
