import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import type { Expense, ExpenseType } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/common/SelectField";
import { FileUploadField } from "@/components/common/FileUploadField";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { MoneyInput } from "@/components/common/MoneyInput";
import {
  expenseSchema,
  payExpenseSchema,
  type ExpenseFormValues,
  type PayExpenseFormValues,
} from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { currentPeriod, isoToLocalInput, localInputToIso } from "@/lib/dates";
import { tiyinToSomInput, toTiyin } from "@/lib/money";
import { useBranchOptions } from "@/features/settings/api";
import { useCreateExpense, usePayExpense, useUpdateExpense } from "../api";
import { EXPENSE_TYPES } from "../constants";
import { DatePicker, DateTimePicker } from "@/components/common/DateField";

export function ExpenseFormDialog({ expense, trigger }: { expense?: Expense; trigger: ReactNode }) {
  const { t } = useTranslation();
  const branches = useBranchOptions();
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const period = currentPeriod();

  const form = useEntityForm<ExpenseFormValues>({
    schema: expenseSchema,
    entity: expense
      ? {
          branchId: expense.branchId,
          type: expense.type,
          provider: expense.provider,
          contractNumber: expense.contractNumber,
          billingYear: expense.billingYear,
          billingMonth: expense.billingMonth,
          invoiceNumber: expense.invoiceNumber,
          amountSom: tiyinToSomInput(expense.amountTiyin),
          dueDate: expense.dueDate,
          attachmentFileId: expense.attachmentFileId,
          note: expense.note,
        }
      : null,
    defaults: () => ({
      branchId: branches[0]?.value ?? "",
      type: "electricity" as ExpenseType,
      billingYear: period.year,
      billingMonth: period.month,
      amountSom: "",
    }),
    onSubmit: async (values) => {
      const amountTiyin = toTiyin(values.amountSom);
      if (expense) {
        await update.mutateAsync({
          id: expense.id,
          dto: {
            provider: values.provider,
            amountTiyin,
            dueDate: values.dueDate,
            note: values.note,
          },
        });
      } else {
        await create.mutateAsync({ ...values, amountTiyin });
      }
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={trigger}
      title={expense ? t("expenses.edit") : t("expenses.add")}
      isEditing={form.isEditing}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
      contentClassName="max-w-lg"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {branches.length > 1 ? (
          <SelectField
            label={t("expenses.form.branch")}
            value={watch("branchId")}
            onChange={(value) => setValue("branchId", value, { shouldValidate: true })}
            options={branches}
            error={error("branchId")}
            className="sm:col-span-2"
          />
        ) : null}
        <SelectField
          label={t("expenses.form.type")}
          value={watch("type")}
          onChange={(value) => setValue("type", value as ExpenseType, { shouldValidate: true })}
          options={EXPENSE_TYPES.map((type) => ({
            value: type,
            label: t(`domain.expenseType.${type}`),
          }))}
          disabled={Boolean(expense)}
          error={error("type")}
        />
        <Field label={t("expenses.form.provider")} error={error("provider")}>
          <Input className="h-11" {...register("provider")} />
        </Field>
        <Field label={t("expenses.form.billingYear")} error={error("billingYear")}>
          <Input type="number" className="h-11" {...register("billingYear")} />
        </Field>
        <Field label={t("expenses.form.billingMonth")} error={error("billingMonth")}>
          <Input type="number" min={1} max={12} className="h-11" {...register("billingMonth")} />
        </Field>
        <MoneyInput
          label={t("expenses.form.amount")}
          value={watch("amountSom") ?? ""}
          onChange={(value) => setValue("amountSom", value, { shouldValidate: true })}
          error={error("amountSom")}
        />
        <Field label={t("expenses.form.dueDate")} error={error("dueDate")}>
          <DatePicker
            value={watch("dueDate") ?? ""}
            onChange={(value) => setValue("dueDate", value, { shouldValidate: true })}
          />
        </Field>
        <Field label={t("expenses.form.invoiceNumber")} error={error("invoiceNumber")}>
          <Input className="h-11" {...register("invoiceNumber")} />
        </Field>
        <Field label={t("expenses.form.contractNumber")} error={error("contractNumber")}>
          <Input className="h-11" {...register("contractNumber")} />
        </Field>
        <div className="sm:col-span-2">
          <FileUploadField
            label={t("expenses.form.attachment")}
            value={watch("attachmentFileId")}
            onChange={(fileId) => setValue("attachmentFileId", fileId)}
            entityType="expense"
          />
        </div>
        <Field label={t("expenses.form.note")} error={error("note")} className="sm:col-span-2">
          <Textarea rows={2} {...register("note")} />
        </Field>
      </div>
    </FormDialog>
  );
}

export function PayExpenseDialog({ expense }: { expense: Expense }) {
  const { t } = useTranslation();
  const pay = usePayExpense();

  const form = useEntityForm<PayExpenseFormValues>({
    schema: payExpenseSchema,
    defaults: () => ({
      paidAt: isoToLocalInput(new Date().toISOString()),
      amountSom: tiyinToSomInput(expense.amountTiyin),
    }),
    onSubmit: async (values) => {
      await pay.mutateAsync({
        id: expense.id,
        dto: {
          paidAt: localInputToIso(values.paidAt),
          amountTiyin: toTiyin(values.amountSom),
          attachmentFileId: values.attachmentFileId,
        },
      });
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button size="sm" variant="ghost">
          <CheckCircle2 className="mr-1 h-4 w-4" />
          {t("expenses.pay.action")}
        </Button>
      }
      title={t("expenses.pay.title")}
      submitLabel={t("common.actions.pay")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <Field label={t("expenses.pay.paidAt")} error={error("paidAt")}>
          <DateTimePicker
            value={watch("paidAt") ?? ""}
            onChange={(value) => setValue("paidAt", value, { shouldValidate: true })}
          />
        </Field>
        <MoneyInput
          label={t("expenses.pay.amount")}
          value={watch("amountSom") ?? ""}
          onChange={(value) => setValue("amountSom", value, { shouldValidate: true })}
          error={error("amountSom")}
        />
        <FileUploadField
          label={t("expenses.pay.attachment")}
          value={watch("attachmentFileId")}
          onChange={(fileId) => setValue("attachmentFileId", fileId)}
          entityType="expense_payment"
          entityId={expense.id}
        />
      </div>
    </FormDialog>
  );
}
