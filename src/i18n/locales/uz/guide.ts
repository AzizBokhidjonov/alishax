/**
 * Rollar bo'yicha qo'llanma.
 *
 * Maqsad — xodim «men nima qila olaman va buni qanday qilaman» degan savolga
 * tizimdan chiqmasdan javob topsin. Shuning uchun matn qadamlar bilan
 * yozilgan va ekran nomlari menyudagi nomlar bilan bir xil.
 */
export const guide = {
  title: "Instruksiya",
  subtitle: "Har bir rol nima qila oladi va buni qanday bajaradi",

  yours: {
    title: "Sizning huquqlaringiz",
    roles: "Rollaringiz",
    noRoles: "Sizga hali rol berilmagan. Administratorga murojaat qiling.",
    openSections: "Sizga ochiq bo'limlar",
    permissions: "Ruxsatlar",
    scopeHint:
      "Qamrov ruxsat yonida ko'rsatilgan: «Barchasi» — butun bog'cha, «O'z guruhi» — faqat biriktirilgan guruh, «Bugun» — faqat bugungi yozuvlar.",
    none: "Bo'sh",
  },

  tabs: {
    mine: "Menga tegishli",
    all: "Barcha rollar",
    common: "Umumiy qoidalar",
  },

  sections: {
    summary: "Rol haqida",
    steps: "Ish tartibi",
    cautions: "Diqqat qiling",
    screens: "Ishlaydigan bo'limlari",
    permissions: "Tayanadigan ruxsatlari",
  },

  youHave: "sizda bor",
  youLack: "sizda yo'q",
  yourRole: "Sizning rolingiz",

  common: {
    title: "Hamma uchun umumiy qoidalar",
    items: [
      "Menyuda faqat sizga ruxsat berilgan bo'limlar ko'rinadi. Bo'lim ko'rinmasa — u sizga berilmagan, buzilgan emas.",
      "Har bir ro'yxatda qidiruv va filtrlar manzilga yoziladi: sahifani yangilasangiz ham, havolani hamkasbingizga yuborsangiz ham bir xil natija ochiladi.",
      "Pul summalari so'mda kiritiladi va so'mda ko'rsatiladi. Tiyingacha aniqlik saqlanadi — yaxlitlash yo'q.",
      "Sana maydonlari (tug'ilgan kun, davomat sanasi) vaqt mintaqasiga qarab siljimaydi. Vaqtlar esa Toshkent vaqtida ko'rsatiladi.",
      "Qaytarib bo'lmaydigan amallar (to'lovni bekor qilish, hisobni qaytarish, davrni qayta ochish) tasdiq oynasini so'raydi va ko'pchiligi sabab talab qiladi — sabab kamida 10 ta belgi bo'lishi kerak.",
      "Hech narsa o'chirilmaydi: bekor qilingan to'lov ham, qaytarilgan hisob ham daftarchada qarshi satr sifatida qoladi. Shuning uchun tarix har doim to'liq.",
      "Har bir muhim amal audit jurnaliga tushadi: kim, qachon, nimani o'zgartirgani yozib boriladi.",
      "Xato chiqsa, xabardagi kod va trace ID ni saqlab qo'ying — qo'llab-quvvatlashga aynan shu kerak bo'ladi.",
      "Parolingizni «Sozlamalar» bo'limidan o'zgartirasiz. Parolni unutsangiz, kirish sahifasidagi «Parolni unutdingizmi» havolasidan tiklash so'rovini yuboring.",
    ],
  },

  roles: {
    owner: {
      summary:
        "Ega — tizimning to'liq egasi. Barcha bo'limlar ochiq va faqat unda bo'ladigan maxsus huquqlar bor: rollarni o'zgartirish, yopilgan moliyaviy davrni qayta ochish, saytni chop etish. Kundalik ishni odatda boshqa rollar bajaradi, Ega esa qaror va nazorat darajasida ishlaydi.",
      steps: [
        "Kuningizni «Boshqaruv» sahifasidan boshlang: davomat, qarz va to'lov ko'rsatkichlari shu yerda jamlangan.",
        "Yangi xodim kelganda «Xodimlar» bo'limida foydalanuvchi yarating, keyin unga rol bering. Rolni tanlashda filial va guruh qamrovini ham belgilang.",
        "Rol huquqlarini «Rollar» bo'limidagi matritsadan o'zgartiring. O'zgartirish saqlanmaguncha kuchga kirmaydi — «Saqlash» tugmasini bosing.",
        "Oy yakunida hisobchi davrni yopadi. Agar yopilgan davrga tuzatish kerak bo'lsa, «Davrlar» bo'limidan qayta oching — buni faqat siz qila olasiz.",
        "Saytga kiritilgan o'zgarishlarni «Sayt» bo'limida ko'rib chiqing va «Chop etish» tugmasi bilan jonli saytga chiqaring.",
        "Shubhali o'zgarish bo'lsa «Audit» bo'limidan kim nima qilganini tekshiring.",
      ],
      cautions: [
        "Oxirgi Ega rolini o'zingizdan olib tashlay olmaysiz — tizim buni bloklaydi, aks holda hech kim rollarni boshqara olmay qoladi.",
        "Yopilgan davrni qayta ochish moliyaviy hisobotlarni o'zgartiradi. Sababni aniq yozing: u tarixda qoladi.",
        "Saytni chop etish natijasi darhol ochiq internetda ko'rinadi. Chop etishdan oldin bloklarni ko'rib chiqing.",
      ],
    },

    director: {
      summary:
        "Direktor — nazorat va qaror roli. Bolalar, guruhlar, xodimlar va hisobotlarni to'liq ko'radi, qarzlar va xarajatlar holatini kuzatadi, e'lonlarni boshqaradi. Kundalik ro'yxatga olishni odatda qabulxona va tarbiyachilar bajaradi.",
      steps: [
        "«Boshqaruv» sahifasidagi ko'rsatkichlarni ko'rib chiqing: bugungi davomat, ochiq qarzlar, kutilayotgan ishlar.",
        "«Davomat» bo'limida guruhlar bo'yicha holatni tekshiring. Yozib olinmagan bola — kelmagan bola EMAS: u shunchaki hali belgilanmagan.",
        "«Guruhlar» bo'limida sig'im va biriktirilgan xodimlarni nazorat qiling; kerak bo'lsa bolani boshqa guruhga o'tkazing.",
        "«Qarzlar» bo'limida muddati o'tgan qarzlarni ko'ring va kerak bo'lsa «E'lonlar» orqali ota-onalarga xabar bering.",
        "«Hisobotlar» bo'limida kerakli hisobotni tanlang, filtrlarni qo'ying va natijani ekranda ko'ring yoki XLSX/PDF ga yuklab oling.",
        "Xodimlar tarkibidagi o'zgarishlarni «Xodimlar» bo'limida bajaring; kim nima qilganini «Audit» dan tekshiring.",
      ],
      cautions: [
        "Musbat qarz qoldig'i har doim ham muddati o'tgan degani emas — «muddati o'tgan» ustunига qarang.",
        "Katta hisobot XLSX/PDF da darhol emas, navbat orqali tayyorlanishi mumkin. Sahifani almashtirsangiz ham jarayon davom etadi.",
        "Ko'rsatkich «—» bo'lsa, bu nol emas, ma'lumot yo'q yoki sizga ochiq emas degani.",
      ],
    },

    administrator: {
      summary:
        "Administrator — kundalik tashkiliy ish. Bolani qabul qilishdan guruhga biriktirishgacha, ota-onalar ma'lumotidan xodim hisoblarigacha shu rol olib boradi. Sayt kontenti va ma'lumot import qilish ham odatda shu rolda.",
      steps: [
        "Yangi bola: «Bolalar» → «Qo'shish». Bola avval «Nomzod» holatida yaratiladi.",
        "Ota-onani biriktiring: avval «Ota-onalar» bo'limida QIDIRING — u boshqa bola bilan allaqachon kiritilgan bo'lishi mumkin. Topilmasa yangisini yarating va bolaga bog'lang.",
        "«Guruhlar» bo'limida bolani guruhga biriktiring va biriktirish sanasini ko'rsating. Kelajakdagi sana qo'ysangiz, bola o'sha kungacha ro'yxatda paydo bo'lmaydi.",
        "Bola holatini «Faol» ga o'tkazing — shundan keyingina davomat belgilash mumkin bo'ladi.",
        "Hujjatlar va roziliklarni bola profilidagi tegishli bo'limlarga kiriting.",
        "Olib ketishga ruxsat berilgan shaxslarni bola profilidagi «Olib ketish» bo'limida qo'shing.",
        "Ko'p ma'lumotni birdan kiritish kerak bo'lsa «Import» bo'limidan foydalaning: shablonni yuklab oling, to'ldiring, tekshiruvdan o'tkazing, keyin tasdiqlang.",
      ],
      cautions: [
        "Qabul qilish bir nechta alohida qadamdan iborat. Yarim yo'lda to'xtab qolsangiz, keyin davom ettirish mumkin — boshidan boshlash shart emas.",
        "Ota-ona bilan qarindoshlik aloqasi — olib ketishga ruxsat EMAS. Olib ketish alohida ro'yxatdan boshqariladi.",
        "Guruh sig'imi to'lgan bo'lsa biriktirish rad etiladi. Boshqa guruh yoki boshqa sana tanlang.",
        "Import faylida xatolik bo'lsa, «xato satrlarni o'tkazib yuborish» tanlovini ongli qiling: o'tkazilgan satrlar keyin qo'lda kiritilishi kerak.",
      ],
    },

    accountant: {
      summary:
        "Hisobchi — pulga tegishli hamma narsa: tariflar va chegirmalar, oylik hisoblash, to'lovlar, qarzlar, xarajatlar va davrlarni yopish. Hisoblashni tizimning o'zi bajaradi, hisobchi esa natijani ko'rib chiqadi va tasdiqlaydi.",
      steps: [
        "Tarif va chegirmalarni «Tariflar» bo'limida boshqaring. Har bir biriktirish sanalar bilan chegaralanadi.",
        "Oy boshida «Davrlar» bo'limida kerakli davr borligiga ishonch hosil qiling yoki yangisini yarating.",
        "«Hisoblash» bo'limida oy va yilni tanlab oldindan ko'rishni ishga tushiring. Bu bosqichda hech qanday hisob yozilmaydi.",
        "Natijani ko'rib chiqing: umumiy summa, bolalar bo'yicha satrlar, ogohlantirishlar. Bitta bolaning summasi tushunarsiz bo'lsa, uning satrini ochib hisob-kitob izohini ko'ring.",
        "Hammasi to'g'ri bo'lsa «Tasdiqlash» tugmasini bosing — shundan keyingina hisoblar yoziladi.",
        "To'lov qabul qilish: «To'lovlar» → «Qo'shish». Bolani, summani, usulni va sanani kiriting. Taqsimotni qo'lda ko'rsatmasangiz, pul eng eski ochiq hisoblardan boshlab taqsimlanadi, ortgani esa oldindan to'lov bo'lib qoladi.",
        "Oy yakunida «Davrlar» bo'limidan davrni yoping — shundan keyin o'sha oyga moliyaviy yozuv kiritib bo'lmaydi.",
        "Xarajatlarni «Xarajatlar» bo'limida yuriting va to'langanini belgilang.",
      ],
      cautions: [
        "«Oldindan ko'rish» hisob yozmaydi. Faqat «Tasdiqlash» yozadi — bu ikkisini adashtirmang.",
        "Oldindan ko'rish eskirgan bo'lsa tasdiqlash rad etiladi. Bu xavfsizlik chorasi: qaytadan hisoblab, yangi natijani ko'rib chiqing.",
        "To'lov yuborilayotganda tarmoq uzilsa, qaytadan yubormang — avval ro'yxatni yangilang va to'lov o'tgan-o'tmaganini tekshiring. Aks holda ikkita yozuv paydo bo'lishi mumkin.",
        "To'lovni bekor qilish yoki hisobni qaytarish yozuvni O'CHIRMAYDI — daftarchada qarshi satr paydo bo'ladi. Shuning uchun sabab yozish majburiy.",
        "Yopilgan davrga o'zgartirish kiritib bo'lmaydi. Kerak bo'lsa Egadan davrni qayta ochishni so'rang.",
        "Xarajat to'lovi hozircha faqat to'liq summada belgilanadi — qisman to'lash imkoni yo'q.",
      ],
    },

    teacher: {
      summary:
        "Tarbiyachi — o'z guruhi bilan ishlaydi. Guruhidagi bolalar ro'yxatini ko'radi, davomatni belgilaydi va tibbiy ogohlantirishlardan xabardor bo'ladi. Boshqa guruhlar va moliyaviy ma'lumotlar unga ochiq emas.",
      steps: [
        "Ertalab «Davomat» bo'limini oching — guruhingizdagi barcha bolalar ro'yxati ko'rinadi.",
        "Kelgan bolani belgilang. Kelmagan bola uchun sababni tanlang: kasal, ta'tilda yoki sababli.",
        "Bolaning yonida tibbiy ogohlantirish belgisi bo'lsa, uni ochib o'qing — allergiya va cheklovlar shu yerda.",
        "Kun davomida «Ichkarida» bo'limidan hozir bog'chada turgan bolalar ro'yxatini ko'rishingiz mumkin.",
        "Bola haqida qo'shimcha ma'lumot kerak bo'lsa, «Bolalar» bo'limidan profilini oching.",
      ],
      cautions: [
        "Hali belgilanmagan bola «kelmagan» degani emas. Ro'yxatda belgilanmagan holat alohida ko'rsatiladi — kun oxirigacha hammasini belgilashga harakat qiling.",
        "O'tgan kunlarni o'zgartirish uchun alohida huquq kerak. Xato bo'lsa administrator yoki direktorga ayting.",
        "Siz faqat o'z guruhingizni ko'rasiz. Boshqa guruhdagi bola ro'yxatda chiqmasa — bu xato emas.",
      ],
    },

    reception: {
      summary:
        "Qabulxona — eshik oldidagi ish. Ertalab bolalarni qabul qiladi, kechqurun esa faqat ruxsat berilgan shaxsga topshiradi. Kunlik ish shu rolning asosiy mas'uliyati.",
      steps: [
        "Ertalab «Davomat» bo'limini oching va guruhni tanlang yoki bolani ism bo'yicha qidiring.",
        "Bola kelganda uni belgilang. Belgilash darhol ro'yxatda va hisoblagichlarda aks etadi.",
        "Kechqurun bolani topshirishdan oldin «Olib ketish» bo'limida tekshiruvdan o'tkazing: bolani va kelgan shaxsni tanlang.",
        "Ekranda shaxsning ismi, surati va RUXSAT BOR/RUXSAT YO'Q natijasi chiqadi. Faqat «ruxsat bor» bo'lsagina topshiring.",
        "Tasdiqlagandan keyin chiqishni belgilang. Server qayta tekshiradi va faqat muvaffaqiyatli javobdan keyin bola chiqqan hisoblanadi.",
        "Ro'yxatda bo'lmagan shaxs kelsa, vaqtinchalik ruxsat rasmiylashtirilishi kerak — buni administrator yoki sizda huquq bo'lsa o'zingiz kiritasiz.",
        "Kun oxirida «Ichkarida» bo'limidan hali olib ketilmagan bolalar qolmaganini tekshiring.",
      ],
      cautions: [
        "Qarindoshlik aloqasining o'zi olib ketishga ruxsat bermaydi. Faqat olib ketish ro'yxatidagi yoki vaqtinchalik ruxsati bor shaxsga topshiring.",
        "Ruxsat muddati tugagan yoki bekor qilingan bo'lsa, tizim chiqishni bloklaydi. Bu qarorni chetlab o'tmang — direktorga murojaat qiling.",
        "Chiqish serverdan tasdiq kelmaguncha «bajarildi» hisoblanmaydi. Ekranda kutish belgisi turgan bo'lsa, bolani hali topshirmang.",
        "Bola allaqachon belgilangan bo'lsa va tizim «kelgan» desa, ro'yxatni yangilang — ehtimol hamkasbingiz belgilab ulgurgan.",
      ],
    },

    nurse: {
      summary:
        "Hamshira — bolalarning tibbiy ma'lumotlari uchun javob beradi: kasallik tarixi, allergiyalar, ogohlantirishlar va tibbiy roziliklar. Bu ma'lumot alohida himoyalangan va hammaga ko'rinmaydi.",
      steps: [
        "«Bolalar» bo'limidan kerakli bolani toping va profilini oching.",
        "«Tibbiy» bo'limida kasallik tarixi, allergiyalar va cheklovlarni kiriting yoki yangilang.",
        "Og'ir allergiya yoki doimiy cheklov bo'lsa, uni ogohlantirish sifatida belgilang — shunda tarbiyachi va qabulxona ro'yxatda darhol ko'radi.",
        "Tibbiy hujjatlarni bola profilidagi hujjatlar bo'limiga yuklang va muddatini ko'rsating.",
        "Roziliklarni rasmiylashtiring; ota-ona rozilikni qaytarib olsa, uni bekor qilingan deb belgilang.",
        "Muddati tugayotgan tibbiy ma'lumotnomalarni kuzatib boring va ota-onalarni ogohlantirishni so'rang.",
      ],
      cautions: [
        "Tibbiy yozuv va tibbiy OGOHLANTIRISH — ikki boshqa narsa. Ogohlantirish qisqa va keng ko'rinadi, to'liq yozuv esa faqat sizga o'xshash huquqi bor xodimga ochiladi.",
        "Bolani ko'rish huquqi tibbiy ma'lumotni ko'rish huquqini bermaydi. Shuning uchun ogohlantirishga faqat zarur eng qisqa ma'lumotni yozing.",
        "Rozilik bekor qilinsa, u o'chmaydi — bekor qilingan deb belgilanadi va tarixda qoladi.",
      ],
    },
  },
};
