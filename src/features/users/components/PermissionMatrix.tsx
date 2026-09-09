import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import type { Scope } from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { TableCard } from "@/components/common/TableCard";
import { Input } from "@/components/ui/input";
import { QueryState } from "@/components/common/QueryState";
import { usePermissions } from "@/auth/auth-context";
import {
  usePermissionCatalog,
  usePermissionGroups,
  useReplaceRolePermissions,
  useRolesMatrix,
} from "../api";
import { focusRing } from "@/lib/utils";
import { MatrixRoleHeader } from "./MatrixRoleHeader";

type Grants = Record<string, Record<string, Scope | "">>;

/**
 * Rollar × ruxsatlar to'ri (B3). Saqlash rolning ruxsatlarini TO'LIQ
 * almashtiradi (`PUT /roles/:id/permissions`), shuning uchun tahrir faqat
 * mahalliy holatda yig'iladi va bitta so'rov bilan yuboriladi.
 *
 * Uchta qoida (§10.2):
 *  - katak faqat SHU ruxsat qabul qiladigan qamrovlarni taklif qiladi;
 *  - o'zgargan rol aniq belgilanadi, «Saqlash» va «Bekor qilish» shunga
 *    bog'lanadi — avtomatik saqlash yo'q;
 *  - o'zida yo'q ruxsatni berib bo'lmaydi (`PRIVILEGE_ESCALATION` ni
 *    kutmasdan oldindan to'siladi).
 */
export function PermissionMatrix() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const matrix = useRolesMatrix();
  const groups = usePermissionGroups();
  const replace = useReplaceRolePermissions();

  const [showDeprecated, setShowDeprecated] = useState(false);
  const catalog = usePermissionCatalog(showDeprecated);

  const [draft, setDraft] = useState<Grants>({});
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");

  useEffect(() => {
    if (!matrix.data) return;
    const next: Grants = {};
    for (const role of matrix.data.roles) next[role.id] = { ...role.grants };
    setDraft(next);
  }, [matrix.data]);

  /** Kalit -> katalogdagi ta'rif (ruxsat etilgan qamrovlar, eskirgani). */
  const defs = useMemo(
    () => new Map((catalog.data ?? []).map((item) => [item.key, item])),
    [catalog.data],
  );

  const permissions = useMemo(() => {
    const list = matrix.data?.permissions ?? [];
    return list.filter((permission) => {
      const def = defs.get(permission.key);
      if (def?.deprecated && !showDeprecated) return false;
      const matchesGroup = group === "all" || permission.group === group;
      const matchesSearch =
        !search.trim() || permission.key.toLowerCase().includes(search.trim().toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [matrix.data, defs, showDeprecated, group, search]);

  const roles = matrix.data?.roles ?? [];

  /** Rol saqlanmagan o'zgarishga egami. */
  const isDirty = (roleId: string) => {
    const saved = roles.find((role) => role.id === roleId)?.grants ?? {};
    const current = draft[roleId] ?? {};
    const keys = new Set([...Object.keys(saved), ...Object.keys(current)]);
    for (const key of keys) {
      if ((saved[key] ?? "") !== (current[key] ?? "")) return true;
    }
    return false;
  };

  const setCell = (roleId: string, key: string, value: Scope | "") => {
    setDraft((current) => ({ ...current, [roleId]: { ...current[roleId], [key]: value } }));
  };

  const discard = (roleId: string) => {
    const saved = roles.find((role) => role.id === roleId)?.grants ?? {};
    setDraft((current) => ({ ...current, [roleId]: { ...saved } }));
  };

  const changeCount = (roleId: string) => {
    const saved = roles.find((role) => role.id === roleId)?.grants ?? {};
    const current = draft[roleId] ?? {};
    const keys = new Set([...Object.keys(saved), ...Object.keys(current)]);
    let count = 0;
    for (const key of keys) if ((saved[key] ?? "") !== (current[key] ?? "")) count += 1;
    return count;
  };

  const save = (roleId: string) => {
    const entries = Object.entries(draft[roleId] ?? {})
      .filter(([, scope]) => scope !== "")
      .map(([key, scope]) => ({ key, scope: scope as Scope }));
    replace.mutate({ id: roleId, permissions: entries });
  };

  return (
    <QueryState
      isLoading={matrix.isLoading}
      error={matrix.error}
      isEmpty={roles.length === 0}
      onRetry={() => void matrix.refetch()}
      rows={4}
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("roles.matrix.search")}
                className="h-11 pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setGroup("all")}
                className={`rounded-xl px-3 py-1.5 text-sm ${focusRing} ${
                  group === "all" ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
              >
                {t("common.actions.all")}
              </button>
              {(groups.data ?? []).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setGroup(name)}
                  className={`rounded-xl px-3 py-1.5 text-sm ${focusRing} ${
                    group === name ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={showDeprecated} onCheckedChange={setShowDeprecated} />
              {t("roles.matrix.showDeprecated")}
            </label>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">{t("roles.matrix.hint")}</p>

        <TableCard>
          {/*
            Xom `<table>` — skroll o'rami qo'lda. Ruxsat matritsasi har bir
            rol uchun bitta ustun chiqaradi, shuning uchun u eng keng jadval.
          */}
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 border-b border-border bg-card">
                <tr>
                  <th className="sticky left-0 z-20 min-w-60 bg-card px-3 py-2 text-left font-medium">
                    {t("roles.matrix.permission")}
                  </th>
                  {roles.map((role) => (
                    <MatrixRoleHeader
                      key={role.id}
                      role={role}
                      dirty={isDirty(role.id)}
                      changeCount={changeCount(role.id)}
                      pending={replace.isPending}
                      onSave={() => save(role.id)}
                      onDiscard={() => discard(role.id)}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((permission) => {
                  const def = defs.get(permission.key);
                  // Katalog kelmaguncha barcha qamrovlar emas, faqat mavjudi.
                  const allowed = def?.allowedScopes ?? [];
                  // O'zida yo'q ruxsatni berib bo'lmaydi.
                  const canGrant = can(permission.key);
                  return (
                    <tr key={permission.key} className="border-b border-border last:border-0">
                      <td className="sticky left-0 z-10 bg-card px-3 py-2">
                        <div className="font-mono text-xs">{permission.key}</div>
                        <div className="text-xs text-muted-foreground">
                          {permission.group}
                          {permission.sensitive ? ` · ⚠ ${t("roles.matrix.sensitive")}` : ""}
                          {def?.deprecated ? ` · ${t("roles.matrix.deprecated")}` : ""}
                        </div>
                      </td>
                      {roles.map((role) => (
                        <td key={role.id} className="px-2 py-1">
                          <select
                            className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs disabled:opacity-50"
                            value={draft[role.id]?.[permission.key] ?? ""}
                            disabled={role.isProtected || !canGrant}
                            title={canGrant ? undefined : t("roles.matrix.cannotGrant")}
                            onChange={(event) =>
                              setCell(role.id, permission.key, event.target.value as Scope | "")
                            }
                          >
                            <option value="">{t("roles.matrix.none")}</option>
                            {allowed.map((scope) => (
                              <option key={scope} value={scope}>
                                {t(`domain.scopes.${scope}`)}
                              </option>
                            ))}
                          </select>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TableCard>
      </div>
    </QueryState>
  );
}
