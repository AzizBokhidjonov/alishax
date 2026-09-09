import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import type { ConsentType } from "@/api";
import { Button } from "@/components/ui/button";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
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
import { GuardianPicker } from "@/components/common/EntityPicker";
import { FileUploadField } from "@/components/common/FileUploadField";
import { FormDialog } from "@/components/forms/FormDialog";
import { consentSchema, type ConsentFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { formatDate } from "@/lib/dates";
import { useConsents, useRecordConsent, useRevokeConsent } from "../api";

const CONSENT_TYPES: ConsentType[] = [
  "personal_data",
  "photography",
  "medical_storage",
  "notifications",
  "mobile_access",
];

function ConsentFormDialog({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const record = useRecordConsent(childId);

  const form = useEntityForm<ConsentFormValues>({
    schema: consentSchema,
    defaults: () => ({ guardianId: "", consentType: "personal_data", granted: true }),
    onSubmit: async (values) => {
      await record.mutateAsync(values);
    },
  });

  const { watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button className="h-11">
          <Plus className="mr-2 h-4 w-4" />
          {t("children.consents.add")}
        </Button>
      }
      title={t("children.consents.add")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <GuardianPicker
          label={t("children.consents.guardian")}
          value={watch("guardianId")}
          onChange={(value) => setValue("guardianId", value, { shouldValidate: true })}
          error={error("guardianId")}
        />
        <SelectField
          label={t("children.consents.type")}
          value={watch("consentType")}
          onChange={(value) =>
            setValue("consentType", value as ConsentType, { shouldValidate: true })
          }
          options={CONSENT_TYPES.map((type) => ({
            value: type,
            label: t(`domain.consentType.${type}`),
          }))}
          error={error("consentType")}
        />
        <SelectField
          label={t("common.labels.status")}
          value={watch("granted") ? "true" : "false"}
          onChange={(value) => setValue("granted", value === "true")}
          options={[
            { value: "true", label: t("children.consents.granted") },
            { value: "false", label: t("common.labels.no") },
          ]}
        />
        <FileUploadField
          label={t("children.consents.evidence")}
          value={watch("evidenceFileId")}
          onChange={(fileId) => setValue("evidenceFileId", fileId)}
          entityType="consent"
          entityId={childId}
        />
      </div>
    </FormDialog>
  );
}

export function ChildConsentsTab({ childId, canManage }: { childId: string; canManage: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useConsents(childId);
  const revoke = useRevokeConsent(childId);
  const consents = data ?? [];

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex justify-end">
          <ConsentFormDialog childId={childId} />
        </div>
      ) : null}

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={consents.length === 0}
        emptyTitle={t("children.consents.empty")}
        onRetry={() => void refetch()}
        rows={3}
        skeleton={<TableSkeleton columns={6} />}
      >
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("children.consents.type")}</TableHead>
                <TableHead>{t("children.consents.guardian")}</TableHead>
                <TableHead>{t("common.labels.status")}</TableHead>
                <TableHead>{t("common.labels.createdAt")}</TableHead>
                <TableHead className="text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consents.map((consent) => (
                <TableRow key={consent.id}>
                  <TableCell className="font-medium">
                    {t(`domain.consentType.${consent.consentType}`)}
                  </TableCell>
                  <TableCell>{consent.guardianName ?? consent.guardianId}</TableCell>
                  <TableCell>
                    {consent.revokedAt ? (
                      <Badge tone="danger">{t("children.consents.revoked")}</Badge>
                    ) : consent.granted ? (
                      <Badge tone="ok">{t("children.consents.granted")}</Badge>
                    ) : (
                      <Badge tone="neutral">{t("common.labels.no")}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(consent.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {canManage && !consent.revokedAt ? (
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="ghost" className="text-destructive">
                            {t("common.actions.revoke")}
                          </Button>
                        }
                        title={t("children.consents.revoke")}
                        destructive
                        onConfirm={() => revoke.mutate(consent.id)}
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
