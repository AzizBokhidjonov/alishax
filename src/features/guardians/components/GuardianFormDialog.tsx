import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import type { Guardian } from "@/api";
import { Input } from "@/components/ui/input";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { SelectField } from "@/components/common/SelectField";
import { guardianSchema, type GuardianFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { useCreateGuardian, useUpdateGuardian } from "../api";
import { duplicateGuardian } from "../duplicate";
import { focusRing } from "@/lib/utils";

interface GuardianFormDialogProps {
  guardian?: Guardian;
  trigger: ReactNode;
  /** Takroriy telefon topilganda mavjud yozuv bilan chaqiriladi (dedup oqimi). */
  onDuplicate?: (existing: Guardian) => void;
}

export function GuardianFormDialog({ guardian, trigger, onDuplicate }: GuardianFormDialogProps) {
  const { t } = useTranslation();
  const create = useCreateGuardian();
  const update = useUpdateGuardian();
  const [duplicate, setDuplicate] = useState<Guardian | null>(null);

  const form = useEntityForm<GuardianFormValues>({
    schema: guardianSchema,
    entity: guardian
      ? {
          fullName: guardian.fullName,
          phone: guardian.phone,
          phoneAlt: guardian.phoneAlt,
          email: guardian.email,
          address: guardian.address,
          workplace: guardian.workplace,
          passportNumber: guardian.passportNumber,
          preferredLanguage: guardian.preferredLanguage,
        }
      : null,
    defaults: () => ({ fullName: "", phone: "" }),
    onSubmit: async (values) => {
      setDuplicate(null);
      if (guardian) {
        await update.mutateAsync({ id: guardian.id, dto: values });
        return;
      }
      try {
        await create.mutateAsync(values);
      } catch (error) {
        const existing = duplicateGuardian(error);
        if (existing) {
          // Dublikat yaratilmaydi — mavjud yozuv taklif qilinadi (B7).
          setDuplicate(existing);
          throw error;
        }
        throw error;
      }
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={(next) => {
        form.setOpen(next);
        if (!next) setDuplicate(null);
      }}
      trigger={trigger}
      title={guardian ? t("guardians.edit") : t("guardians.add")}
      isEditing={form.isEditing}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
      contentClassName="max-w-lg"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={t("guardians.form.fullName")}
          error={error("fullName")}
          className="sm:col-span-2"
        >
          <Input className="h-11" {...register("fullName")} />
        </Field>
        <Field
          label={t("guardians.form.phone")}
          hint={t("guardians.form.phoneHint")}
          error={error("phone")}
        >
          <Input className="h-11" {...register("phone")} />
        </Field>
        <Field label={t("guardians.form.phoneAlt")} error={error("phoneAlt")}>
          <Input className="h-11" {...register("phoneAlt")} />
        </Field>
        <Field label={t("guardians.form.email")} error={error("email")}>
          <Input className="h-11" {...register("email")} />
        </Field>
        <SelectField
          label={t("guardians.form.preferredLanguage")}
          value={watch("preferredLanguage") ?? ""}
          onChange={(value) =>
            setValue("preferredLanguage", value as GuardianFormValues["preferredLanguage"])
          }
          options={[
            { value: "uz", label: t("common.language.uz") },
            { value: "ru", label: t("common.language.ru") },
          ]}
        />
        <Field label={t("guardians.form.address")} error={error("address")}>
          <Input className="h-11" {...register("address")} />
        </Field>
        <Field label={t("guardians.form.workplace")} error={error("workplace")}>
          <Input className="h-11" {...register("workplace")} />
        </Field>
        <Field
          label={t("guardians.form.passportNumber")}
          error={error("passportNumber")}
          className="sm:col-span-2"
        >
          <Input className="h-11" {...register("passportNumber")} />
        </Field>

        {duplicate ? (
          <div className="space-y-2 rounded-xl border border-st-warn-border bg-st-warn-soft p-3 text-sm text-st-warn-fg sm:col-span-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              {t("guardians.duplicate.title")}
            </div>
            <p>
              {t("guardians.duplicate.text", {
                name: duplicate.fullName,
                phone: duplicate.phone,
              })}
            </p>
            {onDuplicate ? (
              <button
                type="button"
                className={`rounded-sm font-semibold underline ${focusRing}`}
                onClick={() => {
                  onDuplicate(duplicate);
                  form.setOpen(false);
                  setDuplicate(null);
                }}
              >
                {t("guardians.duplicate.link")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </FormDialog>
  );
}
