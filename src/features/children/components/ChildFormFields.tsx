import { useTranslation } from "react-i18next";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormSection } from "@/components/forms/FormDialog";
import { SelectField, type SelectOption } from "@/components/common/SelectField";
import type { ChildFormValues } from "@/components/forms/schemas";
import { DatePicker } from "@/components/common/DateField";

/**
 * Bola maydonlari — tahrirlash dialogi va qabul ustasi uchun umumiy.
 *
 * O'n bitta maydon bitta tekis to'rda turganda qaysi biri majburiy, qaysi
 * biri hujjat raqami ekani ko'rinmasdi. Endi ular uch ma'noli bo'limga
 * bo'lingan: kim, qachon qabul qilingan va qo'shimcha.
 */
export function ChildFormFields({
  form,
  error,
  branches,
}: {
  form: UseFormReturn<ChildFormValues>;
  error: (name: keyof ChildFormValues & string) => string | undefined;
  branches: SelectOption[];
}) {
  const { t } = useTranslation();
  const { register, watch, setValue } = form;

  return (
    <div className="space-y-6">
      <FormSection title={t("children.form.sections.identity")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label={t("children.form.branch")}
            value={watch("branchId")}
            onChange={(value) => setValue("branchId", value, { shouldValidate: true })}
            options={branches}
            error={error("branchId")}
            className="sm:col-span-2"
          />

          <Field label={t("children.form.lastName")} error={error("lastName")} required>
            <Input {...register("lastName")} />
          </Field>
          <Field label={t("children.form.firstName")} error={error("firstName")} required>
            <Input {...register("firstName")} />
          </Field>
          <Field
            label={t("children.form.middleName")}
            error={error("middleName")}
            className="sm:col-span-2"
          >
            <Input {...register("middleName")} />
          </Field>

          <Field label={t("children.form.birthDate")} error={error("birthDate")} required>
            <DatePicker
              value={watch("birthDate") ?? ""}
              onChange={(value) => setValue("birthDate", value, { shouldValidate: true })}
            />
          </Field>

          <SelectField
            label={t("children.form.gender")}
            value={watch("gender") ?? ""}
            onChange={(value) =>
              setValue("gender", value as ChildFormValues["gender"], { shouldValidate: true })
            }
            options={[
              { value: "male", label: t("domain.gender.male") },
              { value: "female", label: t("domain.gender.female") },
            ]}
            error={error("gender")}
          />
        </div>
      </FormSection>

      <FormSection title={t("children.form.sections.enrollment")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("children.form.enrollmentDate")}
            error={error("enrollmentDate")}
            required
            className="sm:col-span-2"
          >
            <DatePicker
              value={watch("enrollmentDate") ?? ""}
              onChange={(value) => setValue("enrollmentDate", value, { shouldValidate: true })}
            />
          </Field>
          <Field label={t("children.form.contractNumber")} error={error("contractNumber")}>
            <Input {...register("contractNumber")} />
          </Field>
          <Field label={t("children.form.registrationNumber")} error={error("registrationNumber")}>
            <Input {...register("registrationNumber")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title={t("children.form.sections.extra")}>
        <div className="grid gap-4">
          <Field label={t("children.form.address")} error={error("address")}>
            <Input {...register("address")} />
          </Field>
          <Field label={t("children.form.note")} error={error("note")}>
            <Textarea rows={3} {...register("note")} />
          </Field>
        </div>
      </FormSection>
    </div>
  );
}
