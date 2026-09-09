import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { usePermissions } from "@/auth/auth-context";
import { permissionsForRoute } from "@/config/navigation";

/**
 * Route darajasidagi himoya: manzil qo'lda kiritilsa ham ruxsatsiz sahifa
 * ochilmaydi. Bu qulaylik qatlami — server baribir har bir so'rovni o'zi
 * tekshiradi.
 */
export function RouteGuard({ pathname, children }: { pathname: string; children: ReactNode }) {
  const { t } = useTranslation();
  const { canAny } = usePermissions();
  const required = permissionsForRoute(pathname);

  if (required.length > 0 && !canAny(...required)) {
    return (
      <EmptyState
        icon={Lock}
        title={t("common.state.forbidden")}
        description={t("common.state.forbiddenHint")}
      />
    );
  }

  return <>{children}</>;
}
