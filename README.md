# Alishax Kids

Toshkentdagi **Alishax Kids** bog'chasi uchun veb-sayt va boshqaruv paneli.
Panel to'liq **NestJS backend API** ustida ishlaydi (`https://api.alishaxkids.uz/api/v1`) —
lokal demo ma'lumot yo'q.

## Texnologiyalar

- [TanStack Start](https://tanstack.com/start) (SSR + fayl asosidagi routing)
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (Radix)
- TanStack Query (server holati), TanStack Router
- React Hook Form + Zod (formalar)
- react-i18next — `uz` (standart) va `ru`

## Ishga tushirish

```sh
npm ci
npm run dev      # http://localhost:8080
```

`.env` (namunasi `.env.example` da):

```
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=https://api.alishaxkids.uz
```

**Nega nisbiy manzil?** Backend yangilash tokenini `kg_refresh` httpOnly cookie'da
`SameSite=Lax` bilan beradi. `http://localhost` va `api.alishaxkids.uz` boshqa saytlar
hisoblangani uchun brauzer bu cookie'ni yubormaydi va sessiya 15 daqiqadan keyin uziladi.
Shu sababli dev serverda `/api/**` so'rovlari nitro `routeRules` orqali backendga
proksilanadi (`vite.config.ts`) — cookie bir xil manzilda qoladi. Sayt va API bitta
domen ostida joylashtirilsa (masalan `alishaxkids.uz` + `api.alishaxkids.uz`) proksi
kerak emas, `VITE_API_BASE_URL` ga to'liq manzil yozish mumkin.

## Buyruqlar

| Buyruq              | Vazifasi                                          |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Development server (HMR bilan)                    |
| `npm run build`     | Production build (`.output/`)                     |
| `npm run preview`   | Build qilingan versiyani ko'rish                  |
| `npm run lint`      | ESLint (0 xato, 0 ogohlantirish talab qilinadi)   |
| `npm run format`    | Prettier                                          |
| `npm run fetch:api` | Jonli OpenAPI sxemasini `src/api/openapi.json` ga |
| `npm run gen:api`   | Sxemadan turlar generatsiyasi                     |

Mustaqil repolar, API adapterlari, testlar va deploy: [Backend integration](docs/backend-integration.md).

`npm run check` — typecheck, lint, regressiya testlari va production build.

## Loyiha tuzilishi

```
src/
  api/          — API mijozi: http.ts (Bearer + refresh halqasi), error.ts,
                  endpoints/ (22 modul), types/ (DTO va javob turlari), openapi.json
  auth/         — AuthProvider (token xotirada), usePermissions
  config/       — permissions.ts (52 ruxsat kaliti, 7 rol), navigation.ts, constants.ts
  features/     — modul sahifalari: children, guardians, groups, attendance, pickup,
                  finance, expenses, comms, reports, dashboard, users, settings,
                  imports, audit, auth, landing
  components/   — ui/ (shadcn — tegmaslik), common/, forms/, layout/
  i18n/         — uz + ru kataloglari
  lib/          — money.ts (tiyin), dates.ts (Asia/Tashkent), errors.ts, query.ts,
                  idempotency.ts
  routes/       — faqat route ta'rifi (fayl asosidagi routing)
```

## Shartnoma qoidalari (buzilmaydi)

1. **Pul — butun tiyin, satr ko'rinishida.** `lib/money.ts` (`BigInt`), hech qachon
   `number` yoki float emas.
2. **Xato matni `code` bo'yicha tarjima qilinadi**, konvertdagi inglizcha `message`
   ko'rsatilmaydi (`lib/errors.ts` + `i18n/locales/*/errors.ts`).
3. **Kirish tokeni xotirada**, yangilash tokeni httpOnly cookie; `401 TOKEN_EXPIRED`
   da bitta yangilash so'rovi va qayta yuborish (`api/http.ts`).
4. **Interfeys ruxsat kalitiga qarab ochiladi** (`config/permissions.ts`), lekin
   `403 FORBIDDEN` / `403 OUT_OF_SCOPE` baribir qayta ishlanadi.
5. **`Idempotency-Key`** — `POST /payments`, `/billing-runs/:id/commit`,
   `/notifications/send` (`lib/idempotency.ts`).
6. **Kalendar sanalar** `yyyy-MM-dd`, Asia/Tashkent; brauzer mintaqasiga o'tkazilmaydi.
7. **Ro'yxatlar** `?page&limit&sort&q` va `meta` bo'yicha sahifalanadi.

## Deploy

```sh
npm run build
node .output/server/index.mjs
```

Boshqa platformaga chiqarish uchun `vite.config.ts` dagi `nitro()` plaginiga
`preset` bering (masalan `preset: "cloudflare_module"`).
