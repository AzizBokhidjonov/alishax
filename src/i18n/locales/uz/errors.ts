/** Xato kodlari -> matn. Konvertdagi inglizcha `message` ishlatilmaydi. */
export const errors = {
  UNAUTHENTICATED: "Sessiya tugadi. Qaytadan kiring.",
  TOKEN_EXPIRED: "Sessiya muddati tugadi.",
  ACCOUNT_LOCKED: "Hisob vaqtincha bloklandi. 15 daqiqadan so'ng urinib ko'ring.",
  ACCOUNT_INACTIVE: "Hisobingiz faolsizlantirilgan. Administratorga murojaat qiling.",

  FORBIDDEN: "Bu amal uchun ruxsatingiz yo'q.",
  OUT_OF_SCOPE: "Bu yozuv sizning ko'rish doirangizdan tashqarida.",
  ROLE_PROTECTED: "Himoyalangan rolni o'zgartirib bo'lmaydi.",
  ROLE_IN_USE: "Rol foydalanuvchilarga biriktirilgan — avval ularni boshqa rolga o'tkazing.",
  LAST_OWNER: "Oxirgi Egani olib tashlab bo'lmaydi.",
  SELF_LOCKOUT: "O'zingizdan boshqaruv ruxsatini olib tashlay olmaysiz.",
  PRIVILEGE_ESCALATION: "O'zingizda yo'q ruxsatni bera olmaysiz.",
  SENSITIVE_PERMISSION: "Bu maxsus ruxsat — `role:manage:sensitive` talab qilinadi.",
  UNKNOWN_PERMISSION: "Noma'lum ruxsat kaliti yuborildi.",
  INVALID_SCOPE: "Bu ruxsat uchun bunday qamrov mumkin emas.",

  VALIDATION_FAILED: "Ma'lumotlar to'liq yoki to'g'ri emas.",
  NOT_FOUND: "Yozuv topilmadi.",
  DUPLICATE: "Bunday yozuv allaqachon mavjud.",
  CONFLICT: "Ma'lumot o'zgargan. Sahifani yangilab, qayta urinib ko'ring.",

  PERIOD_CLOSED: "Hisob davri yopilgan — bu davrga yozib bo'lmaydi.",
  BILLING_ALREADY_COMMITTED: "Bu davr uchun hisoblar allaqachon tasdiqlangan.",
  ALREADY_CHECKED_IN: "Bola bugun allaqachon qayd etilgan.",
  NOT_CHECKED_IN: "Bola kirishi qayd etilmagan.",
  CAPACITY_EXCEEDED: "Guruh sig'imi to'lgan.",
  PERMISSION_EXPIRED: "Olib ketish ruxsati muddati tugagan.",
  INSUFFICIENT_ALLOCATION: "To'lov summasi ochiq hisoblardan ko'p.",

  FILE_TOO_LARGE: "Fayl hajmi ruxsat etilganidan katta.",
  UNSUPPORTED_MEDIA_TYPE: "Fayl turi qo'llab-quvvatlanmaydi.",
  RATE_LIMITED: "Juda ko'p urinish. Biroz kuting.",
  INTERNAL_ERROR: "Serverda xatolik yuz berdi.",

  NETWORK: "Server bilan aloqa yo'q. Internetni tekshiring.",
  UNKNOWN: "Noma'lum xatolik.",
  traceId: "Xatolik kodi: {{traceId}}",
};
