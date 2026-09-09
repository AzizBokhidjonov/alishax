import { useEffect, useState } from "react";
import { DAY_STAGES } from "./constants";

/**
 * Joriy vaqt, kun boshidan hisoblangan daqiqada.
 *
 * Server renderida `null` qaytadi: soat serverda va brauzerda boshqacha
 * bo'lardi va gidratatsiya mos kelmasdi. Shuning uchun vaqtga bog'liq hamma
 * narsa montajdan keyin paydo bo'ladi. Yangilanish — yarim daqiqada bir
 * marta, bu daqiqa almashuvini sezilarli kechikishsiz ushlaydi.
 */
export function useMinuteOfDay(): number | null {
  const [minute, setMinute] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setMinute(now.getHours() * 60 + now.getMinutes());
    };
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return minute;
}

/** `545` -> `09:05`. */
export const formatClock = (minute: number): string =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

/** Joriy bosqich indeksi; bog'cha yopiq bo'lsa yoki vaqt noma'lum bo'lsa `-1`. */
export const stageIndexAt = (minute: number | null): number =>
  minute === null ? -1 : DAY_STAGES.findIndex((stage) => minute >= stage.from && minute < stage.to);

/** Kun davomida to'rt marta o'zgaradigan salom: tong / kun / kech / tun. */
export const greetingKey = (minute: number | null): string => {
  if (minute === null) return "auth.greeting.day";
  const hour = Math.floor(minute / 60);
  if (hour < 5) return "auth.greeting.night";
  if (hour < 11) return "auth.greeting.morning";
  if (hour < 17) return "auth.greeting.day";
  if (hour < 22) return "auth.greeting.evening";
  return "auth.greeting.night";
};
