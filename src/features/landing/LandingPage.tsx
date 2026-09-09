import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/i18n/useLanguage";
import { usePublicLanding } from "@/features/website/api";
import { AboutSection } from "./components/AboutSection";
import { ContactSection } from "./components/ContactSection";
import { HeroSection } from "./components/HeroSection";
import { LandingFooter } from "./components/LandingFooter";
import { LandingHeader } from "./components/LandingHeader";
import { MapSection } from "./components/MapSection";
import { ProgramsSection } from "./components/ProgramsSection";
import { ReviewsSection } from "./components/ReviewsSection";
import { ScheduleSection } from "./components/ScheduleSection";
import { PublicBlockView } from "./PublicBlocks";
import type { NavAnchor } from "./constants";

/** Menyuda havola bo'ladigan bo'limlar — hammasi ham sarlavhaga arzimaydi. */
const ANCHORED_TYPES = ["about", "features", "gallery", "teachers", "pricing", "faq", "contacts"];

/**
 * Ommaviy sayt.
 *
 * Ikki rejim bor va ular ATAYLAB shu tartibda:
 *
 *   1. CMS'da chop etilgan sahifa bo'lsa — bloklar shundan chiziladi.
 *   2. Bo'lmasa — hozirgi statik matn ko'rinadi.
 *
 * Ikkinchisi «xato ekrani» emas, ZAXIRA: `404` bu yerda «hali chop etilmagan»
 * degani va u noma'lum kod hamda to'xtatilgan tenant bilan atayin bir xil
 * (Landing spec §6). Bo'sh sarlavha bilan turgan saytdan ko'ra to'liq statik
 * sahifa yaxshiroq — bog'chaning telefon raqami har doim ekranda bo'lishi
 * kerak.
 */
export function LandingPage() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { data } = usePublicLanding(language);

  const blocks = data?.blocks ?? [];
  const dynamic = blocks.length > 0;

  /*
    Menyu havolalari bloklardan hosil bo'ladi: statik ro'yxat CMS sahifasida
    mavjud bo'lmagan bo'limlarga olib borishi mumkin edi. `useMemo` —
    `LandingHeader` ichidagi kuzatuvchi har renderda qayta ulanmasin;
    bog'liqlik javobning O'ZI, chunki uning havolasi kesh o'zgargandagina
    almashadi.
  */
  const anchors = useMemo<NavAnchor[] | undefined>(() => {
    const list = data?.blocks ?? [];
    if (list.length === 0) return undefined;
    const seen = new Set<string>();
    const result: NavAnchor[] = [];
    for (const block of list) {
      if (!ANCHORED_TYPES.includes(block.type) || seen.has(block.type)) continue;
      seen.add(block.type);
      result.push({
        href: `#${block.type}`,
        label: t(`website.types.${block.type}`, { defaultValue: block.type }),
      });
    }
    return result;
  }, [data, t]);

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <LandingHeader anchors={anchors} />

      {dynamic && data ? (
        blocks.map((block) => <PublicBlockView key={block.id} block={block} page={data} />)
      ) : (
        <>
          <HeroSection />
          <AboutSection />
          <ProgramsSection />
          <ScheduleSection />
          <ReviewsSection />
          <MapSection />
          <ContactSection />
        </>
      )}

      <LandingFooter />
    </div>
  );
}
