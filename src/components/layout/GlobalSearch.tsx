import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Search, UserRound } from "lucide-react";
import { childrenApi, guardiansApi } from "@/api";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn, focusRing } from "@/lib/utils";

/**
 * Umumiy qidiruv (§3.1).
 *
 * Qabulxona uchun eng qisqa yo'l: bola, ota-ona yoki kvitansiya raqami
 * bo'yicha to'lov. Istalgan sahifadan `/` bilan ochiladi — qo'l klaviaturadan
 * uzilmaydi.
 */
export function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const query = useDebouncedValue(term).trim();
  const enabled = open && query.length >= 2;

  /*
    `/` — qidiruv, `Ctrl/Cmd+K` — odatiy muqobil. Maydonda yozayotganda
    ishlamasin, aks holda ism kiritayotgan xodimga xalaqit berardi.
  */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable === true;

      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(true);
        return;
      }
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const children = useQuery({
    queryKey: ["search", "children", query],
    queryFn: () => childrenApi.list({ q: query, limit: 5 }),
    enabled: enabled && can(P.childRead),
  });

  const guardians = useQuery({
    queryKey: ["search", "guardians", query],
    queryFn: () => guardiansApi.list({ q: query, limit: 5 }),
    enabled: enabled && can(P.guardianRead),
  });

  const go = (to: string, params?: Record<string, string>) => {
    setOpen(false);
    setTerm("");
    void navigate({ to, params });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground",
          focusRing,
        )}
      >
        <Search aria-hidden className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("search.placeholder")}</span>
        <kbd className="hidden rounded border border-border bg-card px-1 font-mono text-[10px] md:inline">
          /
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        {/* Radix oynaning nomini talab qiladi; nom ko'rinmaydi. */}
        <DialogTitle className="sr-only">{t("search.title")}</DialogTitle>
        {/* Filtrlash serverda — mahalliy taqqoslash natijani kesib qo'ymasin. */}
        <CommandInput value={term} onValueChange={setTerm} placeholder={t("search.placeholder")} />
        <CommandList>
          {query.length < 2 ? (
            <CommandEmpty>{t("search.hint")}</CommandEmpty>
          ) : (
            <CommandEmpty>{t("search.empty")}</CommandEmpty>
          )}

          {(children.data?.data ?? []).length > 0 ? (
            <CommandGroup heading={t("nav.children")}>
              {(children.data?.data ?? []).map((child) => (
                <CommandItem
                  key={child.id}
                  value={`${child.lastName} ${child.firstName} ${child.groupName ?? ""} ${child.id}`}
                  onSelect={() => go("/bolalar/$id", { id: child.id })}
                >
                  <GraduationCap className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">
                    {child.lastName} {child.firstName}
                  </span>
                  {child.groupName ? (
                    <span className="ml-auto text-xs text-muted-foreground">{child.groupName}</span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {(guardians.data?.data ?? []).length > 0 ? (
            <CommandGroup heading={t("nav.guardians")}>
              {(guardians.data?.data ?? []).map((guardian) => (
                <CommandItem
                  key={guardian.id}
                  value={`${guardian.fullName} ${guardian.phone ?? ""} ${guardian.id}`}
                  onSelect={() => go("/otaonalar/$id", { id: guardian.id })}
                >
                  <UserRound className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{guardian.fullName}</span>
                  {guardian.phone ? (
                    <span className="ml-auto text-xs text-muted-foreground">{guardian.phone}</span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}
