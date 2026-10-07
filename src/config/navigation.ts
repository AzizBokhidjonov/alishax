import {
  LayoutDashboard,
  Users,
  UserRound,
  GraduationCap,
  CalendarCheck,
  DoorOpen,
  ShieldCheck,
  Receipt,
  CalendarRange,
  Calculator,
  FileSpreadsheet,
  Wallet,
  TrendingDown,
  Megaphone,
  BellRing,
  BarChart3,
  UserCog,
  KeyRound,
  Settings,
  Globe,
  Upload,
  ScrollText,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { P } from "./permissions";

export interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  /** Kamida bittasi bo'lsa element ko'rinadi. */
  permissions: string[];
}

export interface NavSection {
  titleKey: string;
  items: NavItem[];
}

/**
 * Yon menyu. Har bir element ruxsat kalitiga bog'langan — rol nomiga emas.
 * Route himoyasi ham shu ro'yxatdan olinadi (`ROUTE_PERMISSIONS`).
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    titleKey: "nav.sections.main",
    items: [
      { to: "/boshqaruv", labelKey: "nav.dashboard", icon: LayoutDashboard, permissions: [] },
    ],
  },
  {
    titleKey: "nav.sections.people",
    items: [
      { to: "/bolalar", labelKey: "nav.children", icon: Users, permissions: [P.childRead] },
      {
        to: "/otaonalar",
        labelKey: "nav.guardians",
        icon: UserRound,
        permissions: [P.guardianRead],
      },
      { to: "/guruhlar", labelKey: "nav.groups", icon: GraduationCap, permissions: [P.groupRead] },
    ],
  },
  {
    titleKey: "nav.sections.daily",
    items: [
      {
        to: "/davomat",
        labelKey: "nav.attendance",
        icon: CalendarCheck,
        permissions: [P.attendanceRead, P.attendanceCheckIn],
      },
      {
        to: "/ichkarida",
        labelKey: "nav.inside",
        icon: DoorOpen,
        permissions: [P.attendanceRead, P.attendanceCheckIn],
      },
      {
        to: "/olibketish",
        labelKey: "nav.pickup",
        icon: ShieldCheck,
        permissions: [P.pickupRead, P.pickupManage],
      },
    ],
  },
  {
    titleKey: "nav.sections.finance",
    items: [
      {
        to: "/tariflar",
        labelKey: "nav.tariffs",
        icon: Receipt,
        permissions: [P.tariffManage, P.discountManage],
      },
      {
        to: "/davrlar",
        labelKey: "nav.periods",
        icon: CalendarRange,
        permissions: [P.periodClose, P.periodReopen, P.chargeRead],
      },
      {
        to: "/hisoblash",
        labelKey: "nav.billing",
        icon: Calculator,
        permissions: [P.chargeGenerate],
      },
      {
        to: "/hisoblar",
        labelKey: "nav.charges",
        icon: FileSpreadsheet,
        permissions: [P.chargeRead, P.chargeGenerate],
      },
      {
        to: "/tolovlar",
        labelKey: "nav.payments",
        icon: Wallet,
        permissions: [P.paymentRead, P.paymentCreate],
      },
      { to: "/qarzlar", labelKey: "nav.debts", icon: TrendingDown, permissions: [P.debtRead] },
      {
        to: "/xarajatlar",
        labelKey: "nav.expenses",
        icon: Receipt,
        permissions: [P.expenseRead, P.expenseManage],
      },
    ],
  },
  {
    titleKey: "nav.sections.comms",
    items: [
      {
        to: "/xabarlar",
        labelKey: "nav.announcements",
        icon: Megaphone,
        permissions: [P.announcementManage],
      },
      {
        to: "/xabarnomalar",
        labelKey: "nav.notifications",
        icon: BellRing,
        permissions: [P.notificationRead, P.notificationSend],
      },
    ],
  },
  {
    titleKey: "nav.sections.analytics",
    items: [
      { to: "/hisobotlar", labelKey: "nav.reports", icon: BarChart3, permissions: [P.reportRead] },
    ],
  },
  {
    /*
      Qo'llanma — menyudagi YAGONA element, u ruxsatga bog'liq emas.
      Sabab oddiy: u aynan «menda qanday huquq bor va nima qila olaman»
      degan savolga javob beradi, ya'ni huquqi eng kam xodimga eng kerak.
      Ichidagi ruxsat kalitlari maxfiy emas — haqiqiy himoya serverda.
    */
    titleKey: "nav.sections.help",
    items: [{ to: "/qollanma", labelKey: "nav.guide", icon: BookOpen, permissions: [] }],
  },
  {
    titleKey: "nav.sections.admin",
    items: [
      { to: "/xodimlar", labelKey: "nav.users", icon: UserCog, permissions: [P.userManage] },
      { to: "/rollar", labelKey: "nav.roles", icon: KeyRound, permissions: [P.roleManage] },
      {
        to: "/sozlamalar",
        labelKey: "nav.settings",
        icon: Settings,
        permissions: [P.settingsManage, P.branchManage, P.holidayManage],
      },
      { to: "/sayt", labelKey: "nav.website", icon: Globe, permissions: [P.landingManage] },
      { to: "/import", labelKey: "nav.imports", icon: Upload, permissions: [P.importManage] },
      { to: "/audit", labelKey: "nav.audit", icon: ScrollText, permissions: [P.auditRead] },
    ],
  },
];

/** Route -> kerakli ruxsatlar (kamida bittasi). Bo'sh massiv — hammaga ochiq. */
export const ROUTE_PERMISSIONS: Record<string, string[]> = Object.fromEntries(
  NAV_SECTIONS.flatMap((section) => section.items.map((item) => [item.to, item.permissions])),
);

/** Ichki (menyuda ko'rinmaydigan) sahifalar uchun qo'shimcha himoya. */
Object.assign(ROUTE_PERMISSIONS, {
  "/bolalar/$id": [P.childRead],
  "/otaonalar/$id": [P.guardianRead],
  "/guruhlar/$id": [P.groupRead],
  "/xodimlar/$id": [P.userManage],
});

export const PUBLIC_ROUTES = ["/", "/kirish", "/parolni-tiklash"];

export const isPublicRoute = (pathname: string): boolean => PUBLIC_ROUTES.includes(pathname);

/** Manzil bo'yicha kerakli ruxsatlar — dinamik segmentlar hisobga olinadi. */
export function permissionsForRoute(pathname: string): string[] {
  if (ROUTE_PERMISSIONS[pathname]) return ROUTE_PERMISSIONS[pathname];
  const [, first] = pathname.split("/");
  const base = `/${first ?? ""}`;
  return ROUTE_PERMISSIONS[base] ?? [];
}

/**
 * Manzil bo'yicha menyudagi joylashuv: qaysi bo'limning qaysi elementi.
 * Yuqori paneldagi zanjir shundan quriladi — alohida ro'yxat saqlanmaydi.
 * Ichki sahifalar (`/bolalar/123`) ota elementga tegishli deb hisoblanadi.
 */
export function navTrailFor(pathname: string): { sectionKey: string; labelKey: string } | null {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.to || pathname.startsWith(`${item.to}/`)) {
        return { sectionKey: section.titleKey, labelKey: item.labelKey };
      }
    }
  }
  return null;
}
