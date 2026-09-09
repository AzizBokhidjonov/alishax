import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PageMeta } from "@/api";

const LIMITS = [25, 50, 100, 200];

interface ListPaginationProps {
  meta?: PageMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

/** Sahifalash faqat `meta` bo'yicha — `data.length` sanalmaydi. */
export function ListPagination({ meta, onPageChange, onLimitChange }: ListPaginationProps) {
  const { t } = useTranslation();
  if (!meta || meta.total === 0) return null;

  const pages = Math.max(1, meta.pages || 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2">
      <div className="text-sm text-muted-foreground">
        {t("common.table.total", { count: meta.total })}
      </div>

      <div className="flex items-center gap-2">
        {onLimitChange ? (
          <Select
            value={String(meta.limit)}
            onValueChange={(value) => onLimitChange(Number(value))}
          >
            <SelectTrigger className="h-9 w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIMITS.map((limit) => (
                <SelectItem key={limit} value={String(limit)}>
                  {t("common.table.perPage")}: {limit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <Button
          variant="outline"
          size="sm"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
          aria-label={t("common.table.prevPage")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-16 text-center text-sm">
          {t("common.table.page", { page: meta.page, pages })}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page >= pages}
          onClick={() => onPageChange(meta.page + 1)}
          aria-label={t("common.table.nextPage")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
