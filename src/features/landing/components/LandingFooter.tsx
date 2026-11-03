import { useTranslation } from "react-i18next";
import logo from "@/assets/logo-alishax.png";
import { Socials } from "./Socials";

export function LandingFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border bg-card py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row md:px-6">
        <img
          src={logo}
          alt="Alishax Kids"
          width={120}
          height={60}
          className="h-9 w-auto"
          loading="lazy"
        />
        <Socials compact />
        <span>
          © {new Date().getFullYear()} Alishax Kids. {t("landing.rights")}
        </span>
      </div>
    </footer>
  );
}
