import { useTranslation } from "react-i18next";
import { BadgeCheck, FilePlus } from "lucide-react";
import type { ChildDocument, ChildDocumentType } from "@/api";
import { Button } from "@/components/ui/button";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { FileUploadField } from "@/components/common/FileUploadField";
import { FileLink } from "@/components/common/FileLink";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { childDocumentSchema, type ChildDocumentFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { formatDate, todayIso } from "@/lib/dates";
import { useAddDocument, useChildDocuments, useVerifyDocument } from "../api";
import { DatePicker } from "@/components/common/DateField";

const DOC_TYPES: ChildDocumentType[] = [
  "birth_certificate",
  "parent_passport",
  "medical_certificate",
  "contract",
  "consent",
  "other",
];

function DocumentFormDialog({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const add = useAddDocument(childId);

  const form = useEntityForm<ChildDocumentFormValues>({
    schema: childDocumentSchema,
    defaults: () => ({ type: "birth_certificate" }),
    onSubmit: async (values) => {
      await add.mutateAsync(values);
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
          <FilePlus className="mr-2 h-4 w-4" />
          {t("children.documents.add")}
        </Button>
      }
      title={t("children.documents.add")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <SelectField
          label={t("children.documents.type")}
          value={watch("type")}
          onChange={(value) =>
            setValue("type", value as ChildDocumentType, { shouldValidate: true })
          }
          options={DOC_TYPES.map((type) => ({
            value: type,
            label: t(`domain.documentType.${type}`),
          }))}
          error={error("type")}
        />
        <Field label={t("children.documents.number")} error={error("number")}>
          <Input className="h-11" {...register("number")} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("children.documents.issueDate")} error={error("issueDate")}>
            <DatePicker
              max={todayIso()}
              value={watch("issueDate") ?? ""}
              onChange={(value) => setValue("issueDate", value, { shouldValidate: true })}
            />
          </Field>
          <Field label={t("children.documents.expiryDate")} error={error("expiryDate")}>
            <DatePicker
              value={watch("expiryDate") ?? ""}
              onChange={(value) => setValue("expiryDate", value, { shouldValidate: true })}
            />
          </Field>
        </div>
        <FileUploadField
          label={t("children.documents.file")}
          value={watch("fileId")}
          onChange={(fileId) => setValue("fileId", fileId)}
          entityType="child_document"
          entityId={childId}
        />
        <Field label={t("common.labels.note")} error={error("note")}>
          <Textarea rows={2} {...register("note")} />
        </Field>
      </div>
    </FormDialog>
  );
}

/** Muddati tugagan yoki tugayotgan hujjat alohida rangda ko'rsatiladi. */
function expiryTone(document: ChildDocument): "danger" | "warn" | "neutral" {
  if (!document.expiryDate) return "neutral";
  const today = todayIso();
  if (document.expiryDate < today) return "danger";
  const soon = new Date(`${today}T00:00:00Z`);
  soon.setUTCDate(soon.getUTCDate() + 30);
  return document.expiryDate <= soon.toISOString().slice(0, 10) ? "warn" : "neutral";
}

export function ChildDocumentsTab({ childId, canManage }: { childId: string; canManage: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useChildDocuments(childId);
  const verify = useVerifyDocument(childId);
  const documents = data ?? [];

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex justify-end">
          <DocumentFormDialog childId={childId} />
        </div>
      ) : null}

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={documents.length === 0}
        emptyTitle={t("children.documents.empty")}
        onRetry={() => void refetch()}
        rows={3}
        skeleton={<TableSkeleton columns={8} />}
      >
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("children.documents.type")}</TableHead>
                <TableHead>{t("children.documents.number")}</TableHead>
                <TableHead>{t("children.documents.issueDate")}</TableHead>
                <TableHead>{t("children.documents.expiryDate")}</TableHead>
                <TableHead>{t("common.labels.status")}</TableHead>
                <TableHead>{t("children.documents.file")}</TableHead>
                <TableHead className="text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell className="font-medium">
                    {t(`domain.documentType.${document.type}`)}
                  </TableCell>
                  <TableCell>{document.number ?? "—"}</TableCell>
                  <TableCell>{formatDate(document.issueDate)}</TableCell>
                  <TableCell>
                    {document.expiryDate ? (
                      <Badge tone={expiryTone(document)}>{formatDate(document.expiryDate)}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {document.verifiedAt ? (
                      <Badge tone="ok">{t("children.documents.verified")}</Badge>
                    ) : (
                      <Badge tone="neutral">{t("children.documents.notVerified")}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <FileLink fileId={document.fileId} />
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage && !document.verifiedAt ? (
                      <Button size="sm" variant="ghost" onClick={() => verify.mutate(document.id)}>
                        <BadgeCheck className="mr-1 h-4 w-4" />
                        {t("children.documents.verify")}
                      </Button>
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
