import { useEffect, useState } from "react";

/**
 * Ekranda ko'rinib turgan bo'limni aniqlaydi — yuqoridagi menyuda
 * faol havolani belgilash uchun.
 */
export function useActiveSection(anchors: string[], fallback: string): string {
  const [active, setActive] = useState(fallback);

  useEffect(() => {
    const ids = anchors.map((href) => href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.2, 0.5, 1] },
    );

    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
    // anchors ro'yxati modul darajasidagi konstanta — o'zgarmaydi.
  }, [anchors]);

  return active;
}

/** Sahifa biroz pastga surilganmi? Header fonini o'zgartirish uchun. */
export function useScrolled(offset = 12): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset]);

  return scrolled;
}
