import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryState } from "@/components/common/QueryState";
import { roleLabelKey } from "@/config/permissions";
import { PermissionMatrix } from "./components/PermissionMatrix";
import { CloneRoleDialog, RoleFormDialog } from "./components/RoleDialogs";
import { RoleDiffDialog } from "./components/RoleDiffDialog";
import { useDeleteRole, useRoles } from "./api";

function RolesList() {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useRoles();
  const remove = useDeleteRole();
  const roles = data ?? [];

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      isEmpty={roles.length === 0}
      onRetry={() => void refetch()}
      skeleton={<TableSkeleton columns={6} />}
    >
      <TableCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("roles.columns.role")}</TableHead>
              <TableHead>{t("roles.columns.code")}</TableHead>
              <TableHead>{t("roles.columns.users")}</TableHead>
              <TableHead>{t("roles.columns.permissions")}</TableHead>
              <TableHead className="text-right">{t("common.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">
                  {t(roleLabelKey(role.code), { defaultValue: role.nameUz })}
                  {role.isProtected ? (
                    <Badge tone="warn" className="ml-2">
                      {t("roles.protectedHint")}
                    </Badge>
                  ) : role.isSystem ? (
                    <Badge tone="info" className="ml-2">
                      {t("roles.columns.system")}
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell className="font-mono text-xs">{role.code}</TableCell>
                <TableCell>{role.userCount ?? 0}</TableCell>
                <TableCell>{role.permissionCount ?? 0}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <RoleDiffDialog role={role} />
                    <CloneRoleDialog role={role} />
                    {!role.isProtected ? (
                      <RoleFormDialog
                        role={role}
                        trigger={
                          <Button size="sm" variant="ghost">
                            {t("common.actions.edit")}
                          </Button>
                        }
                      />
                    ) : null}
                    {!role.isProtected && !role.isSystem ? (
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title={t("common.confirm.deleteTitle")}
                        description={t("roles.deleteText", { name: role.nameUz })}
                        sensitive
                        destructive
                        onConfirm={() => remove.mutate(role.id)}
                      />
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>
    </QueryState>
  );
}

export function RolesPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader title={t("roles.title")} subtitle={t("roles.subtitle")}>
        <RoleFormDialog
          trigger={
            <Button className="h-11">
              <Plus className="mr-2 h-4 w-4" />
              {t("roles.add")}
            </Button>
          }
        />
      </PageHeader>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">{t("roles.tabs.list")}</TabsTrigger>
          <TabsTrigger value="matrix">{t("roles.tabs.matrix")}</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <RolesList />
        </TabsContent>
        <TabsContent value="matrix">
          <PermissionMatrix />
        </TabsContent>
      </Tabs>
    </div>
  );
}
