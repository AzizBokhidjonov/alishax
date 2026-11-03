/** Brauzer hodisalari SSR paytida o'rnatilmaydi. */
export function bindCheckInEvents(
  flush: () => Promise<void>,
  synchronize: () => void,
  snapshot: () => { items: unknown[]; durable: boolean },
): void {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => void flush());
  window.addEventListener("storage", (event) => {
    if (event.key === null || event.key.startsWith("alishax:pending-arrivals:v1:")) synchronize();
  });
  window.addEventListener("beforeunload", (event) => {
    const state = snapshot();
    if (state.items.length && !state.durable) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
}
