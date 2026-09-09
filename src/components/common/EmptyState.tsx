import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Bo'sh, xato va ruxsat yo'q holatlari uchun yagona ko'rinish.
 *
 * Ikonka brend ohangidagi doirada turadi va blok yumshoq ko'tarilib chiqadi:
 * bo'sh ekran «buzilgan» emas, «hali to'ldirilmagan» degani.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex animate-in flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center fade-in-0 slide-in-from-bottom-2 duration-500",
        className,
      )}
    >
      <div className="relative mb-4 grid h-16 w-16 place-items-center">
        <span
          aria-hidden
          className="absolute inset-0 animate-[float_6s_ease-in-out_infinite] rounded-3xl bg-brand-soft"
        />
        <Icon aria-hidden className="relative h-7 w-7 text-brand-ink" />
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
