import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
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
import { QueryState } from "@/components/common/QueryState";
import { formatDateTime } from "@/lib/dates";
import { OverrideDialog } from "./UserDialogs";
import {
  useEffectivePermissions,
  useLoginHistory,
  useRemoveOverride,
  useUserOverrides,
} from "../api";

/** «Nega bu amalni qila oladi?» — har bir ruxsat qaysi roldan kelgani. */
export function UserPermissionsTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const permissions = useEffectivePermissions(userId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("users.effective.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("users.effective.hint")}</p>
      </CardHeader>
      <CardContent className="p-0">
        <QueryState
          isLoading={permissions.isLoading}
          error={permissions.error}
          isEmpty={(permissions.data ?? []).length === 0}
          emptyTitle={t("users.effective.empty")}
          rows={3}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("users.effective.key")}</TableHead>
                <TableHead>{t("users.effective.scope")}</TableHead>
                <TableHead>{t("users.effective.source")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(permissions.data ?? []).map((permission) => (
                <TableRow key={permission.key}>
                  <TableCell className="font-mono text-xs">{permission.key}</TableCell>
                  <TableCell>
                    <Badge tone="info">{t(`domain.scopes.${permission.scope}`)}</Badge>
                  </TableCell>
                  <TableCell>{permission.grantedBy ?? permission.source ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </QueryState>
      </CardContent>
    </Card>
  );
}

/** Alohida ruxsatlar. Yechim tartibi: taqiq → ruxsat → rollar birlashmasi. */
export function UserOverridesTab({
  userId,
  canSensitive,
}: {
  userId: string;
  canSensitive: boolean;
}) {
  const { t } = useTranslation();
  const overrides = useUserOverrides(userId);
  const removeOverride = useRemoveOverride(userId);

  return (
    <div className="space-y-3">
      {canSensitive ? (
        <div className="flex justify-end">
          <OverrideDialog userId={userId} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("users.overrides.sensitive")}</p>
      )}

      <QueryState
        isLoading={overrides.isLoading}
        error={overrides.error}
        isEmpty={(overrides.data ?? []).length === 0}
        emptyTitle={t("users.overrides.empty")}
        rows={2}
      >
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("users.overrides.key")}</TableHead>
                  <TableHead>{t("users.overrides.effect")}</TableHead>
                  <TableHead>{t("users.overrides.scope")}</TableHead>
                  <TableHead>{t("users.overrides.reason")}</TableHead>
                  <TableHead className="text-right">{t("common.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(overrides.data ?? []).map((override) => (
                  <TableRow key={override.key}>
                    <TableCell className="font-mono text-xs">{override.key}</TableCell>
                    <TableCell>
                      <Badge tone={override.effect === "deny" ? "danger" : "ok"}>
                        {t(`users.overrides.${override.effect}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{t(`domain.scopes.${override.scope}`)}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{override.reason}</TableCell>
                    <TableCell className="text-right">
                      {canSensitive ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => removeOverride.mutate(override.key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </QueryState>
    </div>
  );
}

export function UserLoginHistoryTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const history = useLoginHistory(userId);

  return (
    <QueryState
      isLoading={history.isLoading}
      error={history.error}
      isEmpty={(history.data ?? []).length === 0}
      emptyTitle={t("users.loginHistory.empty")}
      rows={3}
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("users.loginHistory.at")}</TableHead>
                <TableHead>{t("users.loginHistory.ip")}</TableHead>
                <TableHead>{t("users.loginHistory.device")}</TableHead>
                <TableHead>{t("users.loginHistory.result")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(history.data ?? []).map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDateTime(entry.at)}</TableCell>
                  <TableCell>{entry.ip ?? "—"}</TableCell>
                  <TableCell className="max-w-[280px] truncate">{entry.userAgent ?? "—"}</TableCell>
                  <TableCell>
                    <Badge tone={entry.success === false ? "danger" : "ok"}>
                      {t(`users.loginHistory.${entry.success === false ? "failed" : "success"}`)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </QueryState>
  );
}
