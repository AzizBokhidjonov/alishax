import {
  Apple,
  Baby,
  Globe,
  HeartHandshake,
  Music4,
  Palette,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const PHONE = "+998 33 131 03 03";
export const PHONE_HREF = "tel:+998331310303";
export const TELEGRAM = "https://t.me/alishax_kids_uz";
export const INSTAGRAM = "https://www.instagram.com/alishax.kids";
export const YANDEX = "https://yandex.uz/maps/-/CTUAULmY";
export const MYLINK = "https://mylink.asia/alishaxkids";
export const MAP_EMBED =
  "https://yandex.uz/map-widget/v1/?ll=69.224274%2C41.378712&z=17&pt=69.224274,41.378712,pm2rdm";

export interface NavAnchor {
  href: string;
  label: string;
}

export const NAV_ANCHORS: NavAnchor[] = [
  { href: "#biz-haqimizda", label: "landing.about" },
  { href: "#dasturlar", label: "landing.programs" },
  { href: "#kun-tartibi", label: "landing.schedule" },
  { href: "#fikrlar", label: "landing.reviews" },
  { href: "#aloqa", label: "landing.contact" },
];

export const MARQUEE_ITEMS = [
  "landing.english",
  "landing.russian",
  "landing.math",
  "landing.speech",
  "landing.massage",
  "landing.karate",
  "landing.meals",
  "landing.ages",
];

export interface ProgramItem {
  icon: LucideIcon;
  title: string;
  text: string;
  tone: string;
}

export const PROGRAMS: ProgramItem[] = [
  {
    icon: Baby,
    title: "landing.babyTitle",
    text: "landing.babyText",
    tone: "bg-brand/15 text-brand-ink",
  },
  {
    icon: Globe,
    title: "landing.languages",
    text: "landing.languagesText",
    tone: "bg-sky/20 text-sky-ink",
  },
  {
    icon: Palette,
    title: "landing.artTitle",
    text: "landing.artText",
    tone: "bg-berry/15 text-berry-ink",
  },
  {
    icon: Music4,
    title: "landing.musicTitle",
    text: "landing.musicText",
    tone: "bg-sky/20 text-sky-ink",
  },
  {
    icon: Apple,
    title: "landing.meals",
    text: "landing.mealsText",
    tone: "bg-sun/25 text-sun-foreground",
  },
  {
    icon: HeartHandshake,
    title: "landing.therapyTitle",
    text: "landing.therapyText",
    tone: "bg-brand/15 text-brand-ink",
  },
  {
    icon: ShieldCheck,
    title: "landing.safetyTitle",
    text: "landing.safetyText",
    tone: "bg-sky/20 text-sky-ink",
  },
  {
    icon: Sparkles,
    title: "landing.schoolTitle",
    text: "landing.schoolText",
    tone: "bg-berry/15 text-berry-ink",
  },
];

export const SCHEDULE = [
  { time: "07:30", title: "landing.arrival" },
  { time: "08:30", title: "landing.breakfast" },
  { time: "09:30", title: "landing.lessons" },
  { time: "11:00", title: "landing.outdoor" },
  { time: "12:30", title: "landing.lunch" },
  { time: "16:00", title: "landing.afternoon" },
  { time: "18:30", title: "landing.handover" },
];

export const REVIEWS = [
  {
    name: "Dilnoza Y.",
    role: "landing.review1Role",
    text: "landing.review1",
  },
  {
    name: "Jasur T.",
    role: "landing.review2Role",
    text: "landing.review2",
  },
  {
    name: "Kamola R.",
    role: "landing.review3Role",
    text: "landing.review3",
  },
];

export const HIGHLIGHTS = [
  "landing.languages",
  "landing.video",
  "landing.therapists",
  "landing.dailyReport",
  "landing.meals",
  "landing.yard",
];

export const STATS = [
  { value: "12+", label: "landing.experience" },
  { value: "180", label: "landing.children" },
  { value: "24", label: "landing.teachers" },
  { value: "5", label: "landing.mealsCount" },
];
