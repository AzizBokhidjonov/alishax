import { useTranslation } from "react-i18next";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { permissionHolderName, type PickupRecipient } from "@/api";
import { AuthAvatar } from "@/components/common/AuthImage";
import { Badge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, focusRing } from "@/lib/utils";
import { todayIso } from "@/lib/dates";
import { useActivePermissions, usePickupGuardians } from "../api";

/**
 * Bolani kim olib ketadi (Handbook, 2026-10-04).
 *
 * IKKI guruh va ular ALOHIDA yuklanadi:
 *
 *   1. Ota-ona/vasiylar — `/lookups/children/{id}/pickup-guardians`;
 *   2. Boshqa ruxsat berilgan odamlar — `/pickup-permissions/active`.
 *
 * Nega alohida: ilgari faqat ikkinchi ro'yxat bor edi va bog'langan ota-ona
 * uchun ham ALOHIDA «olib ketuvchi shaxs» yozuvi yaratish kerak bo'lardi.
 * Endi bog'langan ota-ona o'z-o'zidan olib ketish huquqiga ega, qo'shimcha
 * ruxsat ro'yxati esa BO'SH bo'lsa ham bu huquqni bloklamaydi.
 *
 * Shuning uchun har bir guruh o'z holatini o'zi ko'rsatadi: biri xato bersa,
 * ikkinchisi ishlashda davom etadi — qabulxona hech bo'lmasa bitta yo'l bilan
 * bolani berishi mumkin bo'lsin.
 */
interface Props {
  childId: string;
  value: PickupRecipient | null;
  onChange: (recipient: PickupRecipient) => void;
  /** Tanlagich qaysi huquq ostida ishlayapti — lookup shuni talab qiladi. */
  permission?: "pickup:read" | "pickup:manage" | "pickup:temporary";
  className?: string;
}

const isSame = (a: PickupRecipient | null, kind: PickupRecipient["kind"], id: string): boolean =>
  a?.kind === kind && a.id === id;

function GroupTitle({ children }: { children: string }) {
  return (
    <h3 className="px-1 pb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

/** Bitta guruhning xatosi — butun ekranni egallamaydi, faqat o'z joyida. */
function GroupError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 rounded-xl border border-st-danger-border bg-st-danger-soft px-3 py-2 text-sm text-st-danger-fg">
      <AlertTriangle aria-hidden className="h-4 w-4 shrink-0" />
      <span className="flex-1">{t("pickup.recipients.loadFailed")}</span>
      <Button variant="ghost" size="sm" className="h-7" onClick={onRetry}>
        <RefreshCw aria-hidden className="mr-1 h-3.5 w-3.5" />
        {t("common.actions.retry")}
      </Button>
    </div>
  );
}

function Option({
  selected,
  onSelect,
  name,
  detail,
  photoFileId,
  photoUrl,
  badge,
}: {
  selected: boolean;
  onSelect: () => void;
  name: string;
  detail?: string;
  photoFileId?: string;
  photoUrl?: string;
  badge?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex min-h-16 w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
        focusRing,
        selected
          ? "border-brand bg-brand-soft"
          : "border-border hover:border-input hover:bg-secondary",
      )}
    >
      <AuthAvatar fileId={photoFileId} src={photoUrl} name={name} className="h-12 w-12 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{name}</span>
        {detail ? (
          <span className="block truncate text-sm text-muted-foreground">{detail}</span>
        ) : null}
      </span>
      {badge}
    </button>
  );
}

export function PickupRecipientPicker({
  childId,
  value,
  onChange,
  permission = "pickup:read",
  className,
}: Props) {
  const { t } = useTranslation();
  const today = todayIso();
  const guardians = usePickupGuardians(childId, permission);
  const permissions = useActivePermissions(childId, today);

  const guardianList = guardians.data ?? [];
  const permissionList = permissions.data ?? [];
  const loading = guardians.isLoading || permissions.isLoading;

  /*
    Ikkala ro'yxat ham bo'sh VA ikkalasi ham muvaffaqiyatli yuklangan — faqat
    shundagina «hech kim yo'q» deyish to'g'ri. Xato holati bu emas: xatoda
    ro'yxat bo'sh ko'rinadi, lekin sababi boshqa (§0).
  */
  const trulyEmpty =
    !loading &&
    !guardians.error &&
    !permissions.error &&
    guardianList.length === 0 &&
    permissionList.length === 0;

  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("pickup.verify.person")}
      className={cn("space-y-4", className)}
    >
      <section>
        <GroupTitle>{t("pickup.recipients.guardians")}</GroupTitle>
        {guardians.error ? (
          <GroupError onRetry={() => void guardians.refetch()} />
        ) : guardianList.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">{t("pickup.recipients.noGuardians")}</p>
        ) : (
          <div className="space-y-2">
            {guardianList.map((guardian) => (
              <Option
                key={guardian.id}
                selected={isSame(value, "guardian", guardian.id)}
                onSelect={() => onChange({ kind: "guardian", id: guardian.id })}
                name={guardian.fullName}
                detail={
                  [
                    guardian.relationship
                      ? t(`domain.relationship.${guardian.relationship}`, {
                          defaultValue: guardian.relationship,
                        })
                      : undefined,
                    guardian.phone,
                  ]
                    .filter(Boolean)
                    .join(" · ") || undefined
                }
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <GroupTitle>{t("pickup.recipients.others")}</GroupTitle>
        {permissions.error ? (
          <GroupError onRetry={() => void permissions.refetch()} />
        ) : permissionList.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">{t("pickup.recipients.noOthers")}</p>
        ) : (
          <div className="space-y-2">
            {permissionList.map((item) => {
              const name = permissionHolderName(item) || t("pickup.persons.unnamed");
              const expired = Boolean(item.validTo && item.validTo < today);
              return (
                <Option
                  key={item.id}
                  selected={isSame(value, "permission", item.id)}
                  onSelect={() => onChange({ kind: "permission", id: item.id })}
                  name={name}
                  photoFileId={item.pickupPerson?.photoFileId}
                  photoUrl={item.pickupPerson?.photoUrl}
                  detail={
                    [
                      item.pickupPerson?.relationship,
                      item.pickupPerson ? undefined : t("pickup.recipients.adhoc"),
                      item.adhocPhone ?? item.pickupPerson?.phone,
                    ]
                      .filter(Boolean)
                      .join(" · ") || undefined
                  }
                  /*
                    Bekor qilingan va muddati o'tgan ruxsat ro'yxatda QOLADI,
                    lekin belgilangan holda: yakuniy qarorni server chiqaradi
                    va rad etish sababi hukmda ko'rinishi kerak.
                  */
                  badge={
                    item.revokedAt ? (
                      <Badge tone="danger">{t("pickup.persons.revoked")}</Badge>
                    ) : expired ? (
                      <Badge tone="warn">{t("errors.PERMISSION_EXPIRED")}</Badge>
                    ) : null
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      {trulyEmpty ? (
        <p className="rounded-xl border border-st-warn-border bg-st-warn-soft px-3 py-2 text-sm text-st-warn-fg">
          {t("pickup.recipients.nobody")}
        </p>
      ) : null}
    </div>
  );
}
