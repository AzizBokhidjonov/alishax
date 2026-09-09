import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Send } from "lucide-react";
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
import { ChildStatusBadge } from "@/components/common/StatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryState } from "@/components/common/QueryState";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { GuardianFormDialog } from "./components/GuardianFormDialog";
import { useGuardian, useGuardianChildren, useTelegramInvite } from "./api";

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export function GuardianDetailPage({ guardianId }: { guardianId: string }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { data: guardian, isLoading, error, refetch } = useGuardian(guardianId);
  const children = useGuardianChildren(guardianId);
  const invite = useTelegramInvite();
  const canManage = can(P.guardianManage);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/otaonalar">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("guardians.title")}
        </Link>
      </Button>

      <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()} rows={3}>
        {guardian ? (
          <>
            <PageHeader title={guardian.fullName} subtitle={guardian.phone}>
              {canManage ? (
                <div className="flex gap-2">
                  {!guardian.telegramBound ? (
                    <Button
                      variant="outline"
                      className="h-11"
                      onClick={() => invite.mutate(guardian.id)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {t("guardians.telegram.invite")}
                    </Button>
                  ) : null}
                  <GuardianFormDialog
                    guardian={guardian}
                    trigger={
                      <Button className="h-11">
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("common.actions.edit")}
                      </Button>
                    }
                  />
                </div>
              ) : null}
            </PageHeader>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">{t("common.actions.details")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Row label={t("guardians.form.phoneAlt")} value={guardian.phoneAlt} />
                  <Row label={t("guardians.form.email")} value={guardian.email} />
                  <Row label={t("guardians.form.address")} value={guardian.address} />
                  <Row label={t("guardians.form.workplace")} value={guardian.workplace} />
                  <Row label={t("guardians.form.passportNumber")} value={guardian.passportNumber} />
                  <Row
                    label={t("guardians.form.preferredLanguage")}
                    value={
                      guardian.preferredLanguage
                        ? t(`common.language.${guardian.preferredLanguage}`)
                        : null
                    }
                  />
                  <div className="pt-3">
                    {guardian.telegramBound ? (
                      <Badge tone="ok">{t("guardians.telegram.bound")}</Badge>
                    ) : (
                      <Badge tone="neutral">{t("guardians.telegram.unbound")}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">{t("guardians.childrenTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <QueryState
                    isLoading={children.isLoading}
                    error={children.error}
                    isEmpty={(children.data ?? []).length === 0}
                    emptyTitle={t("common.table.empty")}
                    rows={2}
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("common.labels.child")}</TableHead>
                          <TableHead>{t("common.labels.group")}</TableHead>
                          <TableHead>{t("common.labels.status")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(children.data ?? []).map((child) => (
                          <TableRow key={child.id}>
                            <TableCell className="font-medium">
                              <Link
                                to="/bolalar/$id"
                                params={{ id: child.id }}
                                className="hover:underline"
                              >
                                {child.lastName} {child.firstName}
                              </Link>
                            </TableCell>
                            <TableCell>{child.groupName ?? "—"}</TableCell>
                            <TableCell>
                              <ChildStatusBadge status={child.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </QueryState>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
