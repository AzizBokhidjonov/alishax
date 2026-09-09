import { useTranslation } from "react-i18next";
import { AuthAvatar } from "@/components/common/AuthImage";
import { Badge } from "@/components/common/StatusBadge";
import { QueryState } from "@/components/common/QueryState";
import { cn, focusRing } from "@/lib/utils";
import { todayIso } from "@/lib/dates";
import { usePickupPersons } from "../api";

interface PickupPersonPickerProps {
  childId: string;
  value: string;
  onChange: (personId: string) => void;
  className?: string;
}

/**
 * Olib ketuvchini tanlash — suratli ro'yxat, ochiluvchi `select` emas (§5.2).
 *
 * Eshik oldida odam ismidan emas, YUZIDAN tanaladi: ro'yxatdagi surat
 * tekshiruvni ochishdan oldin ham «bu o'shami?» degan savolga javob beradi.
 * Ochiluvchi ro'yxatda esa faqat ism ko'rinardi va bir xil familiyali ikki
 * odamni ajratib bo'lmasdi.
 *
 * Bekor qilingan yoki muddati o'tgan ruxsat ham ro'yxatda QOLADI, lekin
 * belgilangan holda: yakuniy qarorni server chiqaradi va rad etish sababi
 * hukmda ko'rinishi kerak — ro'yxatdan jimgina yo'qotish «bunday odam yo'q»
 * degan noto'g'ri taassurot qoldiradi.
 */
export function PickupPersonPicker({
  childId,
  value,
  onChange,
  className,
}: PickupPersonPickerProps) {
  const { t } = useTranslation();
  const persons = usePickupPersons(childId);
  const today = todayIso();

  return (
    <QueryState
      isLoading={persons.isLoading}
      error={persons.error}
      isEmpty={(persons.data ?? []).length === 0}
      emptyTitle={t("pickup.persons.empty")}
      emptyDescription={t("pickup.persons.emptyHint")}
      onRetry={() => void persons.refetch()}
      rows={3}
    >
      <div
        role="radiogroup"
        aria-label={t("pickup.verify.person")}
        className={cn("space-y-2", className)}
      >
        {(persons.data ?? []).map((person) => {
          const selected = person.id === value;
          const expired = Boolean(person.validTo && person.validTo < today);
          return (
            <button
              key={person.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(person.id)}
              className={cn(
                "flex min-h-16 w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                focusRing,
                selected
                  ? "border-brand bg-brand-soft"
                  : "border-border hover:border-input hover:bg-secondary",
              )}
            >
              <AuthAvatar
                fileId={person.photoFileId}
                src={person.photoUrl}
                name={person.fullName}
                className="h-12 w-12 shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{person.fullName}</span>
                <span className="block truncate text-sm text-muted-foreground">
                  {[person.relationship, t(`domain.permissionType.${person.permissionType}`)]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              {person.revokedAt ? (
                <Badge tone="danger">{t("pickup.persons.revoked")}</Badge>
              ) : expired ? (
                <Badge tone="warn">{t("errors.PERMISSION_EXPIRED")}</Badge>
              ) : null}
            </button>
          );
        })}
      </div>
    </QueryState>
  );
}
