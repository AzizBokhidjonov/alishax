# Backend integratsiyasidan keyingi holat

Ilgari bu yerda lokal mock store (`src/store`, `src/data/seed`) bilan bog'liq
mantiqiy xatolar ro'yxati turardi. Mock qatlami butunlay olib tashlandi — panel
endi `https://api.alishaxkids.uz/api/v1` bilan ishlaydi, shuning uchun eski
ro'yxat ahamiyatini yo'qotdi.

## Hozircha ochiq savollar

1. **Yozish amallari jonli bazada sinalmagan.** O'qish so'rovlari (auth, ro'yxatlar,
   dashboard, matritsa) haqiqiy API'da tekshirildi; yaratish/tahrirlash so'rovlari
   esa mijoz tomonda tayyor, lekin ishchi bazaga test yozuvi kiritilmadi.
2. **Ba'zi javob maydonlari sxemada tavsiflanmagan.** `openapi.json` da javob
   tanalari bo'sh, shuning uchun `src/api/types/` dagi javob turlari funksional
   spetsifikatsiya va jonli javoblardan olingan. Backend maydon nomini o'zgartirsa,
   turlarni yangilash kerak (`npm run fetch:api`).
3. **Hisobot eksporti** `202 { jobId }` qaytarsa, mijoz `GET /exports/:id` ni
   so'rab turadi (`EXPORT_POLL_MS`, 60 urinish). Katta hisobotlarda bu chegara
   yetarli ekanini tekshirish kerak.
4. **Ro'yxatlarning bir qismi sahifalanmagan holda keladi** (`/groups`, `/guardians`,
   `/tariffs`, `/periods`, `/users`), shuning uchun mijoz `toPage()` bilan bir xil
   shaklga keltiradi. Backend ularni sahifalashga o'tkazsa, qo'shimcha o'zgarish
   talab qilinmaydi.
