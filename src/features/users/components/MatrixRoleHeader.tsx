import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";
import type { MatrixRole } from "@/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { roleLabelKey } from "@/config/permissions";

interface MatrixRoleHeaderProps {
  role: MatrixRole;
  /** Saqlanmagan o'zgarish bormi. */
  dirty: boolean;
  /** Nechta katak o'zgargan — tasdiq oynasida aytiladi. */
  changeCount: number;
  pending: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

/**
 * Matritsaning rol ustuni sarlavhasi.
 *
 * Saqlash avtomatik emas: o'zgarish soni ko'rinadi, «Saqlash» tasdiq
 * so'raydi va bekor qilish tugmasi yonida turadi (§10.2).
 */
export function MatrixRoleHeader({
  role,
  dirty,
  changeCount,
  pending,
  onSave,
  onDiscard,
}: MatrixRoleHeaderProps) {
  const { t } = useTranslation();
  const label = t(roleLabelKey(role.code), { defaultValue: role.nameUz ?? role.code });

  return (
    <th className="px-2 py-2 text-left font-medium">
      <div className="flex items-center gap-1">
        {label}
        {role.isProtected ? <Badge tone="warn">🔒</Badge> : null}
        {dirty ? <Badge tone="info">{changeCount}</Badge> : null}
      </div>

      {role.isProtected ? null : (
        <div className="mt-1 flex items-center gap-1">
          <ConfirmDialog
            trigger={
              <Button
                size="sm"
                variant={dirty ? "default" : "ghost"}
                className="h-7 px-2"
                disabled={!dirty || pending}
              >
                {t("common.actions.save")}
              </Button>
            }
            title={t("roles.matrix.saveTitle")}
            description={t("roles.matrix.saveText", { role: label, count: changeCount })}
            sensitive
            confirmLabel={t("common.actions.save")}
            pending={pending}
            onConfirm={onSave}
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            disabled={!dirty}
            onClick={onDiscard}
            aria-label={t("common.actions.reset")}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </th>
  );
}
