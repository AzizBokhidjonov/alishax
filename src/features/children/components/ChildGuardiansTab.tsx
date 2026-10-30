import { AddFamilyDialog } from "./AddFamilyDialog";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Link2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { relationshipLabel } from "@/lib/relationships";
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
import { useChildGuardians, useUnlinkGuardian } from "../api";

export function ChildGuardiansTab({ childId, canManage }: { childId: string; canManage: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useChildGuardians(childId);
  const unlink = useUnlinkGuardian(childId);
  const links = data ?? [];

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex flex-wrap justify-end gap-2">
          <AddFamilyDialog childId={childId} />
        </div>
      ) : null}

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={links.length === 0}
        emptyTitle={t("guardians.link.empty")}
        emptyDescription={t("flows.familyHint")}
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
                      {link.fullName ?? link.guardian?.fullName ?? t("flows.unknownName")}
                    </Link>
                  </TableCell>
                  <TableCell>{link.phone ?? link.guardian?.phone ?? "—"}</TableCell>
                  <TableCell>{relationshipLabel(link.relationship, t)}</TableCell>
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
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            aria-label={
                              t("guardians.link.unlink") +
                              " — " +
                              (link.fullName ?? link.guardian?.fullName ?? t("flows.unknownName"))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title={t("guardians.link.unlink")}
                        description={t("flows.unlinkHint", {
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
