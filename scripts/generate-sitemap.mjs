// Запускается после `vite build`: создаёт dist/sitemap.xml и отдельные HTML-страницы
// для каталога и товаров (с нормальным статусом 200 и своими title/description),
// чтобы поисковики их индексировали. GitHub Pages отдаёт 404.html со статусом 404.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const SITE = (process.env.SITE_URL || 'https://www.whicedgt.dpdns.org').replace(/\/$/, '')
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yyqnyjntbvzhxontepfg.supabase.co'
const KEY = process.env.VITE_SUPABASE_ANON_KEY || ''
const DIST = 'dist'

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function fetchProducts() {
  if (!KEY) {
    console.warn('[sitemap] нет VITE_SUPABASE_ANON_KEY — товары в sitemap не попадут')
    return []
  }
  const url =
    `${SUPABASE_URL}/rest/v1/products?select=id,title,price,description,created_at,product_photos(url,position)` +
    `&published=eq.true&order=created_at.desc&limit=5000`
  try {
    const res = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.warn('[sitemap] не удалось получить товары:', e.message)
    return []
  }
}

function withMeta(html, { title, description, path, image }) {
  const url = SITE + path
  let out = html
    .replace(/<title>.*?<\/title>/s, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`)
  if (image) {
    out = out.replace('</head>', `    <meta property="og:image" content="${esc(image)}" />\n  </head>`)
    out = out.replace('content="summary"', 'content="summary_large_image"')
  }
  return out
}

async function writePage(path, html) {
  const file = join(DIST, path, 'index.html')
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, html)
}

const base = await readFile(join(DIST, 'index.html'), 'utf8')
const products = await fetchProducts()

const urls = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/catalog', priority: '0.9', changefreq: 'daily' },
  { loc: '/seller', priority: '0.5', changefreq: 'monthly' },
]

await writePage(
  'catalog',
  withMeta(base, {
    title: 'Каталог одежды — Nalichie',
    description: 'Каталог одежды и обуви в магазинах вашего города: цены, размеры, адреса. Пишите продавцу в MAX.',
    path: '/catalog',
  })
)
await writePage(
  'seller',
  withMeta(base, {
    title: 'Открыть магазин — Nalichie',
    description: 'Выложите одежду в каталог за минуту — покупатели рядом найдут вас.',
    path: '/seller',
  })
)

for (const p of products) {
  const price = new Intl.NumberFormat('ru-RU').format(p.price)
  const photo = [...(p.product_photos ?? [])].sort((a, b) => a.position - b.position)[0]?.url
  const desc = (p.description || `${p.title} — ${price} ₽. Узнайте наличие и размеры в магазинах рядом.`)
    .replace(/\s+/g, ' ')
    .slice(0, 160)
  await writePage(
    `product/${p.id}`,
    withMeta(base, { title: `${p.title} — ${price} ₽ | Nalichie`, description: desc, path: `/product/${p.id}`, image: photo })
  )
  urls.push({ loc: `/product/${p.id}`, lastmod: (p.created_at || '').slice(0, 10), priority: '0.7' })
}

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map(
      (u) =>
        `  <url><loc>${SITE}${u.loc}</loc>` +
        (u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '') +
        (u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : '') +
        `<priority>${u.priority}</priority></url>`
    )
    .join('\n') +
  `\n</urlset>\n`
await writeFile(join(DIST, 'sitemap.xml'), xml)
console.log(`[sitemap] ${urls.length} URL, товаров: ${products.length}`)
