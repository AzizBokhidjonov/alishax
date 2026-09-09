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
  { href: "#biz-haqimizda", label: "Biz haqimizda" },
  { href: "#dasturlar", label: "Dasturlar" },
  { href: "#kun-tartibi", label: "Kun tartibi" },
  { href: "#fikrlar", label: "Fikrlar" },
  { href: "#aloqa", label: "Aloqa" },
];

export const MARQUEE_ITEMS = [
  "Ingliz tili",
  "Rus tili",
  "Matematika",
  "Logopediya",
  "Massaj",
  "Karate",
  "Kuniga 5 mahal ovqat",
  "1,5 – 7 yosh",
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
    title: "Kichik guruh (1,5–3 yosh)",
    text: "Moslashuv, nutq va harakat o'yinlari orqali ilk qadamlar.",
    tone: "bg-brand/15 text-brand-ink",
  },
  {
    icon: Globe,
    title: "Ingliz va rus tili",
    text: "O'yin orqali til muhiti — har kuni yangi so'zlar.",
    tone: "bg-sky/20 text-sky-ink",
  },
  {
    icon: Palette,
    title: "Ijod va rasm",
    text: "Rang, shakl va tasavvur — har kuni yangi asar yaratamiz.",
    tone: "bg-berry/15 text-berry-ink",
  },
  {
    icon: Music4,
    title: "Musiqa, raqs va karate",
    text: "Ritm, sahna va sport orqali ishonch shakllanadi.",
    tone: "bg-sky/20 text-sky-ink",
  },
  {
    icon: Apple,
    title: "Kuniga 5 mahal ovqat",
    text: "Shifokor nazoratidagi menyu, mavsumiy mahsulotlar.",
    tone: "bg-sun/25 text-sun-foreground",
  },
  {
    icon: HeartHandshake,
    title: "Logopediya va massaj",
    text: "Mutaxassislar bilan individual mashg'ulotlar.",
    tone: "bg-brand/15 text-brand-ink",
  },
  {
    icon: ShieldCheck,
    title: "Xavfsizlik nazorati",
    text: "Kim olib ketishi ruxsat etilgani tizimda qayd etiladi.",
    tone: "bg-sky/20 text-sky-ink",
  },
  {
    icon: Sparkles,
    title: "Maktabga tayyorlov",
    text: "Harflar, sanoq va mantiq — 6–7 yoshlilar uchun.",
    tone: "bg-berry/15 text-berry-ink",
  },
];

export const SCHEDULE = [
  { time: "07:30", title: "Qabul va erkin o'yin" },
  { time: "08:30", title: "Ertalabki gimnastika va nonushta" },
  { time: "09:30", title: "Til va rivojlantiruvchi mashg'ulot" },
  { time: "11:00", title: "Sayr va harakatli o'yinlar" },
  { time: "12:30", title: "Tushlik va tinch uyqu" },
  { time: "16:00", title: "Ijod, musiqa, karate, kechki gazak" },
  { time: "18:30", title: "Ota-onaga topshirish" },
];

export const REVIEWS = [
  {
    name: "Dilnoza Y.",
    role: "Amirning onasi",
    text: "Bolam ertalab bog'chaga yugurib boradi. Tarbiyachilar juda mehribon, har kuni hisobot yuboriladi.",
  },
  {
    name: "Jasur T.",
    role: "Nilufarning otasi",
    text: "Davomat va to'lovlar tizim orqali shaffof. Kim olib ketishini o'zim belgilayman — bu juda tinchlantiradi.",
  },
  {
    name: "Kamola R.",
    role: "Sardorning onasi",
    text: "Bir yilda ingliz tilida gapira boshladi, harflarni o'rgandi. Ovqatlanish menyusi ham a'lo.",
  },
];

export const HIGHLIGHTS = [
  "Ingliz va rus tili",
  "Video kuzatuv va xavfsizlik",
  "Logoped va massaj",
  "Kundalik davomat hisoboti",
  "Kuniga 5 mahal ovqat",
  "Ochiq hovli va o'yin maydoni",
];

export const STATS = [
  { value: "12+", label: "Yillik tajriba" },
  { value: "180", label: "Baxtli bola" },
  { value: "24", label: "Tarbiyachi va mutaxassis" },
  { value: "5", label: "Mahal ovqat" },
];
