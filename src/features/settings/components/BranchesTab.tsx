import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import type { Branch } from "@/api";
import { Button } from "@/components/ui/button";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/common/StatusBadge";
import { QueryState } from "@/components/common/QueryState";
import { SelectField } from "@/components/common/SelectField";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { branchSchema, type BranchFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { useBranches, useCreateBranch, useUpdateBranch } from "../api";

function BranchFormDialog({ branch, trigger }: { branch?: Branch; trigger: ReactNode }) {
  const { t } = useTranslation();
  const create = useCreateBranch();
  const update = useUpdateBranch();

  const form = useEntityForm<BranchFormValues>({
    schema: branchSchema,
    entity: branch
      ? {
          code: branch.code,
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          status: branch.status,
        }
      : null,
    defaults: () => ({ code: "", name: "" }),
    onSubmit: async (values) => {
      if (branch) {
        await update.mutateAsync({
          id: branch.id,
          dto: {
            name: values.name,
            address: values.address,
            phone: values.phone,
            status: values.status,
          },
        });
      } else {
        await create.mutateAsync({
          code: values.code,
          name: values.name,
          address: values.address,
          phone: values.phone,
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
      title={branch ? t("settings.branches.edit") : t("settings.branches.add")}
      isEditing={form.isEditing}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <Field label={t("settings.branches.code")} error={error("code")}>
          <Input className="h-11" disabled={Boolean(branch)} {...register("code")} />
        </Field>
        <Field label={t("settings.branches.name")} error={error("name")}>
          <Input className="h-11" {...register("name")} />
        </Field>
        <Field label={t("settings.branches.address")} error={error("address")}>
          <Input className="h-11" {...register("address")} />
        </Field>
        <Field label={t("settings.branches.phone")} error={error("phone")}>
          <Input className="h-11" {...register("phone")} />
        </Field>
        {branch ? (
          <SelectField
            label={t("settings.branches.status")}
            value={watch("status") ?? "active"}
            onChange={(value) => setValue("status", value as BranchFormValues["status"])}
            options={[
              { value: "active", label: t("settings.branches.active") },
              { value: "closed", label: t("settings.branches.closed") },
            ]}
          />
        ) : null}
      </div>
    </FormDialog>
  );
}

export function BranchesTab({ canManage }: { canManage: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useBranches();
  const branches = data ?? [];

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex justify-end">
          <BranchFormDialog
            trigger={
              <Button className="h-11">
                <Plus className="mr-2 h-4 w-4" />
                {t("settings.branches.add")}
              </Button>
            }
          />
        </div>
      ) : null}

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={branches.length === 0}
        emptyTitle={t("settings.branches.empty")}
        onRetry={() => void refetch()}
        rows={2}
        skeleton={<TableSkeleton columns={6} />}
      >
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("settings.branches.name")}</TableHead>
                <TableHead>{t("settings.branches.code")}</TableHead>
                <TableHead>{t("settings.branches.address")}</TableHead>
                <TableHead>{t("settings.branches.status")}</TableHead>
                <TableHead className="text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell className="font-mono text-xs">{branch.code}</TableCell>
                  <TableCell>{branch.address ?? "—"}</TableCell>
                  <TableCell>
                    <Badge tone={branch.status === "closed" ? "neutral" : "ok"}>
                      {t(`settings.branches.${branch.status === "closed" ? "closed" : "active"}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage ? (
                      <BranchFormDialog
                        branch={branch}
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
