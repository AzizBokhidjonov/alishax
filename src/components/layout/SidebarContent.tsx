import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronsUpDown, Home, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/auth/auth-context";
import { roleLabelKey } from "@/config/permissions";
import { NavList } from "./NavList";
import { cn, focusRing } from "@/lib/utils";
import logo from "@/assets/logo-alishax.png";
import mark from "@/assets/logo-mark.png";

interface SidebarContentProps {
  onLogout: () => void;
  onNavigate?: () => void;
  /** Yig'ilgan panel: faqat ikonkalar va belgi qoladi. Mobil varaqda har doim `false`. */
  collapsed?: boolean;
}

const initials = (fullName?: string | null): string =>
  (fullName ?? "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

/** Yon panel tarkibi — desktop aside va mobil sheet ikkalasida ishlatiladi. */
export function SidebarContent({ onLogout, onNavigate, collapsed = false }: SidebarContentProps) {
  const { t } = useTranslation();
  const { user, roles } = useAuth();
  const roleNames = roles.map((role) => t(roleLabelKey(role.code))).join(", ");

  return (
    <>
      {/*
        Brend bloki. To'liq logotip va kvadrat belgi bir joyda turadi va
        bir-biriga o'tadi — shuning uchun panel torayganda sarlavha sakramaydi,
        balki bittasi so'nib, ikkinchisi paydo bo'ladi. Balandligi yuqori
        paneldagi bilan bir xil (64px), shuning uchun ikkala chegara bir
        chiziqda turadi.
      */}
      <Link
        to="/boshqaruv"
        onClick={onNavigate}
        aria-label={t("nav.dashboard")}
        className={cn(
          "relative flex h-16 shrink-0 items-center overflow-hidden border-b border-border",
          focusRing,
        )}
      >
        {/*
          Logotipdagi «Alishax» yozuvi navy rangda — qorong'i rejimda fon
          bilan qo'shilib ketardi. Shuning uchun u yerda logotip iliq oq
          taglikda turadi; yorug' rejimda taglik kerak emas.
        */}
        <span
          className={cn(
            "absolute left-1/2 -translate-x-1/2 transition-opacity duration-200 dark:rounded-xl dark:bg-panel-foreground dark:px-3 dark:py-1.5",
            collapsed ? "opacity-0" : "opacity-100 delay-100",
          )}
        >
          <img src={logo} alt="" width={160} height={84} className="h-10 w-auto max-w-none" />
        </span>
        <span
          className={cn(
            "absolute left-1/2 -translate-x-1/2 transition-opacity duration-200",
            collapsed ? "opacity-100 delay-100" : "opacity-0",
          )}
        >
          <img src={mark} alt="" width={256} height={256} className="h-9 w-9 rounded-xl" />
        </span>
      </Link>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <NavList collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      {/*
        Foydalanuvchi bloki. Ilgari u yuqori panelda edi va chiqish tugmasi
        ikki joyda takrorlanardi; endi hisob bilan bog'liq hamma narsa shu
        yerda — bitta boshqaruv elementi, u yig'ilgan panelda avatarga
        aylanadi.
      */}
      <div className="shrink-0 border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={t("nav.userMenu")}
              className={cn(
                "flex h-12 w-full items-center gap-3 overflow-hidden rounded-xl px-2 text-left transition-colors hover:bg-secondary",
                focusRing,
              )}
            >
              <span className="grid w-9 shrink-0 place-items-center">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={user?.avatarUrl} alt="" />
                  <AvatarFallback className="text-xs font-bold">
                    {initials(user?.fullName)}
                  </AvatarFallback>
                </Avatar>
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 transition-[opacity,transform] duration-200",
                  collapsed && "-translate-x-2 opacity-0",
                )}
              >
                <span className="block truncate text-sm font-semibold">{user?.fullName}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {roleNames || t("auth.noRole")}
                </span>
              </span>
              <ChevronsUpDown
                aria-hidden
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-opacity duration-200",
                  collapsed && "opacity-0",
                )}
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="right" align="end" sideOffset={10} className="w-64">
            <DropdownMenuLabel>
              <div className="font-semibold">{user?.fullName}</div>
              <div className="text-xs font-normal text-muted-foreground">{user?.phone}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {t("auth.roles")}: {roleNames || "—"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/" onClick={onNavigate}>
                <Home className="mr-2 h-4 w-4" />
                {t("nav.landing")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t("common.actions.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
