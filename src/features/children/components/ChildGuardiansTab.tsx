import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Link2, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { QueryState } from "@/components/common/QueryState";
import { GuardianPicker } from "@/components/common/EntityPicker";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { guardianLinkSchema, type GuardianLinkFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { useChildGuardians, useLinkGuardian, useUnlinkGuardian } from "../api";

function LinkGuardianDialog({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const link = useLinkGuardian(childId);

  const form = useEntityForm<GuardianLinkFormValues>({
    schema: guardianLinkSchema,
    defaults: () => ({
      guardianId: "",
      relationship: "",
      isPayer: false,
      isEmergencyContact: false,
      isPrimaryContact: false,
    }),
    onSubmit: async (values) => {
      await link.mutateAsync(values);
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
          <UserPlus className="mr-2 h-4 w-4" />
          {t("guardians.link.add")}
        </Button>
      }
      title={t("guardians.link.title")}
      submitLabel={t("common.actions.link")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <GuardianPicker
          label={t("common.labels.guardian")}
          value={watch("guardianId")}
          onChange={(value) => setValue("guardianId", value, { shouldValidate: true })}
          error={error("guardianId")}
        />
        <Field label={t("guardians.link.relationship")} error={error("relationship")}>
          <Input className="h-11" {...register("relationship")} />
        </Field>
        <div className="space-y-2">
          {(
            [
              ["isPayer", t("guardians.link.isPayer")],
              ["isEmergencyContact", t("guardians.link.isEmergencyContact")],
              ["isPrimaryContact", t("guardians.link.isPrimaryContact")],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={watch(name)}
                onCheckedChange={(checked) => setValue(name, checked === true)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </FormDialog>
  );
}

export function ChildGuardiansTab({ childId, canManage }: { childId: string; canManage: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useChildGuardians(childId);
  const unlink = useUnlinkGuardian(childId);
  const links = data ?? [];

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex justify-end">
          <LinkGuardianDialog childId={childId} />
        </div>
      ) : null}

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={links.length === 0}
        emptyTitle={t("guardians.link.empty")}
        onRetry={() => void refetch()}
        rows={3}
        skeleton={<TableSkeleton columns={6} />}
      >
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("guardians.columns.guardian")}</TableHead>
                <TableHead>{t("guardians.columns.phone")}</TableHead>
                <TableHead>{t("guardians.link.relationship")}</TableHead>
                <TableHead>{t("common.labels.type")}</TableHead>
                <TableHead className="text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.guardianId}>
                  <TableCell className="font-medium">
                    <Link
                      to="/otaonalar/$id"
                      params={{ id: link.guardianId }}
                      className="hover:underline"
                    >
                      {link.fullName ?? link.guardian?.fullName ?? link.guardianId}
                    </Link>
                  </TableCell>
                  <TableCell>{link.phone ?? link.guardian?.phone ?? "—"}</TableCell>
                  <TableCell>{link.relationship}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {link.isPayer ? (
                        <Badge tone="info">{t("guardians.link.isPayer")}</Badge>
                      ) : null}
                      {link.isPrimaryContact ? (
                        <Badge tone="ok">{t("guardians.link.isPrimaryContact")}</Badge>
                      ) : null}
                      {link.isEmergencyContact ? (
                        <Badge tone="warn">{t("guardians.link.isEmergencyContact")}</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage ? (
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title={t("guardians.link.unlink")}
                        description={t("common.confirm.deleteText", {
                          name: link.fullName ?? link.guardian?.fullName ?? "",
                        })}
                        destructive
                        onConfirm={() => unlink.mutate(link.guardianId)}
                      />
                    ) : (
                      <Link2 className="ml-auto h-4 w-4 text-muted-foreground" />
                    )}
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
