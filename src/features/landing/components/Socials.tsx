import { useTranslation } from "react-i18next";
import { Globe, Instagram, Phone, Send } from "lucide-react";
import { cn, focusRing } from "@/lib/utils";
import { INSTAGRAM, MYLINK, PHONE_HREF, TELEGRAM } from "../constants";

const ITEMS = [
  { href: TELEGRAM, icon: Send, label: "landing.telegram" },
  { href: INSTAGRAM, icon: Instagram, label: "landing.instagram" },
  { href: PHONE_HREF, icon: Phone, label: "landing.phone" },
  { href: MYLINK, icon: Globe, label: "landing.allLinks" },
];

export function Socials({ compact }: { compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      {ITEMS.map(({ href, icon: Icon, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={t(label)}
          title={t(label)}
          className={cn(
            "grid place-items-center rounded-full border border-border bg-card text-foreground shadow-sm transition-all duration-300",
            focusRing,
            "hover:-translate-y-1 hover:border-brand hover:bg-brand hover:text-brand-foreground hover:shadow-lg",
            compact ? "h-9 w-9" : "h-11 w-11",
          )}
        >
          <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </a>
      ))}
    </div>
  );
}
