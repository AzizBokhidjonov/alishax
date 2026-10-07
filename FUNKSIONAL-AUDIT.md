# Funksional audit — Handbook ↔ hozirgi tizim

**Yangilangan: 2026-10-05** — `FRONTEND-DEVELOPER-HANDBOOK` 4-oktabr versiyasi
(209 operatsiya / 167 yo'l) ↔ jonli `https://api.alishaxkids.uz/docs-json`
(209 / 167 — bir xil) ↔ shu repodagi frontend.

Tekshiruv usuli: handbook inventarizatsiyasi jonli OpenAPI bilan dasturiy
solishtirildi, farqlar esa HTTP so'rov bilan alohida tasdiqlandi (mavjud
endpoint autentifikatsiyasiz `401`, mavjud bo'lmagani `404` qaytaradi).

---

## 0. 5-oktabr yangilanishi — nima qilindi

Backend QAYTA DEPLOY qilingan: sentabrda yo'q bo'lgan 7 ta endpoint endi bor
(`401` qaytaradi), ustiga 3 ta yangi `lookups` endpointi qo'shilgan. Ya'ni
sentabrdagi «backend bo'shlig'i» yopilgan va hammasi frontend ishiga aylangan.
Quyidagilar bajarildi.

### Yangi API kontraktlari

| Nima | Qayerda |
|---|---|
| `GET /lookups/children` — amal huquqi bo'yicha bola tanlash | `src/api/endpoints/lookups.ts`, `ChildPicker` ga `permission` propi |
| `GET /lookups/children/{id}/pickup-guardians` | `PickupGuardianPicker`, olib ketish tanlagichi |
| `GET /lookups/children/{id}/payers` | `PayerPicker` — to'lov formasida |
| `GET /auth/bootstrap` | `authApi.session()` — eski o'rnatmada `/auth/me` ga qaytadi |
| `GET /attendance/board` | `use-board-rows.ts` — ikki so'rovli chetlab o'tish olib tashlandi |
| `GET /billing-runs` | «Tugallanmagan hisoblashlar» paneli |
| `POST /charges/adjustments` | «Tuzatish» oynasi (ikki ruxsat talab qiladi) |
| `GET /children/{id}/charge-ledger` | «Daftarcha» varaqasi |
| `POST /children/{id}/recalculate-billing` | «Qayta hisoblash» oynasi |
| `PATCH /children/{id}/tariffs/{id}` | Tarif biriktirishini yopish |

### Ota-ona orqali olib ketish (handbook §0 ning asosiy qismi)

Bog'langan ota-ona endi QO'SHIMCHA «olib ketuvchi shaxs» yozuvisiz bolani
olib ketadi. Buning uchun:

- qabul qiluvchi TEGLANGAN qiymatga aylantirildi (`PickupRecipient`:
  `guardian` / `permission` / `person`) — uch xil id bir xil `string` bo'lib
  almashib ketishi tur darajasida mumkin emas, server esa ularni aralashtirsa
  `422` beradi;
- tanlagich ikki guruhli bo'ldi (`PickupRecipientPicker`): ota-onalar va
  boshqa ruxsat berilgan odamlar ALOHIDA yuklanadi, biri xato bersa
  ikkinchisi ishlaydi, qo'shimcha ruxsatlar ro'yxati bo'sh bo'lsa ham
  ota-ona orqali berish bloklanmaydi;
- `/pickup-permissions/active` turi tuzatildi: u `PickupPerson[]` emas,
  ruxsatlar ro'yxati va bir martalik ruxsatda ism `adhocFullName` da keladi —
  ilgari ular ismsiz ko'rinardi;
- `AttendanceRecord` ga `pickupGuardianId` va `pickupPermissionId` qo'shildi
  (so'rovda `guardianId`, javobda `pickupGuardianId` — nomlari boshqa).

### Davomat: sahifani qayta yuklamasdan yangilanish

Muvaffaqiyatli amaldan keyin faqat MOS keladigan qator almashtiriladi
(`applyRecord`, `child.id` ↔ `response.childId`), `child` obyekti va qolgan
qatorlar saqlanadi — guruh, qidiruv, fokus va skroll joyida qoladi. Taxta
o'zi qayta o'qilmaydi, chunki amaldan oldin boshlangan sekin so'rov yangi
holatni bosib ketishi mumkin.

Chiqishda optimistik yangilash ATAYLAB yo'q: bola serverning tasdig'igacha
«chiqqan» deb ko'rsatilmaydi.

### Tibbiy javob shakllari

Server `{record, allergies, medications}` va `{allergies, emergencyInstructions}`
qaytaradi, frontend esa yassi yozuvni kutardi — ya'ni allergiyalar va dorilar
javobda kelsa ham ekranda ko'rinmasdi. Endi ikkala shakl ham qabul qilinadi
(`normalizeMedical`, `normalizeAlerts`), shoshilinch ko'rsatma esa alohida
ogohlantirish bo'lib qo'shiladi — aks holda tarbiyachi uni hech qachon
ko'rmaydi.

### Tanlagichlarni bolaga bog'lash (cross-screen qoidalari)

- to'lovchi va rozilik beruvchi global katalogdan emas, BOLAGA bog'langanlar
  ichidan tanlanadi;
- bola almashganda `payerGuardianId`, qo'lda taqsimot va olib ketish
  tanlovi — hammasi tozalanadi, oldingi VERDIKT ham;
- bola tanlanmaguncha bog'liq tanlagichlar yopiq va nima qilish kerakligini
  aytadi (bo'sh ro'yxat «hech kim yo'q» degan noto'g'ri xulosa beradi);
- guruh almashganda taxta eski javobni ushlab turmaydi.

### Qamrov holati

Jonli backenddagi 167 yo'lning hammasi frontendda ulangan. Hisobga
olinmaganlar: `telegram/webhook` (brauzerdan chaqirilmaydi), `/health`,
ommaviy media prefiksi (`mediaBaseUrl` orqali keladi), 16 ta hisobot
(dinamik `/reports/${path}`), `/auth/refresh` (`http.ts` da) va 2 ta
dinamik `DELETE`.

---

## 1. Xulosa

| Qatlam | Holat |
|---|---|
| Frontend → backend qamrovi | **To'liq.** Jonli backenddagi barcha kerakli endpointlar ishlatilgan; ortiqcha yoki xayoliy chaqiruv yo'q. |
| Ekranlar (handbook §5) | **To'liq.** 15 ta ish sohasining hammasi uchun sahifa bor. |
| Landing CMS render | **To'liq.** 11 ta blok turining hammasi chiziladi. |
| Landing ommaviy ko'rinishi | **Sozlama buzuq** — 3-bo'limga qarang. |
| Backend (prod) | **7 ta endpoint yo'q** — 2-bo'limga qarang. |

---

## 2. Backendda YO'Q bo'lgan 7 ta endpoint — HAL QILINDI (tarix)

**5-oktabr holati: hammasi `401` qaytaradi, ya'ni mavjud va frontendda
ulangan.** Quyidagi jadval sentabrdagi holatni va har birining nima uchun
kerakligini saqlab turadi.

| Operatsiya | Handbookdagi vazifasi | Natijada ishlamaydigan funksiya |
|---|---|---|
| `GET /auth/bootstrap` | Sessiya boshlanishida rol, ruxsat, tashkilot, filial/guruh, vaqt mintaqasi va valyutani bitta so'rovda berish | Frontend `/auth/me` bilan ishlayapti; tashkilot/vaqt mintaqasi/valyuta alohida olinadi |
| `GET /attendance/board` | Kunning TO'LIQ reyestri, yozilmagan bola `null` bilan | Frontend buni `/children` + `/attendance/today` dan o'zi yig'yapti (`src/features/attendance/use-board-rows.ts`) — ishlaydi, lekin ikki so'rov va sahifalash yuki |
| `GET /billing-runs` | Tugallanmagan hisoblashlar ro'yxati | Yarim qolgan hisoblashni tiklab bo'lmaydi — faqat yangisini boshlash mumkin |
| `POST /charges/adjustments` | Qo'lda debet/kredit tuzatish (sabab + ishora bilan) | **Umuman yo'q.** Oilaga chegirma/qo'shimcha qarz yozish imkoni yo'q |
| `GET /children/{id}/charge-ledger` | To'liq daftarcha: tuzatishlar va qarshi satrlar bilan | **Umuman yo'q.** Faqat `/children/{id}/charges` (joriy musbat hisoblar) bor |
| `POST /children/{id}/recalculate-billing` | Davomat tuzatilgandan keyin qayta hisoblash | **Umuman yo'q.** Tuzatishning moliyaviy oqibati qo'lda hal qilinadi |
| `PATCH /children/{id}/tariffs/{id}` | Bolaning tarif biriktirishini tugatish | Biriktirishni muddatidan oldin yopib bo'lmaydi |

**Xulosa:** 1–3-qatorlar — qulaylik yo'qotishi (ishlaydigan chetlab o'tish bor).
4–6-qatorlar — **haqiqiy funksional bo'shliq**: moliyaviy tuzatish va to'liq
daftarcha handbookda alohida bo'lim bilan tavsiflangan, lekin na backendda, na
frontendda mavjud emas.

Ehtimoliy sabab: `api.alishaxkids.uz` da turgan backend handbook ko'rib chiqilgan
manbadan eskiroq. Birinchi qadam — backendni qayta deploy qilib, shu 7 ta
endpointni qaytadan tekshirish.

---

## 3. Landing: adminkadagi kontent nega saytda ko'rinmaydi

**Sabab zanjirdagi oxirgi bo'g'inda, kontentda emas.**

Ommaviy sahifa ikki manzildan birida yashaydi:

```
/api/v1/public/landing/{tenantCode}   ← kod: VITE_LANDING_TENANT_CODE (frontend)
/api/v1/public/landing                ← kod: LANDING_DEFAULT_TENANT_CODE (backend)
```

Hozirgi holat:

- `.env` da `VITE_LANDING_TENANT_CODE` **bo'sh**;
- backendda `LANDING_DEFAULT_TENANT_CODE` **o'rnatilmagan** — buni server o'zi
  aytadi: `"No tenant specified. Use /public/landing/{tenantCode}, or set LANDING_DEFAULT_TENANT_CODE."`

Natijada ommaviy so'rov har doim `404` qaytaradi, `LandingPage` esa buni
«hali chop etilmagan» deb qabul qilib statik matnga qaytadi. Ya'ni adminkada
nima yozilsa ham, nechchi marta chop etilsa ham, saytda ko'rinmaydi —
va ekranda buning sababi aytilmaydi.

`https://alishaxkids.uz` ham ayni damda statik variantni ko'rsatmoqda
(CMS bloklarining bironta ham `id` si sahifada yo'q), demak muammo prodda ham bor.

### Shu repoda qilingani

- `publicLandingApi.page()` endi **ikkala manzilni ham** sinaydi: kodli yo'l
  `404` bersa yalang'och yo'lga o'tadi. Ikki sozlamadan bittasi to'ldirilishi
  bilan sayt ishlaydi.
- «Sayt» bo'limiga **«Ommaviy sahifa holati»** paneli qo'shildi: qaysi manzil
  sinaldi, nima qaytdi va nechta blok keldi — hammasi ekranda. Sozlama
  muammosi endi jim emas.
- `.env.example` da tenant kodi nima uchun kerakligi yozildi.

### Qolgan qadam (sozlama, kod emas)

Tenant kodini bilish uchun autentifikatsiya kerak, shuning uchun uni bu yerdan
aniqlay olmadim. Tizimga kirib «Sayt» bo'limidagi tekshiruvni ishga tushiring,
so'ng ikkisidan birini bajaring:

1. `.env` ga `VITE_LANDING_TENANT_CODE=<kod>` yozib frontendni qayta yig'ing; **yoki**
2. backendda `LANDING_DEFAULT_TENANT_CODE=<kod>` ni o'rnating (bitta bog'chali
   o'rnatma uchun shunisi soddaroq).

Uchinchi ehtimol: sahifa **hali birorta ham chop etilmagan**. Backend hujjati
aniq aytadi: *«404 until the page has been published at least once»*. Panel
buni ham ajratib ko'rsatadi.

---

## 3a. /sayt muharriri ↔ landing: maydon darajasidagi bog'lanish

Savol: adminkada kiritilgan kontent ommaviy sahifa bilan haqiqatan bog'langanmi?
Tekshiruv: muharrir yozadigan maydon nomlari (`src/features/website/block-schema.ts`)
ommaviy render o'qiydigan kalitlar bilan (`src/features/landing/PublicBlocks.tsx`)
dasturiy solishtirildi.

**Natija: maydonlar mos, ikkita uzilish topildi va ikkalasi ham tuzatildi.**

### Uzilish 1 — SEO varaqasi ishlatilmasdi (tuzatildi)

«Sayt → SEO» da kiritilgan sarlavha, tavsif va ijtimoiy tarmoq rasmi saqlanar,
chop etilar va ommaviy javobda `seo` sifatida qaytar edi — lekin sahifa ularni
umuman o'qimasdi: `<title>`, `description` va `og:` teglari
`src/routes/index.tsx` da qotirib yozilgan edi. Ya'ni SEO varaqasi ko'rinishda
ishlaydi, amalda esa hech narsaga ta'sir qilmasdi.

Endi bosh sahifa marshruti chop etilgan sahifani `loader` da o'qiydi va meta
teglarni **serverda** to'ldiradi (botlar JavaScript kutmaydi). Har bir maydon
alohida zaxiraga tushadi, shuning uchun yarim to'ldirilgan SEO sahifani
sarlavhasiz qoldirmaydi. Uchta himoya qo'yildi: dev'dagi nisbiy API manzilida
so'rov yuborilmaydi, har qanday xato yutiladi va kutish 3 soniya bilan cheklangan —
bosh sahifa API tufayli ochilmay qolmaydi.

Eslatma: `canonicalUrl` qoralama SEO'sida bor, lekin ommaviy javobda qaytmaydi,
shuning uchun u hozircha ishlatilmaydi.

### Uzilish 2 — `features` blokidagi `icon` (tuzatildi)

«Afzalliklar» blokining har bir elementida `icon` maydoni bor va muharrir uni
saqlar edi, lekin ommaviy render uni umuman chizmasdi — kiritilgan qiymat hech
qayerda ko'rinmasdi.

Maydon ma'nosi backend katalogida yozilmagan (`GET /landing/block-types`
javobida tavsif yo'q), shuning uchun u egasi bilan kelishildi: qiymat **emoji**
sifatida kiritiladi va kartochkada sarlavha tepasida chiziladi. Ikonka
kutubxonasi va nomlar ro'yxati kerak emas, noto'g'ri nom sababli bo'sh joy
qolmaydi. Emoji `aria-hidden` — yonidagi sarlavha ayni ma'noni matn bilan
aytadi. Muharrirdagi yorliq ham yangilandi: «Ikonka (emoji, masalan 🎨)».

### Yakuniy holat

Maydonlar solishtiruvi qayta yurgizildi: **11 ta blokning hammasida muharrir
yozadigan va ommaviy sahifa o'qiydigan kalitlar to'liq mos** — kiritiladigan,
lekin chiqmaydigan maydon qolmadi.

Shuning uchun javob: ha, /sayt muharriri landing sahifa bilan to'liq bog'langan.
Yagona qolgan to'siq — 3-bo'limdagi tenant kodi sozlamasi, ya'ni kontent emas,
manzil masalasi.

---

## 4. Handbookdagi muhim qoidalar — frontendda tekshirildi

| Qoida | Holat |
|---|---|
| `401` da bitta umumiy refresh + bitta qayta yuborish | ✅ `src/api/http.ts` |
| `TOKEN_EXPIRED` talab qilinmasin, `UNAUTHENTICATED` ham refresh boshlasin | ✅ ikkala kod ham qabul qilinadi |
| `Idempotency-Key`: to'lov, hisoblashni tasdiqlash, xabarnoma | ✅ uchalasida ham majburiy argument |
| Pul — butun tiyin satri, `Number` orqali o'tkazilmasin | ✅ `src/lib/money.ts` |
| Sana maydonlari vaqt mintaqasida siljimasin | ✅ `src/lib/dates.ts` |
| Menyu rol nomiga emas, ruxsat kalitiga qarab qurilsin | ✅ `src/config/navigation.ts` |
| Yozilmagan davomat ≠ kelmagan | ✅ `use-board-rows.ts` uchinchi holatni saqlaydi |
| Noma'lum landing blok turi saytni sindirmasin | ✅ `PublicBlocks.tsx` — `default: null` |
| Telegram webhook brauzerdan chaqirilmasin | ✅ chaqirilmaydi |

---

## 5. Instruksiya bo'limi (yangi)

Menyuga **«Yordam → Instruksiya»** (`/qollanma`) qo'shildi. Sahifa hamma uchun
ochiq — u aynan «menda qanday huquq bor va nima qila olaman» degan savolga
javob beradi, ya'ni huquqi eng kam xodimga eng kerak.

Uch bo'lim:

1. **Menga tegishli** — foydalanuvchining jonli rollari, unga ochiq menyu
   bandlari va har bir ruxsat qamrovi bilan; so'ng o'z roli uchun to'liq qo'llanma.
2. **Barcha rollar** — 7 ta seed roli uchun: rol haqida, qadamlab ish tartibi,
   ogohlantirishlar, ishlaydigan bo'limlari (bosiladigan havolalar) va tayanch
   ruxsatlari. Ruxsat yonida «sizda bor / sizda yo'q» belgisi turadi.
3. **Umumiy qoidalar** — pul, sana, tasdiq, audit va xato kodlari bo'yicha
   hamma uchun amal qiladigan 9 ta qoida.

Matn o'zbek va rus tillarida, tuzilmasi bir xil (tekshirildi).

| Rol | Qadamlar | Ogohlantirishlar |
|---|---|---|
| Ega | 6 | 3 |
| Direktor | 6 | 3 |
| Administrator | 7 | 4 |
| Hisobchi | 8 | 6 |
| Tarbiyachi | 5 | 3 |
| Qabulxona | 7 | 4 |
| Hamshira | 6 | 3 |

Qo'llanma matni `src/i18n/locales/<til>/guide.ts` da, tuzilmasi
`src/features/guide/role-guides.ts` da. Rol huquqlari o'zgarsa, «Menga tegishli»
bo'limi o'zi yangilanadi — u jonli ruxsatlardan hisoblanadi.
