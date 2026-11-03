import { TIMEZONE } from "@/lib/dates";
import { API_BASE_URL } from "@/api/config";

export interface QueuedCheckIn {
  childId: string;
  at: string;
  attempts: number;
  state: "pending" | "review";
  errorCode?: string;
}

const prefix = "alishax:pending-arrivals:v1:";
const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE });
export const arrivalDay = (at: string): string => dayFormat.format(new Date(at));
const accountPrefix = (scope: string) =>
  prefix + encodeURIComponent(API_BASE_URL) + ":" + encodeURIComponent(scope) + ":";
const recordKey = (scope: string, item: QueuedCheckIn) =>
  accountPrefix(scope) + encodeURIComponent(item.childId) + ":" + arrivalDay(item.at);

function valid(value: unknown): value is QueuedCheckIn {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<QueuedCheckIn>;
  return (
    typeof item.childId === "string" &&
    typeof item.at === "string" &&
    Number.isFinite(Date.parse(item.at)) &&
    typeof item.attempts === "number" &&
    Number.isFinite(item.attempts) &&
    (item.errorCode === undefined || typeof item.errorCode === "string") &&
    (item.state === "pending" || item.state === "review")
  );
}

/** Ism, izoh va tibbiy ma'lumot saqlanmaydi; kalit joriy akkauntga tegishli. */
export function readArrivals(scope: string): { items: QueuedCheckIn[]; durable: boolean } {
  try {
    const store = window.localStorage;
    const items: QueuedCheckIn[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (!key?.startsWith(accountPrefix(scope))) continue;
      const parsed: unknown = JSON.parse(store.getItem(key) ?? "null");
      if (!valid(parsed)) throw new Error("Invalid queue");
      items.push(parsed);
    }
    return { items, durable: true };
  } catch {
    return { items: [], durable: false };
  }
}

export function saveArrivals(
  scope: string,
  items: QueuedCheckIn[],
  previous: QueuedCheckIn[],
): boolean {
  try {
    const keys = new Set(items.map((item) => recordKey(scope, item)));
    for (const item of previous) {
      const key = recordKey(scope, item);
      if (!keys.has(key)) window.localStorage.removeItem(key);
    }
    // Faqat o'zgargan qayd yoziladi: boshqa oynaning tekshirilgan holati saqlanadi.
    const before = new Map(previous.map((item) => [recordKey(scope, item), JSON.stringify(item)]));
    for (const item of items) {
      const key = recordKey(scope, item);
      const value = JSON.stringify(item);
      if (before.get(key) !== value) window.localStorage.setItem(key, value);
    }
    return true;
  } catch {
    return false;
  }
}
