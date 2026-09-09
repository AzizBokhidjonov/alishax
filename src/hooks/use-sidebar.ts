import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "alishax_sidebar";

export interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
  /**
   * Saqlangan holat o'qilgunicha `false`. Kenglik animatsiyasi shundan keyin
   * yoqiladi — aks holda panel har yuklanishda yoyilgan holatdan yig'ilgan
   * holatga «sirg'anib» o'tardi.
   */
  ready: boolean;
}

/**
 * Yon panelning yig'ilgan/yoyilgan holati.
 *
 * Tanlov `localStorage` da saqlanadi va montajdan keyin o'qiladi: server
 * renderi har doim yoyilgan holatda chiqadi, shuning uchun gidratatsiya mos
 * kelmasligi yuzaga kelmaydi (til tanlovi bilan bir xil yondashuv).
 */
export function useSidebar(): SidebarState {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "collapsed");
    } catch {
      // Xotira yopiq bo'lsa (maxfiy rejim) — standart yoyilgan holat qoladi.
    }
    /*
      Ikki kadr kutiladi: birinchisida saqlangan kenglik chiziladi, keyin
      animatsiya yoqiladi. Bir kadrda ikkalasi bitta uslub hisobiga
      birlashib qolardi va panel baribir sirg'anardi.
    */
    let second = 0;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => setReady(true));
    });
    return () => {
      window.cancelAnimationFrame(first);
      window.cancelAnimationFrame(second);
    };
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "expanded");
      } catch {
        // Saqlab bo'lmasa ham panel shu sessiyada ishlaydi.
      }
      return next;
    });
  }, []);

  /*
    Ctrl/⌘ + B — matn muharrirlari va shunga o'xshash vositalardagi standart
    yorliq. Forma maydonida turganda ham ishlaydi: bu birikma matn kiritishda
    band emas.
  */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return { collapsed, toggle, ready };
}
