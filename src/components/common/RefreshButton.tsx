import { useTranslation } from "react-i18next";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  onRefresh: () => void;
  /** So'rov ketayotganini bildiradi — ikonka aylanadi. */
  isFetching?: boolean;
  /**
   * Ma'lumot oxirgi marta qachon olingani (`Date.now()` millisekundlarda).
   * React Query dagi `dataUpdatedAt` shu yerga beriladi.
   */
  updatedAt?: number;
  className?: string;
}

/**
 * Ro'yxatni qo'lda yangilash.
 *
 * Ma'lumot kesh orqali ko'rsatilgani uchun u bir necha daqiqa eski bo'lishi
 * mumkin. Bu tugma ikki ishni bajaradi: yangilaydi va oxirgi yangilanish
 * vaqtini aytadi — shunda operator ekrandagi son qachongi ekanini biladi.
 */
export function RefreshButton({ onRefresh, isFetching, updatedAt, className }: RefreshButtonProps) {
  const { t } = useTranslation();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isFetching}
          aria-label={t("common.actions.refresh")}
          className={cn("h-11 rounded-xl", className)}
        >
          <RotateCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          <span className="hidden sm:inline">{t("common.actions.refresh")}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {updatedAt
          ? t("common.state.updatedAtTime", { time: formatTime(new Date(updatedAt).toISOString()) })
          : t("common.actions.refresh")}
      </TooltipContent>
    </Tooltip>
  );
}
