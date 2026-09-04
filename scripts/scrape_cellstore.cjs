const fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Credenciales
const EMAIL = process.argv[2] || process.env.CELLSTORE_EMAIL || 'javier.mecho@gmail.com';
const PASS = process.argv[3] || process.env.CELLSTORE_PASS || 'Usx31156762';

const CATEGORIES_TO_SCRAPE = [
  { url: 'productos/repuestos/modulos', type: 'modulo', name: 'Módulos' },
  { url: 'productos/repuestos/baterias', type: 'bateria', name: 'Baterías' },
  { url: 'productos/repuestos/placas-de-carga', type: 'placa_carga', name: 'Placas de Carga' },
  { url: 'productos/repuestos/pin-de-carga', type: 'pin_carga', name: 'Pines de Carga' },
  { url: 'productos/repuestos/tapas', type: 'tapa', name: 'Tapas Traseras' },
  { url: 'productos/repuestos/camaras', type: 'camara', name: 'Cámaras' },
  { url: 'productos/repuestos/lentes-de-camara', type: 'lente_camara', name: 'Lentes de Cámara' },
  { url: 'productos/repuestos/flex', type: 'flex', name: 'Flex' }
];

function detectBrand(name) {
  const u = name.toUpperCase();
  if (u.includes('IPHONE') || u.includes('APPLE') || u.includes('IPAD')) return 'Apple';
  if (u.includes('SAMSUNG') || u.includes('GALAXY') || /\bSM-[A-Z0-9]+/i.test(u)) return 'Samsung';
  if (u.includes('MOTO') || u.includes('MOTOROLA')) return 'Motorola';
  if (u.includes('XIAOMI') || u.includes('REDMI') || u.includes('POCO')) return 'Xiaomi';
  if (u.includes('TECNO')) return 'Tecno';
  if (u.includes('INFINIX')) return 'Infinix';
  if (u.includes('TCL')) return 'TCL';
  if (u.includes('ZTE') || u.includes('BLADE')) return 'ZTE';
  if (u.includes('LG')) return 'LG';
  if (u.includes('NOKIA')) return 'Nokia';
  return 'Otros';
}

