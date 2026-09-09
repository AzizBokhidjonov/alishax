import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryState } from "@/components/common/QueryState";
import { usePermissions } from "@/auth/auth-context";
import { P, roleLabelKey } from "@/config/permissions";
import { AssignRoleDialog } from "./components/UserDialogs";
import { UserEditDialog } from "./components/UserFormDialogs";
import { UserLoginHistoryTab, UserOverridesTab, UserPermissionsTab } from "./components/UserTabs";
import { useRemoveUserRole, useUser, useUserRoles } from "./api";

export function UserDetailPage({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const user = useUser(userId);
  const roles = useUserRoles(userId);
  const removeRole = useRemoveUserRole(userId);

  const canSensitive = can(P.roleManageSensitive);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/xodimlar">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("users.title")}
        </Link>
      </Button>

      <QueryState isLoading={user.isLoading} error={user.error} rows={3}>
        {user.data ? (
          <>
            <PageHeader title={user.data.fullName} subtitle={user.data.phone}>
              <UserEditDialog
                user={user.data}
                trigger={
                  <Button variant="outline" className="h-11">
                    <Pencil className="mr-2 h-4 w-4" />
                    {t("common.actions.edit")}
                  </Button>
                }
              />
            </PageHeader>

            <Tabs defaultValue="roles">
              <TabsList>
                <TabsTrigger value="roles">{t("users.tabs.roles")}</TabsTrigger>
                <TabsTrigger value="permissions">{t("users.tabs.permissions")}</TabsTrigger>
                <TabsTrigger value="overrides">{t("users.tabs.overrides")}</TabsTrigger>
                <TabsTrigger value="history">{t("users.tabs.loginHistory")}</TabsTrigger>
              </TabsList>

              <TabsContent value="roles" className="mt-4 space-y-3">
                <div className="flex justify-end">
                  <AssignRoleDialog userId={userId} />
                </div>
                <QueryState
                  isLoading={roles.isLoading}
                  error={roles.error}
                  isEmpty={(roles.data ?? []).length === 0}
                  emptyTitle={t("users.roles.empty")}
                  rows={2}
                >
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("users.roles.role")}</TableHead>
                            <TableHead>{t("common.labels.branch")}</TableHead>
                            <TableHead className="text-right">
                              {t("common.table.actions")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(roles.data ?? []).map((grant) => (
                            <TableRow key={`${grant.roleId}-${grant.branchId ?? "all"}`}>
                              <TableCell className="font-medium">
                                {grant.code
                                  ? t(roleLabelKey(grant.code), {
                                      defaultValue: grant.nameUz ?? grant.code,
                                    })
                                  : grant.roleId}
                              </TableCell>
                              <TableCell>{grant.branchName ?? t("common.actions.all")}</TableCell>
                              <TableCell className="text-right">
                                <ConfirmDialog
                                  trigger={
                                    <Button size="sm" variant="ghost" className="text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  }
                                  title={t("users.roles.removed")}
                                  sensitive
                                  destructive
                                  onConfirm={() =>
                                    removeRole.mutate({
                                      roleId: grant.roleId,
                                      branchId: grant.branchId,
                                    })
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </QueryState>
              </TabsContent>

              <TabsContent value="permissions">
                <UserPermissionsTab userId={userId} />
              </TabsContent>

              <TabsContent value="overrides">
                <UserOverridesTab userId={userId} canSensitive={canSensitive} />
              </TabsContent>

              <TabsContent value="history">
                <UserLoginHistoryTab userId={userId} />
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
