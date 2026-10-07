import { useTranslation } from "react-i18next";
import { permissionHolderName } from "@/api";
import { Ban } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AuthAvatarImage } from "@/components/common/AuthImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDate, formatDateTime, todayIso } from "@/lib/dates";
import {
  useActivePermissions,
  usePickupHistory,
  usePickupPersons,
  useRevokePickupPerson,
} from "../api";
import { PickupPersonForm } from "./PickupPersonForm";
import { TemporaryPermissionForm } from "./TemporaryPermissionForm";

/** Bola bo'yicha olib ketuvchilar, ruxsatlar va tarix. */
export function PickupPersonsPanel({
  childId,
  canManage,
}: {
  childId: string;
  canManage: boolean;
}) {
  const { t } = useTranslation();
  const persons = usePickupPersons(childId);
  const active = useActivePermissions(childId, todayIso());
  const history = usePickupHistory(childId);
  const revoke = useRevokePickupPerson(childId);
  const today = todayIso();

  const list = persons.data ?? [];

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex flex-wrap justify-end gap-2">
          <TemporaryPermissionForm childId={childId} />
          <PickupPersonForm childId={childId} />
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("pickup.persons.active")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <QueryState
            isLoading={active.isLoading}
            error={active.error}
            isEmpty={(active.data ?? []).length === 0}
            emptyTitle={t("pickup.persons.empty")}
            /* Bu yerda filtr yo'q — standart «filtrlarni o'zgartiring» matni chalg'itadi (§2.8). */
            emptyDescription={t("pickup.persons.emptyHint")}
            rows={1}
          >
            {/*
              Ruxsat egasi ro'yxatdagi shaxs ham, BIR MARTALIK ism ham
              bo'lishi mumkin — `permissionHolderName()` ikkalasini ham
              o'qiydi (Handbook, 2026-10-04).
            */}
            {(active.data ?? []).map((permission) => (
              <span
                key={permission.id}
                className="rounded-xl border border-st-ok-border bg-st-ok-soft px-3 py-1.5 text-sm text-st-ok-fg"
              >
                {permissionHolderName(permission) || t("pickup.persons.unnamed")}
                {permission.validTo ? ` · ${formatDate(permission.validTo)}` : ""}
              </span>
            ))}
          </QueryState>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("pickup.persons.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            isLoading={persons.isLoading}
            error={persons.error}
            isEmpty={list.length === 0}
            emptyTitle={t("pickup.persons.empty")}
            emptyDescription={t("pickup.persons.emptyHint")}
            onRetry={() => void persons.refetch()}
            rows={2}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("pickup.persons.fullName")}</TableHead>
                  <TableHead>{t("pickup.persons.relationship")}</TableHead>
                  <TableHead>{t("pickup.persons.permissionType")}</TableHead>
                  <TableHead>{t("common.labels.date")}</TableHead>
                  <TableHead className="text-right">{t("common.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((person) => {
                  const expired = Boolean(person.validTo && person.validTo < today);
                  return (
                    <TableRow key={person.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AuthAvatarImage fileId={person.photoFileId} src={person.photoUrl} />
                            <AvatarFallback>{person.fullName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{person.fullName}</div>
                            {person.phone ? (
                              <div className="text-xs text-muted-foreground">{person.phone}</div>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{person.relationship ?? "—"}</TableCell>
                      <TableCell>
                        <Badge tone={person.permissionType === "permanent" ? "ok" : "info"}>
                          {t(`domain.permissionType.${person.permissionType}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(person.validFrom)}
                        {person.validTo ? ` — ${formatDate(person.validTo)}` : ""}
                        {person.revokedAt ? (
                          <Badge tone="danger" className="ml-2">
                            {t("pickup.persons.revoked")}
                          </Badge>
                        ) : expired ? (
                          <Badge tone="warn" className="ml-2">
                            {t("errors.PERMISSION_EXPIRED")}
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && !person.revokedAt ? (
                          <ConfirmDialog
                            trigger={
                              <Button size="sm" variant="ghost" className="text-destructive">
                                <Ban className="mr-1 h-4 w-4" />
                                {t("common.actions.revoke")}
                              </Button>
                            }
                            title={t("pickup.persons.revoke")}
                            requireReason
                            reasonLabel={t("pickup.persons.revokeReason")}
                            destructive
                            onConfirm={(reason) => revoke.mutate({ id: person.id, reason })}
                          />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </QueryState>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("pickup.history.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            isLoading={history.isLoading}
            error={history.error}
            isEmpty={(history.data ?? []).length === 0}
            emptyTitle={t("pickup.history.empty")}
            rows={2}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("pickup.history.at")}</TableHead>
                  <TableHead>{t("pickup.history.person")}</TableHead>
                  <TableHead>{t("pickup.history.by")}</TableHead>
                  <TableHead>{t("common.labels.note")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(history.data ?? []).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDateTime(entry.at)}</TableCell>
                    <TableCell>{entry.pickupPersonName ?? "—"}</TableCell>
                    <TableCell>{entry.userName ?? "—"}</TableCell>
                    <TableCell>{entry.note ?? entry.action ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </QueryState>
        </CardContent>
      </Card>
    </div>
  );
}
