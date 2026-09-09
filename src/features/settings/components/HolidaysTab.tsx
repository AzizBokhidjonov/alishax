import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { FilterBar } from "@/components/common/FilterBar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { QueryState } from "@/components/common/QueryState";
import { SelectField } from "@/components/common/SelectField";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { holidaySchema, type HolidayFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { currentPeriod, formatDate, todayIso } from "@/lib/dates";
import { useBranchOptions, useCreateHoliday, useDeleteHoliday, useHolidays } from "../api";
import { DatePicker } from "@/components/common/DateField";

function HolidayFormDialog() {
  const { t } = useTranslation();
  const branches = useBranchOptions();
  const create = useCreateHoliday();

  const form = useEntityForm<HolidayFormValues>({
    schema: holidaySchema,
    defaults: () => ({ holidayDate: todayIso(), name: "", isWorking: false }),
    onSubmit: async (values) => {
      await create.mutateAsync(values);
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button className="h-11">
          <Plus className="mr-2 h-4 w-4" />
          {t("settings.holidays.add")}
        </Button>
      }
      title={t("settings.holidays.add")}
      description={t("settings.holidays.hint")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <Field label={t("settings.holidays.date")} error={error("holidayDate")}>
          <DatePicker
            value={watch("holidayDate") ?? ""}
            onChange={(value) => setValue("holidayDate", value, { shouldValidate: true })}
          />
        </Field>
        <Field label={t("settings.holidays.name")} error={error("name")}>
          <Input className="h-11" {...register("name")} />
        </Field>
        {branches.length > 1 ? (
          <SelectField
            label={t("settings.holidays.branch")}
            value={watch("branchId") ?? ""}
            onChange={(value) => setValue("branchId", value)}
            options={branches}
          />
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={watch("isWorking")}
            onCheckedChange={(checked) => setValue("isWorking", checked)}
          />
          {t("settings.holidays.isWorking")}
        </label>
      </div>
    </FormDialog>
  );
}

export function HolidaysTab({ canManage }: { canManage: boolean }) {
  const { t } = useTranslation();
  const [year, setYear] = useState(currentPeriod().year);
  const { data, isLoading, error, refetch } = useHolidays({ year });
  const remove = useDeleteHoliday();
  const holidays = data ?? [];

  return (
    <div className="space-y-4">
      <FilterBar className="justify-between">
        <div className="space-y-1">
          <Label>{t("settings.holidays.year")}</Label>
          <Input
            type="number"
            className="h-11 w-32"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          />
        </div>
        {canManage ? <HolidayFormDialog /> : null}
      </FilterBar>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={holidays.length === 0}
        emptyTitle={t("settings.holidays.empty")}
        onRetry={() => void refetch()}
        rows={2}
        skeleton={<TableSkeleton columns={5} />}
      >
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("settings.holidays.date")}</TableHead>
                <TableHead>{t("settings.holidays.name")}</TableHead>
                <TableHead>{t("common.labels.type")}</TableHead>
                <TableHead className="text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell>{formatDate(holiday.holidayDate)}</TableCell>
                  <TableCell className="font-medium">{holiday.name}</TableCell>
                  <TableCell>
                    <Badge tone={holiday.isWorking ? "info" : "neutral"}>
                      {holiday.isWorking
                        ? t("settings.holidays.isWorking")
                        : t("settings.holidays.title")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage ? (
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title={t("common.confirm.deleteTitle")}
                        description={t("common.confirm.deleteText", { name: holiday.name })}
                        destructive
                        onConfirm={() => remove.mutate(holiday)}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      </QueryState>
    </div>
  );
}
