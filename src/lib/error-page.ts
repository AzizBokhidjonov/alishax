/**
 * SSR butunlay ishlamay qolganda qaytariladigan zaxira sahifa.
 *
 * Bu yerda ranglar ataylab qotirilgan: sahifa ilova CSS'i yuklanmagan
 * holatda ham ko'rinishi kerak, shuning uchun --st-* yoki brend
 * tokenlariga tayanib bo'lmaydi.
 */
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="uz">
  <head>
    <meta charset="utf-8" />
    <title>Sahifa yuklanmadi — Alishax Kids</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 Montserrat, system-ui, -apple-system, sans-serif; background: #fffdf7; color: #211964; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #67697c; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.5rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      a:focus-visible, button:focus-visible { outline: 2px solid #211964; outline-offset: 2px; }
      .primary { background: #211964; color: #fffdf7; }
      .secondary { background: #fff; color: #211964; border-color: #9c9283; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Sahifa yuklanmadi</h1>
      <p>Kutilmagan xatolik yuz berdi. Sahifani yangilang yoki bosh sahifaga qayting.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Qayta urinish</button>
        <a class="secondary" href="/">Bosh sahifaga</a>
      </div>
    </div>
  </body>
</html>`;
}
