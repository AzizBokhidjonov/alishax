import type { Scope } from "@/api";

/**
 * Ruxsatlar bo'yicha YAGONA manba.
 *
 * Kalitlar backend katalogidan olingan (`GET /permissions`, 52 ta kalit).
 * Interfeys ROL nomiga emas, RUXSAT KALITIGA qarab ochiladi — operator
 * o'zi yangi rol yaratishi mumkin (Funksional spec, A1).
 *
 * Yashirilgan tugma — bu qulaylik, himoya emas: har bir amal baribir
 * `403 FORBIDDEN` / `403 OUT_OF_SCOPE` ni to'g'ri qayta ishlashi shart.
 */

/** Seed bilan keladigan yettita rol kodi. */
export const ROLE_CODES = [
  "owner",
  "director",
  "administrator",
  "accountant",
  "teacher",
  "reception",
  "nurse",
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

/** Rol nomining i18n kaliti: `domain.roles.owner`. */
export const roleLabelKey = (code: string): string => `domain.roles.${code}`;
export const roleHintKey = (code: string): string => `domain.roleHints.${code}`;

export const isKnownRole = (code: string): code is RoleCode =>
  (ROLE_CODES as readonly string[]).includes(code);

/** Backend ruxsat kalitlari. */
export const P = {
  childRead: "child:read",
  childCreate: "child:create",
  childUpdate: "child:update",
  childDelete: "child:delete",
  childStatus: "child:status",

  medicalRead: "medical:read",
  medicalAlerts: "medical:alerts",
  medicalWrite: "medical:write",

  consentRead: "consent:read",
  consentManage: "consent:manage",

  attendanceRead: "attendance:read",
  attendanceCheckIn: "attendance:checkin",
  attendanceCheckOut: "attendance:checkout",
  attendanceCorrect: "attendance:correct",

  pickupRead: "pickup:read",
  pickupManage: "pickup:manage",
  pickupTemporary: "pickup:temporary",

  groupRead: "group:read",
  groupManage: "group:manage",
  groupCapacityOverride: "group:capacity_override",

  guardianRead: "guardian:read",
  guardianManage: "guardian:manage",

  tariffManage: "tariff:manage",
  discountManage: "discount:manage",
  billingRulesManage: "billing_rules:manage",

  chargeRead: "charge:read",
  chargeGenerate: "charge:generate",
  chargeReverse: "charge:reverse",

  paymentRead: "payment:read",
  paymentCreate: "payment:create",
  paymentCancel: "payment:cancel",

  periodClose: "period:close",
  periodReopen: "period:reopen",
  debtRead: "debt:read",

  announcementManage: "announcement:manage",
  notificationRead: "notification:read",
  notificationSend: "notification:send",
  notificationTemplateManage: "notification_template:manage",

  reportRead: "report:read",
  expenseRead: "expense:read",
  expenseManage: "expense:manage",
  importManage: "import:manage",

  fileRead: "file:read",
  fileManage: "file:manage",
  dashboardRead: "dashboard:read",

  roleManage: "role:manage",
  roleManageSensitive: "role:manage:sensitive",
  userManage: "user:manage",
  auditRead: "audit:read",
  settingsManage: "settings:manage",
  branchManage: "branch:manage",
  holidayManage: "holiday:manage",

  /*
    Sayt: tahrirlash va chop etish ATAYLAB ajratilgan. Kontent muharriri butun
    sahifani tayyorlab qo'yishi mumkin, lekin uni ochiq internetga chiqara
    olmaydi (Landing spec §2). Chop etish tugmasi o'chirilmaydi — umuman
    ko'rsatilmaydi.
  */
  landingManage: "landing:manage",
  landingPublish: "landing:publish",
} as const;

export type PermissionKey = (typeof P)[keyof typeof P];

/** Tasdiqlash oynasi talab qiladigan maxsus amallar (Funksional spec, A2). */
export const SENSITIVE_PERMISSIONS: string[] = [
  P.childDelete,
  P.paymentCancel,
  P.chargeReverse,
  P.periodReopen,
  P.discountManage,
  P.groupCapacityOverride,
  P.roleManage,
  P.roleManageSensitive,
  P.userManage,
];

export const isSensitive = (key: string): boolean => SENSITIVE_PERMISSIONS.includes(key);

/** Qamrov kengligi: kattaroq son — kengroq ko'rish doirasi. */
const SCOPE_WEIGHT: Record<Scope, number> = {
  all: 5,
  branch: 4,
  own_group: 3,
  today: 2,
  self: 1,
};

export const scopeWeight = (scope?: Scope): number => (scope ? SCOPE_WEIGHT[scope] : 0);

/** Foydalanuvchi butun tashkilotni ko'radimi. */
export const isWideScope = (scope?: Scope): boolean => scope === "all" || scope === "branch";
