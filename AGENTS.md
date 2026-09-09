# Agent yo'riqnomasi

Alishax Kids — bog'cha uchun sayt va boshqaruv paneli.
Stack: TanStack Start (SSR), React 19, TypeScript, Tailwind CSS v4, shadcn/ui.
Boshqaruv paneli **NestJS backend API** ustida ishlaydi; lokal mock ma'lumot yo'q.

## Buyruqlar

```sh
npm run dev      # development server (port 8080)
npm run build    # production build -> .output/
npm run lint     # ESLint (0 xato, 0 ogohlantirish bo'lishi shart)
npm run format   # Prettier
npm run fetch:api && npm run gen:api   # OpenAPI sxemasi va turlar
```

## Tuzilish

```
src/
├── api/         API mijozi: http.ts (Bearer, refresh halqasi, Idempotency-Key),
│                error.ts (xato konverti), endpoints/, types/, openapi.json
├── auth/        AuthProvider (token xotirada), usePermissions
├── config/      permissions.ts (52 kalit, 7 rol), navigation.ts, constants.ts
├── features/    modul sahifalari + har birida `api.ts` (TanStack Query hooklari)
├── components/  ui/ (shadcn — TEGMA), common/, layout/, forms/
├── i18n/        uz (standart) + ru kataloglari
├── lib/         money, dates, errors, query, idempotency, utils
└── routes/      FAQAT route ta'rifi va sahifa importi (__root.tsx — app shell)
```

## Qoidalar

- **Routing** — faqat `src/routes/` ichida. `src/routeTree.gen.ts` avtomatik
  generatsiya qilinadi — qo'lda tegmang.
- **Bitta fayl 250 qatordan oshmasin** (`src/components/ui/` bundan mustasno).
- **Sahifa komponenti nomlangan funksiya bo'lsin.**
- **`any` ishlatilmaydi.**

### Backend bilan ishlash (buzilmaydigan shartnoma)

- **Pul — butun tiyin, satr ko'rinishida.** Faqat `lib/money.ts` (BigInt). `number`
  yoki float bilan hisob-kitob qilinmaydi, serverga ham tiyin satri yuboriladi.
- **Xato matni `code` bo'yicha olinadi** (`lib/errors.ts` -> `i18n .../errors.ts`).
  Konvertdagi inglizcha `message` foydalanuvchiga ko'rsatilmaydi.
- **Yangi so'rov** faqat `api/endpoints/*` orqali; komponentda `fetch` yozilmaydi.
  Yozish amallari `useApiMutation` (`lib/query.ts`) bilan — u xatoni tarjima qiladi
  va keshni yangilaydi.
- **Ruxsat** `usePermissions()` va `config/permissions.ts` dagi `P.*` kalitlari
  orqali tekshiriladi; rol nomiga qarab shart yozilmaydi. Yashirilgan tugma —
  qulaylik, himoya emas: `403` baribir qayta ishlanadi.
- **`Idempotency-Key`** to'lov, hisob tasdiqlash va xabarnoma yuborishda majburiy
  (`lib/idempotency.ts`), amal boshlanganda yaratiladi.
- **Sana**: kalendar sanalar `yyyy-MM-dd` (Asia/Tashkent, brauzer mintaqasiga
  o'tkazilmaydi), vaqt tamg'alari ISO + ofset — `lib/dates.ts`.
- **Ro'yxatlar** `?page&limit&sort&q` bilan so'raladi va `meta` bo'yicha
  sahifalanadi (`useListParams`, `ListPagination`).
- Javob shakli noaniq bo'lsa — sxemani tekshiring (`src/api/openapi.json` yoki
  `https://api.alishaxkids.uz/docs`), taxmin qilinmaydi.

### UI

- **Ranglar** — `src/styles.css` dagi tokenlar: brend (`brand`, `sun`, `sky`,
  `leaf`, `berry`) va holat (`st-ok`, `st-warn`, `st-info`, `st-danger`,
  `st-neutral`). Qotirilgan hex ham, Tailwind palitrasi ham ishlatilmaydi.
- **Formalar** — `useEntityForm()` + `components/forms/schemas/` dagi zod sxemasi.
  Server `422` dagi maydon xatolari formaga avtomatik bog'lanadi.
- **Holatlar** — ro'yxat va sahifalarda `QueryState` (yuklanish / xato / ruxsat yo'q /
  bo'sh) ishlatiladi.
- **Til** — interfeys matnlari i18n kalitlari orqali (`uz` + `ru`), kod izohlari
  o'zbek tilida. Yangi matn ikkala katalogga ham qo'shiladi.

## Vite konfiguratsiyasi

`vite.config.ts` da plaginlar tartibi muhim: `tanstackStart()` `viteReact()` dan
oldin turishi shart. `nitro()` ichidagi `routeRules` dev'da `/api/**` ni backendga
proksilaydi — bu `kg_refresh` cookie (`SameSite=Lax`) ishlashi uchun zarur.
Server entry `src/server.ts` ga yo'naltirilgan — buni o'zgartirmang.