async function loginCellstore() {
  console.log('1. Obteniendo sesión inicial en CellStore MDP...');
  const initRes = await fetch('https://cellstoremdp.com.ar/login', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  const rawInit = initRes.headers.getSetCookie ? initRes.headers.getSetCookie() : [initRes.headers.get('set-cookie')];
  const initialCookies = (rawInit || []).map(c => c.split(';')[0]).join('; ');

  console.log('2. Autenticando con credenciales...');
  const formData = new URLSearchParams();
  formData.append('ingreso-cliente', '1');
  formData.append('g-recaptcha-response', '');
  formData.append('login_mail', EMAIL);
  formData.append('login_pass', PASS);

  const loginRes = await fetch('https://cellstoremdp.com.ar/carrito/acciones_carrito.php', {
    method: 'POST',
    headers: {
      'Cookie': initialCookies,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://cellstoremdp.com.ar/login'
    },
    body: formData.toString()
  });

  const rawLogin = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie')];
  const cookieMap = {};
  [...initialCookies.split('; '), ...(rawLogin || []).map(c => c.split(';')[0])].forEach(c => {
    const [k, v] = c.split('=');
    if (k && v) cookieMap[k.trim()] = v.trim();
  });
  const authCookie = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; ');
  console.log('[OK] Sesión iniciada con éxito en CellStore para:', EMAIL);
  return authCookie;
}

async function scrapeCategory(cat, authCookie) {
  try {
    const fullUrl = `https://cellstoremdp.com.ar/${cat.url}`;
    const pageRes = await fetch(fullUrl, {
      headers: { 'Cookie': authCookie, 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://cellstoremdp.com.ar/' }
    });

    const pageHtml = await pageRes.text();
    const match = pageHtml.match(/__filtros_bucle"\s*:\s*"([^"]+)"/i);
    if (!match) {
      console.warn(`[!] No se encontraron filtros_bucle para ${cat.url}`);
      return [];
    }

    const filtrosBucle = match[1];

    const ajaxForm = new URLSearchParams();
    ajaxForm.append('carga-por-ajax', '1');
    ajaxForm.append('__filtros_bucle', filtrosBucle);
    ajaxForm.append('listado_inicio', '0');
    ajaxForm.append('listado_cantidad', '1000');
    ajaxForm.append('__vista_productos', 'mosaico');
    ajaxForm.append('__orden_productos', 'predt');

    const ajaxRes = await fetch('https://cellstoremdp.com.ar/cargar_productos.php', {
      method: 'POST',
      headers: {
        'Cookie': authCookie,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0',
        'Referer': fullUrl
      },
      body: ajaxForm.toString()
    });

    const ajaxHtml = await ajaxRes.text();
    const rawCards = ajaxHtml.split(/(?=<div class="col-6)/gi).filter(c => c.includes('carta-producto') || c.includes('producto'));
    const items = [];
    const seen = new Set();

    for (const card of rawCards) {
      const cleanCard = card.replace(/<style>[\s\S]*?<\/style>/gi, '');

      const nameMatch = cleanCard.match(/itemprop="name" content="([^"]+)"/i) || cleanCard.match(/class="descripcion-producto[^>]*><span>([\s\S]*?)<\/span>/i);
      const skuMatch = cleanCard.match(/itemprop="sku" content="([^"]+)"/i);
      const priceMatch = cleanCard.match(/itemprop="price" content="([^"]+)"/i) || cleanCard.match(/\$\s*([\d\.\,]+)/i);
      const urlMatch = cleanCard.match(/itemprop="url" content="([^"]+)"/i) || cleanCard.match(/href="(producto\/[^"]+)"/i);

      // Stock
      const hasBuyButton = cleanCard.includes('carrito-comprar-producto');
      const badgeMatch = cleanCard.match(/<span class="badge [^"]*">([^<]*)<\/span>/i);
      const badgeText = badgeMatch ? badgeMatch[1].toLowerCase().trim() : '';

      const isAgotado = badgeText.includes('sin stock') || badgeText.includes('agotado') || !hasBuyButton;
      const inStock = !isAgotado;

      if (nameMatch && priceMatch) {
        let strPrice = priceMatch[1].trim();
        let rawPrice = 0;
        if (strPrice.includes(',')) {
          rawPrice = parseFloat(strPrice.replace(/\./g, '').replace(',', '.'));
        } else {
          rawPrice = parseFloat(strPrice);
        }

        const rawName = nameMatch[1].replace(/<[^>]+>/g, '').trim();
        const sku = skuMatch ? skuMatch[1].trim() : '';
        const itemUrl = urlMatch ? (urlMatch[1].startsWith('http') ? urlMatch[1] : `https://cellstoremdp.com.ar/${urlMatch[1].replace(/^\//, '')}`) : '';

        if (rawPrice > 0 && !seen.has(sku || rawName)) {
          seen.add(sku || rawName);
          items.push({
            name: rawName,
            sku: sku,
            brand: detectBrand(rawName),
            part_type: cat.type,
            price_lista_ars: rawPrice,
            // En CellStore el precio neto sin impuestos viene visible en el texto o es aprox / 1.21
            price_cash_ars: Math.round(rawPrice / 1.21),
            in_stock: inStock,
            stock_level: badgeText || (inStock ? 'disponible' : 'sin stock'),
            url: itemUrl
          });
        }
      }
    }

    console.log(`[OK] ${cat.name}: ${items.length} repuestos extraídos.`);
    return items;
  } catch (err) {
    console.error(`[ERR] Error en categoría ${cat.name}:`, err.message);
    return [];
  }
}

async function run() {
  console.log('Iniciando extracción completa de CellStore MDP (cellstoremdp.com.ar)...\n');
  const authCookie = await loginCellstore();

  const allParts = [];
  for (const cat of CATEGORIES_TO_SCRAPE) {
    const parts = await scrapeCategory(cat, authCookie);
    allParts.push(...parts);
    await new Promise(r => setTimeout(r, 400));
  }

  // Eliminar duplicados globales
  const uniqueParts = [];
  const seenGlobal = new Set();
  allParts.forEach(p => {
    const key = p.sku || p.name;
    if (!seenGlobal.has(key)) {
      seenGlobal.add(key);
      uniqueParts.push(p);
    }
  });

  const inStockCount = uniqueParts.filter(p => p.in_stock).length;
  console.log(`\n==============================================`);
  console.log(`TOTAL DE REPUESTOS CELLSTORE MDP: ${uniqueParts.length}`);
  console.log(`En Stock Real: ${inStockCount} | Sin Stock: ${uniqueParts.length - inStockCount}`);
  console.log(`==============================================`);

  const summary = {};
  uniqueParts.forEach(p => {
    const key = `${p.brand} (${p.part_type})`;
    summary[key] = (summary[key] || 0) + 1;
  });
  console.log('Resumen:', summary);

  const outputData = {
    provider: 'CellStore MDP (cellstoremdp.com.ar)',
    extracted_at: new Date().toISOString(),
    total_parts: uniqueParts.length,
    in_stock_parts: inStockCount,
    parts: uniqueParts
  };

  fs.writeFileSync('cellstore_repuestos.json', JSON.stringify(outputData, null, 2));
  fs.writeFileSync('src/data/cellstoreParts.json', JSON.stringify(outputData, null, 2));

  const jsContent = `// Catálogo importado de repuestos de CellStore MDP (cellstoremdp.com.ar)
// Generado automáticamente el ${new Date().toLocaleString('es-AR')}

export const CELLSTORE_PARTS_INFO = {
  provider: ${JSON.stringify(outputData.provider)},
  extracted_at: ${JSON.stringify(outputData.extracted_at)},
  total_parts: ${outputData.total_parts},
  in_stock_parts: ${outputData.in_stock_parts}
};

export const CELLSTORE_PARTS = ${JSON.stringify(uniqueParts, null, 2)};
`;

  fs.writeFileSync('src/data/cellstoreParts.js', jsContent);
  console.log('\nArchivos guardados con éxito:');
  console.log(' - cellstore_repuestos.json');
  console.log(' - src/data/cellstoreParts.json');
  console.log(' - src/data/cellstoreParts.js');
}

run().catch(console.error);
