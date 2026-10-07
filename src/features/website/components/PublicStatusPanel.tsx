import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { publicLandingApi, LANDING_TENANT_CODE } from "@/api";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/useLanguage";
import { cn } from "@/lib/utils";

/**
 * «Chop etdim, lekin saytda ko'rinmayapti» uchun tashxis.
 *
 * Ommaviy sahifa muharrirdan MUSTAQIL manzilda yashaydi va uni topish uchun
 * tenant kodi kerak: `VITE_LANDING_TENANT_CODE` (frontend) yoki
 * `LANDING_DEFAULT_TENANT_CODE` (backend). Ikkalasi ham bo'sh bo'lsa ommaviy
 * so'rov `404` qaytaradi, sayt esa jimgina statik matnga qaytadi — chop
 * etilgan kontent hech qachon ko'rinmaydi va ekranda buning sababi
 * aytilmaydi.
 *
 * Bu panel aynan shu bo'shliqni yopadi: qaysi manzil sinaldi, nima qaytdi va
 * nechta blok keldi. Ya'ni muammo kontentdami yoki sozlamadami — shu yerdan
 * ko'rinadi.
 */
export function PublicStatusPanel({
  publishedVersion,
  slug,
}: {
  publishedVersion: number | null;
  /** Qoralama slug'i — ehtimoliy tenant kodi (faqat kirgan xodimga ko'rinadi). */
  slug?: string;
}) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const codes = [LANDING_TENANT_CODE, slug ?? ""].filter(Boolean);

  const probe = useQuery({
    queryKey: ["landing", "diagnose", language, codes.join("|")],
    queryFn: () => publicLandingApi.diagnose(language, codes),
    // Tashxis — qo'lda boshlanadigan tekshiruv, avtomatik yangilanmaydi.
    staleTime: 30_000,
    retry: false,
  });

  const results = probe.data ?? [];
  const working = results.find((item) => item.status === 200);
  const neverPublished = publishedVersion === null;

  /*
    Ishlaydigan manzil topildi, lekin u sozlamadagi kod bilan EMAS — demak
    ommaviy sayt uni topa olmaydi. Aynan shu holatda kerakli kod ma'lum
    bo'ladi va uni ekranda aytish kifoya: taxmin qilish kerak emas.
  */
  const foundCode =
    working && !LANDING_TENANT_CODE ? (working.path.split("/public/landing/")[1] ?? "") : "";

  return (
    <section
      className={cn(
        "rounded-xl border px-4 py-3",
        working ? "border-st-ok-border bg-st-ok-soft" : "border-st-warn-border bg-st-warn-soft",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {working ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-st-ok-fg" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-st-warn-fg" />
          )}
          <div className="space-y-1">
            <p
              className={cn("text-sm font-semibold", working ? "text-st-ok-fg" : "text-st-warn-fg")}
            >
              {working
                ? t("website.publicStatus.ok", { count: working.blocks ?? 0 })
                : neverPublished
                  ? t("website.publicStatus.neverPublished")
                  : t("website.publicStatus.unreachable")}
            </p>

            {/*
              Sahifa topildi, lekin kod sozlamada yo'q — ommaviy sayt uni
              baribir ko'rmaydi. Kerakli kod shu yerda aytiladi.
            */}
            {foundCode ? (
              <p className="max-w-2xl text-xs font-semibold text-st-warn-fg">
                {t("website.publicStatus.foundCode", { code: foundCode })}
              </p>
            ) : null}

            {/*
              Nomzod manzillar ro'yxati. Bu texnik matn va ATAYLAB tarjima
              qilinmagan: u xodimga emas, muammoni tuzatadigan odamga
              qaratilgan va manzil hamda xato kodi har ikki tilda bir xil.
            */}
            {results.length > 0 ? (
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                {results.map((item) => (
                  <li key={item.path} className="font-mono">
                    {item.status === 200 ? "✓" : "✗"} {item.path} → {item.status || "—"}
                    {item.code ? ` ${item.code}` : ""}
                    {item.blocks !== undefined ? ` (${item.blocks})` : ""}
                  </li>
                ))}
              </ul>
            ) : null}

            {!working && !probe.isFetching ? (
              <p className="max-w-2xl text-xs text-st-warn-fg">
                {neverPublished
                  ? t("website.publicStatus.hintPublish")
                  : t("website.publicStatus.hintTenant", {
                      code: LANDING_TENANT_CODE || t("website.publicStatus.empty"),
                    })}
              </p>
            ) : null}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => void probe.refetch()}
          disabled={probe.isFetching}
        >
          <RefreshCw className={cn("mr-2 h-3.5 w-3.5", probe.isFetching && "animate-spin")} />
          {t("website.publicStatus.check")}
        </Button>
      </div>
    </section>
  );
}
