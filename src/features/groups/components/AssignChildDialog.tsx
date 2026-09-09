import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UserPlus } from "lucide-react";
import { isApiError } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { ChildPicker } from "@/components/common/EntityPicker";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { assignChildSchema, type AssignChildFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { todayIso } from "@/lib/dates";
import { useAssignChild } from "../api";
import { DatePicker } from "@/components/common/DateField";

/**
 * Guruhga biriktirish. Sig'im to'lganda server `409 CAPACITY_EXCEEDED`
 * qaytaradi — majburiy biriktirish tugmasi faqat shu ruxsati borlarga
 * ko'rsatiladi va audit yoziladi (B8).
 */
export function AssignChildDialog({ groupId, canForce }: { groupId: string; canForce: boolean }) {
  const { t } = useTranslation();
  const assign = useAssignChild(groupId);
  const [capacityHit, setCapacityHit] = useState<AssignChildFormValues | null>(null);

  const form = useEntityForm<AssignChildFormValues>({
    schema: assignChildSchema,
    defaults: () => ({ childId: "", effectiveDate: todayIso() }),
    onSubmit: async (values) => {
      setCapacityHit(null);
      try {
        await assign.mutateAsync({ dto: values });
      } catch (error) {
        if (isApiError(error) && error.code === "CAPACITY_EXCEEDED" && canForce) {
          setCapacityHit(values);
        }
        throw error;
      }
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <>
      <FormDialog
        open={form.open}
        onOpenChange={form.setOpen}
        trigger={
          <Button className="h-11">
            <UserPlus className="mr-2 h-4 w-4" />
            {t("groups.assign.title")}
          </Button>
        }
        title={t("groups.assign.title")}
        submitLabel={t("common.actions.assign")}
        onSubmit={form.submit}
        canSubmit={form.canSubmit}
        pending={form.pending}
      >
        <div className="space-y-3">
          <ChildPicker
            label={t("groups.assign.child")}
            value={watch("childId")}
            onChange={(value) => setValue("childId", value, { shouldValidate: true })}
            error={error("childId")}
          />
          <Field label={t("groups.assign.effectiveDate")} error={error("effectiveDate")}>
            <DatePicker
              value={watch("effectiveDate") ?? ""}
              onChange={(value) => setValue("effectiveDate", value, { shouldValidate: true })}
            />
          </Field>
        </div>
      </FormDialog>

      {capacityHit ? (
        <ConfirmDialog
          trigger={
            <Button variant="outline" className="h-11">
              {t("groups.assign.force")}
            </Button>
          }
          title={t("groups.assign.forceTitle")}
          description={t("groups.assign.forceText")}
          sensitive
          confirmLabel={t("groups.assign.force")}
          onConfirm={async () => {
            await assign.mutateAsync({ dto: capacityHit, force: true });
            setCapacityHit(null);
          }}
        />
      ) : null}
    </>
  );
}
