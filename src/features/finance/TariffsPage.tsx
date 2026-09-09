import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import type { Tariff, TariffKind } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Money } from "@/components/common/Money";
import { PageHeader } from "@/components/common/PageHeader";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { QueryState } from "@/components/common/QueryState";
import { SelectField } from "@/components/common/SelectField";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { MoneyInput } from "@/components/common/MoneyInput";
import { tariffSchema, type TariffFormValues } from "@/components/forms/schemas";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { tiyinToSomInput, toTiyin } from "@/lib/money";
import { useBranchOptions } from "@/features/settings/api";
import { useCreateTariff, useTariffs, useUpdateTariff } from "./api";

const KINDS: TariffKind[] = [
  "monthly_fixed",
  "full_day",
  "half_day",
  "group_based",
  "attendance_based",
  "meal",
  "transport",
  "extra_class",
  "registration_fee",
];

function TariffFormDialog({ tariff, trigger }: { tariff?: Tariff; trigger: ReactNode }) {
  const { t } = useTranslation();
  const branches = useBranchOptions();
  const create = useCreateTariff();
  const update = useUpdateTariff();

  const form = useEntityForm<TariffFormValues>({
    schema: tariffSchema,
    entity: tariff
      ? {
          branchId: tariff.branchId,
          name: tariff.name,
          kind: tariff.kind,
          amountSom: tiyinToSomInput(tariff.amountTiyin),
          active: tariff.active ?? true,
        }
      : null,
    defaults: () => ({
      name: "",
      kind: "monthly_fixed" as TariffKind,
      amountSom: "",
      active: true,
    }),
    onSubmit: async (values) => {
      // Summa har doim butun tiyin satri sifatida yuboriladi.
      const amountTiyin = toTiyin(values.amountSom);
      if (tariff) {
        await update.mutateAsync({
          id: tariff.id,
          dto: { name: values.name, amountTiyin, active: values.active },
        });
      } else {
        await create.mutateAsync({
          branchId: values.branchId,
          name: values.name,
          kind: values.kind,
          amountTiyin,
        });
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
      title={tariff ? t("tariffs.edit") : t("tariffs.add")}
      isEditing={form.isEditing}
      description={t("tariffs.futureOnlyHint")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <Field label={t("tariffs.form.name")} error={error("name")}>
          <Input className="h-11" {...register("name")} />
        </Field>
        <SelectField
          label={t("tariffs.form.kind")}
          value={watch("kind")}
          onChange={(value) => setValue("kind", value as TariffKind, { shouldValidate: true })}
          options={KINDS.map((kind) => ({ value: kind, label: t(`domain.tariffKind.${kind}`) }))}
          disabled={Boolean(tariff)}
          error={error("kind")}
        />
        <MoneyInput
          label={t("tariffs.form.amount")}
          value={watch("amountSom") ?? ""}
          onChange={(value) => setValue("amountSom", value, { shouldValidate: true })}
          error={error("amountSom")}
        />
        {branches.length > 1 && !tariff ? (
          <SelectField
            label={t("tariffs.form.branch")}
            value={watch("branchId") ?? ""}
            onChange={(value) => setValue("branchId", value)}
            options={branches}
          />
        ) : null}
        {tariff ? (
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={watch("active")}
              onCheckedChange={(checked) => setValue("active", checked)}
            />
            {t("tariffs.form.active")}
          </label>
        ) : null}
      </div>
    </FormDialog>
  );
}

export function TariffsPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { data, isLoading, error, refetch } = useTariffs();
  const canManage = can(P.tariffManage);
  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("tariffs.title")} subtitle={t("tariffs.futureOnlyHint")}>
        {canManage ? (
          <TariffFormDialog
            trigger={
              <Button className="h-11">
                <Plus className="mr-2 h-4 w-4" />
                {t("tariffs.add")}
              </Button>
            }
          />
        ) : null}
      </PageHeader>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        emptyTitle={t("tariffs.empty")}
        onRetry={() => void refetch()}
        skeleton={<TableSkeleton columns={5} />}
      >
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tariffs.columns.name")}</TableHead>
                <TableHead>{t("tariffs.columns.kind")}</TableHead>
                <TableHead>{t("tariffs.columns.amount")}</TableHead>
                <TableHead>{t("tariffs.columns.active")}</TableHead>
                <TableHead className="text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((tariff) => (
                <TableRow key={tariff.id}>
                  <TableCell className="font-medium">{tariff.name}</TableCell>
                  <TableCell>{t(`domain.tariffKind.${tariff.kind}`)}</TableCell>
                  <TableCell>
                    <Money value={tariff.amountTiyin} />
                  </TableCell>
                  <TableCell>
                    {tariff.active === false ? (
                      <Badge tone="neutral">{t("domain.userStatus.inactive")}</Badge>
                    ) : (
                      <Badge tone="ok">{t("domain.userStatus.active")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage ? (
                      <TariffFormDialog
                        tariff={tariff}
                        trigger={
                          <Button size="sm" variant="ghost">
                            {t("common.actions.edit")}
                          </Button>
                        }
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
