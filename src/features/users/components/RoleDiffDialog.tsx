import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { GitCompare } from "lucide-react";
import { rolesApi, type Role } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { roleLabelKey } from "@/config/permissions";
import { useRoles } from "../api";

/** Ikki rolni yonma-yon taqqoslash (`GET /roles/:id/diff?against=`). */
export function RoleDiffDialog({ role }: { role: Role }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [against, setAgainst] = useState("");
  const roles = useRoles();

  const diff = useQuery({
    queryKey: ["roles", role.id, "diff", against],
    queryFn: () => rolesApi.diff(role.id, against),
    enabled: open && Boolean(against),
  });

  const rows = diff.data ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <GitCompare className="mr-1 h-4 w-4" />
          {t("roles.diff.action")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("roles.diff.title")}</DialogTitle>
        </DialogHeader>

        <SelectField
          label={t("roles.diff.against")}
          value={against}
          onChange={setAgainst}
          options={(roles.data ?? [])
            .filter((item) => item.id !== role.id)
            .map((item) => ({
              value: item.id,
              label: t(roleLabelKey(item.code), { defaultValue: item.nameUz }),
            }))}
        />

        {against ? (
          <QueryState
            isLoading={diff.isLoading}
            error={diff.error}
            isEmpty={rows.length === 0}
            emptyTitle={t("roles.diff.empty")}
            rows={3}
          >
            <div className="max-h-[420px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("roles.matrix.permission")}</TableHead>
                    <TableHead>
                      {t(roleLabelKey(role.code), { defaultValue: role.nameUz })}
                    </TableHead>
                    <TableHead>{t("roles.diff.against")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((entry) => (
                    <TableRow key={entry.key}>
                      <TableCell className="font-mono text-xs">{entry.key}</TableCell>
                      <TableCell>
                        {entry.left ? (
                          <Badge tone="ok">{t(`domain.scopes.${entry.left}`)}</Badge>
                        ) : (
                          <span className="text-muted-foreground">{t("roles.matrix.none")}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.right ? (
                          <Badge tone="info">{t(`domain.scopes.${entry.right}`)}</Badge>
                        ) : (
                          <span className="text-muted-foreground">{t("roles.matrix.none")}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </QueryState>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
