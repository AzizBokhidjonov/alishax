import { ROLE_CODES, type RoleCode, P } from "@/config/permissions";
import { NAV_SECTIONS } from "@/config/navigation";

/**
 * Rol qo'llanmasining SKELETI.
 *
 * Matnning o'zi bu yerda emas, `i18n/locales/<til>/guide.ts` da — qo'llanma ikki
 * tilda o'qiladi. Bu yerda faqat tuzilma turadi: rol qaysi bo'limlarda
 * ishlaydi va qaysi ruxsat kalitlariga tayanadi.
 *
 * Nega ruxsatlar ro'yxati qo'lda yozilgan, `/roles/matrix` dan olinmagan:
 * matritsa `role:manage` huquqini talab qiladi, qo'llanma esa aynan shu
 * huquqi YO'Q xodimlar uchun kerak. Shuning uchun bu yerda seed rollarining
 * odatiy to'plami turadi va u «shu rol nimaga mo'ljallangan» degan savolga
 * javob beradi. Foydalanuvchining O'ZIDA nima borligi esa sahifada jonli
 * ruxsatlardan hisoblanadi — taxmindan emas.
 */
export interface RoleGuide {
  code: RoleCode;
  /** Menyudagi manzillar — yorliqlari `NAV_SECTIONS` dan olinadi. */
  routes: string[];
  /** Shu rol tayanadigan asosiy ruxsat kalitlari. */
  permissions: string[];
}

export const ROLE_GUIDES: RoleGuide[] = [
  {
    code: "owner",
    routes: [
      "/boshqaruv",
      "/bolalar",
      "/otaonalar",
      "/guruhlar",
      "/davomat",
      "/olibketish",
      "/tariflar",
      "/davrlar",
      "/hisoblash",
      "/hisoblar",
      "/tolovlar",
      "/qarzlar",
      "/xarajatlar",
      "/xabarlar",
      "/xabarnomalar",
      "/hisobotlar",
      "/xodimlar",
      "/rollar",
      "/sozlamalar",
      "/sayt",
      "/import",
      "/audit",
    ],
    permissions: [
      P.roleManage,
      P.roleManageSensitive,
      P.userManage,
      P.periodReopen,
      P.settingsManage,
      P.auditRead,
      P.landingPublish,
    ],
  },
  {
    code: "director",
    routes: [
      "/boshqaruv",
      "/bolalar",
      "/otaonalar",
      "/guruhlar",
      "/davomat",
      "/olibketish",
      "/qarzlar",
      "/xarajatlar",
      "/xabarlar",
      "/hisobotlar",
      "/xodimlar",
      "/audit",
    ],
    permissions: [
      P.dashboardRead,
      P.childRead,
      P.groupManage,
      P.reportRead,
      P.debtRead,
      P.announcementManage,
      P.auditRead,
    ],
  },
  {
    code: "administrator",
    routes: [
      "/boshqaruv",
      "/bolalar",
      "/otaonalar",
      "/guruhlar",
      "/davomat",
      "/ichkarida",
      "/olibketish",
      "/xabarlar",
      "/xodimlar",
      "/sozlamalar",
      "/sayt",
      "/import",
    ],
    permissions: [
      P.childCreate,
      P.childUpdate,
      P.childStatus,
      P.guardianManage,
      P.groupManage,
      P.pickupManage,
      P.userManage,
      P.settingsManage,
      P.importManage,
    ],
  },
  {
    code: "accountant",
    routes: [
      "/boshqaruv",
      "/bolalar",
      "/tariflar",
      "/davrlar",
      "/hisoblash",
      "/hisoblar",
      "/tolovlar",
      "/qarzlar",
      "/xarajatlar",
      "/hisobotlar",
    ],
    permissions: [
      P.tariffManage,
      P.discountManage,
      P.chargeGenerate,
      P.chargeReverse,
      P.paymentCreate,
      P.paymentCancel,
      P.periodClose,
      P.debtRead,
      P.expenseManage,
    ],
  },
  {
    code: "teacher",
    routes: ["/boshqaruv", "/bolalar", "/davomat", "/ichkarida"],
    permissions: [P.childRead, P.attendanceRead, P.attendanceCheckIn, P.medicalAlerts],
  },
  {
    code: "reception",
    routes: ["/boshqaruv", "/bolalar", "/otaonalar", "/davomat", "/ichkarida", "/olibketish"],
    permissions: [
      P.attendanceCheckIn,
      P.attendanceCheckOut,
      P.pickupRead,
      P.pickupTemporary,
      P.guardianRead,
    ],
  },
  {
    code: "nurse",
    routes: ["/boshqaruv", "/bolalar", "/davomat"],
    permissions: [P.medicalRead, P.medicalWrite, P.medicalAlerts, P.consentManage],
  },
];

export const guideForRole = (code: string): RoleGuide | undefined =>
  ROLE_GUIDES.find((guide) => guide.code === code);

export const KNOWN_ROLE_CODES: readonly RoleCode[] = ROLE_CODES;

/** Manzil -> menyudagi yorliq kaliti. Qo'llanma alohida ro'yxat saqlamaydi. */
const ROUTE_LABELS: Record<string, string> = Object.fromEntries(
  NAV_SECTIONS.flatMap((section) => section.items.map((item) => [item.to, item.labelKey])),
);

export const routeLabelKey = (to: string): string => ROUTE_LABELS[to] ?? to;

/**
 * Foydalanuvchining O'ZIGA ochiq bo'lgan bo'limlar — jonli ruxsatlardan.
 * Bo'sh `permissions` massivi «hammaga ochiq» degani (`NAV_SECTIONS` bilan
 * bir xil qoida), shuning uchun u ham ro'yxatga tushadi.
 */
export function openRoutesFor(can: (key: string) => boolean): string[] {
  return NAV_SECTIONS.flatMap((section) =>
    section.items
      .filter((item) => item.permissions.length === 0 || item.permissions.some(can))
      .map((item) => item.to),
  );
}
