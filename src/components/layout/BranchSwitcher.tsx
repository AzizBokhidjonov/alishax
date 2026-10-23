import { useTranslation } from "react-i18next";
import { Building2, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBranch } from "@/auth/use-branch";
import { useBootstrapLookups } from "@/auth/auth-context";
import { cn, focusRing } from "@/lib/utils";

/**
 * Filial almashtirgichi (§3.1).
 *
 * Faqat foydalanuvchida bir nechta filial bo'lsa ko'rinadi, lekin JORIY
 * filial nomi shunda ham doim ochiq turadi: qaysi manzilga yozayotganini
 * bilmaslik — moliyada eng qimmat xato.
 */
export function BranchSwitcher() {
  const { t } = useTranslation();
  const { branchId, branchIds, canSwitch, setBranch } = useBranch();
  const { data } = useBootstrapLookups();

  if (!canSwitch) return null;

  const mine = (data?.branches ?? []).filter((branch) => branchIds.includes(branch.id));
  const currentName = mine.find((branch) => branch.id === branchId)?.name ?? branchId;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-secondary",
          focusRing,
        )}
      >
        <Building2 aria-hidden className="h-3.5 w-3.5 text-brand-ink" />
        <span className="sr-only">{t("branches.current")}: </span>
        <span className="max-w-[10rem] truncate">{currentName}</span>
        <ChevronDown aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("branches.switch")}</DropdownMenuLabel>
        {mine.map((branch) => (
          <DropdownMenuItem key={branch.id} onSelect={() => setBranch(branch.id)}>
            <Check
              className={cn("mr-2 h-4 w-4", branch.id === branchId ? "opacity-100" : "opacity-0")}
            />
            {branch.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
