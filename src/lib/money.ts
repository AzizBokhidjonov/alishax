/**
 * Pul — butun tiyin, satr ko'rinishida (1 so'm = 100 tiyin).
 *
 * Hech qachon `number` ga aylantirilmaydi va suzuvchi nuqta arifmetikasi
 * ishlatilmaydi: barcha amallar `BigInt` ustida bajariladi. Serverga ham
 * faqat butun tiyin satri yuboriladi (Integration Guide §5).
 */

const GROUP_SEPARATOR = " ";
const DECIMAL_SEPARATOR = ",";

/** Xato yoki bo'sh qiymatda 0n qaytaradi — interfeys buzilmasin. */
export function toBigInt(amountTiyin: string | number | null | undefined): bigint {
  if (amountTiyin === null || amountTiyin === undefined || amountTiyin === "") return 0n;
  try {
    return BigInt(typeof amountTiyin === "number" ? Math.round(amountTiyin) : amountTiyin.trim());
  } catch {
    return 0n;
  }
}

function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);
}

/** "150000000" -> "1 500 000,00". Valyuta belgisi qo'shilmaydi. */
export function formatTiyin(amountTiyin: string | number | null | undefined): string {
  const value = toBigInt(amountTiyin);
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const som = (absolute / 100n).toString();
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  return `${negative ? "−" : ""}${groupDigits(som)}${DECIMAL_SEPARATOR}${fraction}`;
}

/** "150000000" -> "1 500 000,00 so'm". */
export function formatMoney(
  amountTiyin: string | number | null | undefined,
  currency = "so'm",
): string {
  return `${formatTiyin(amountTiyin)} ${currency}`;
}

/** Butun so'mgacha qisqartirilgan ko'rinish — jadval va kartochkalar uchun. */
export function formatMoneyShort(amountTiyin: string | number | null | undefined): string {
  const value = toBigInt(amountTiyin);
  const negative = value < 0n;
  const som = (negative ? -value : value) / 100n;
  return `${negative ? "−" : ""}${groupDigits(som.toString())} so'm`;
}

/** Foydalanuvchi kiritgan so'm ("15 000,50") -> tiyin satri ("1500050"). */
export function toTiyin(somInput: string | number): string {
  const raw = String(somInput)
    .replace(/[\s\u00A0\u202F]/g, "")
    .replace(",", ".");
  if (!raw || raw === "-") return "0";
  const negative = raw.startsWith("-");
  const [whole = "0", fraction = ""] = raw.replace("-", "").split(".");
  const digits = whole.replace(/\D/g, "") || "0";
  const cents = (fraction.replace(/\D/g, "") + "00").slice(0, 2);
  const value = BigInt(digits) * 100n + BigInt(cents);
  return (negative ? -value : value).toString();
}

/** Tiyin satridan forma maydoni uchun so'm qiymati: "1500050" -> "15000.50". */
export function tiyinToSomInput(amountTiyin: string | null | undefined): string {
  const value = toBigInt(amountTiyin);
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  const som = (absolute / 100n).toString();
  return `${negative ? "-" : ""}${som}${fraction === "00" ? "" : `.${fraction}`}`;
}

export function addTiyin(...amounts: (string | null | undefined)[]): string {
  return amounts.reduce<bigint>((total, amount) => total + toBigInt(amount), 0n).toString();
}

export function subtractTiyin(a: string | null | undefined, b: string | null | undefined): string {
  return (toBigInt(a) - toBigInt(b)).toString();
}

export function isPositiveTiyin(amountTiyin: string | null | undefined): boolean {
  return toBigInt(amountTiyin) > 0n;
}

/** Chegirma foizi bazis punktda keladi: 1000 = 10%. */
export function formatBasisPoints(value: string | number | null | undefined): string {
  const bp = Number(value ?? 0);
  if (!Number.isFinite(bp)) return "0%";
  const percent = bp / 100;
  return `${Number.isInteger(percent) ? percent : percent.toFixed(2)}%`;
}

export function percentToBasisPoints(percent: string | number): string {
  const value = Number(String(percent).replace(",", "."));
  if (!Number.isFinite(value)) return "0";
  return String(Math.round(value * 100));
}
