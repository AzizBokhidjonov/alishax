import { useTranslation } from "react-i18next";
import { ROLE_CODES, roleHintKey, roleLabelKey } from "@/config/permissions";

/**
 * Kirish sahifasidagi rollar ro'yxati: tizimda yettita rol bor va har biri
 * o'z bo'limlarini ko'radi. Bu — ma'lumot, demo hisob emas.
 *
 * Rol tavsifi `title` da: sahifaning asosiy vazifasi kirish, shuning uchun
 * yettita izoh ochiq turmaydi — kerak bo'lganda ko'rsatiladi.
 */
export function RoleLegend() {
  const { t } = useTranslation();

  return (
    <div className="mt-8 animate-[pop-in_0.6s_ease-out_0.45s_both] text-center">
      <div className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {t("auth.rolesTitle")}
      </div>
      <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
        {ROLE_CODES.map((code) => (
          <li key={code}>
            <span
              title={t(roleHintKey(code))}
              className="inline-block cursor-default rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
            >
              {t(roleLabelKey(code))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
