import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { QueryState } from "@/components/common/QueryState";
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
import { formatDateTime } from "@/lib/dates";
import { useLandingVersions, useRestoreVersion } from "../api";

/**
 * Chop etish tarixi.
 *
 * Amal «Tiklash» deb ataladi, «orqaga qaytarish» emas: tarix faqat o'sadi —
 * tiklash eski nusxani qoralamaga yozadi va uni YANGI versiya sifatida chop
 * etadi, ya'ni tiklashning o'zini ham qaytarib bo'ladi (§4).
 */
export function VersionsPanel({
  canPublish,
  currentVersion,
}: {
  canPublish: boolean;
  currentVersion: number | null;
}) {
  const { t } = useTranslation();
  const versions = useLandingVersions();
  const restore = useRestoreVersion();

  return (
    <QueryState
      isLoading={versions.isLoading}
      error={versions.error}
      isEmpty={(versions.data ?? []).length === 0}
      emptyTitle={t("website.versions.empty")}
      emptyDescription={t("website.versions.emptyHint")}
      onRetry={() => void versions.refetch()}
      skeleton={<TableSkeleton columns={4} rows={3} />}
    >
      <TableCard title={t("website.versions.title")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">{t("website.versions.version")}</TableHead>
              <TableHead>{t("website.versions.note")}</TableHead>
              <TableHead>{t("website.versions.publishedAt")}</TableHead>
              <TableHead>{t("website.versions.publishedBy")}</TableHead>
              <TableHead className="text-right">{t("common.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(versions.data ?? []).map((version) => (
              <TableRow key={version.id ?? version.version}>
                <TableCell className="font-bold tabular-nums">
                  v{version.version}
                  {version.version === currentVersion ? (
                    <Badge tone="ok" className="ml-2">
                      {t("website.versions.live")}
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell>{version.note ?? "—"}</TableCell>
                <TableCell>{formatDateTime(version.publishedAt)}</TableCell>
                <TableCell>{version.publishedBy ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {canPublish && version.version !== currentVersion ? (
                    <ConfirmDialog
                      trigger={
                        <Button variant="outline" size="sm">
                          <RotateCcw className="mr-1 h-4 w-4" />
                          {t("website.versions.restore")}
                        </Button>
                      }
                      title={t("website.versions.restore")}
                      description={t("website.versions.restoreHint", { version: version.version })}
                      confirmLabel={t("website.versions.restore")}
                      pending={restore.isPending}
                      onConfirm={() => restore.mutate(version.version)}
                    />
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>
    </QueryState>
  );
}
