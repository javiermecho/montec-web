const fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Credenciales
const EMAIL = process.argv[2] || process.env.ARMAR_EMAIL || 'movilzonemdp1@gmail.com';
const PASS = process.argv[3] || process.env.ARMAR_PASS || '2233036088';

const CATEGORIES_TO_SCRAPE = [
  { id: 819, type: 'modulo', name: 'Módulos' },
  { id: 824, type: 'bateria', name: 'Baterías' },
  { id: 1593, type: 'bateria', name: 'Baterías 2' },
  { id: 820, type: 'placa_carga', name: 'Placas de Carga' },
  { id: 878, type: 'pin_carga', name: 'Pines de Carga' },
  { id: 1166, type: 'pin_carga', name: 'Pines de Carga 2' },
  { id: 854, type: 'camara', name: 'Cámaras' },
  { id: 866, type: 'lente_camara', name: 'Lentes de Cámara' },
  { id: 865, type: 'flex', name: 'Flex de Carga' },
  { id: 821, type: 'flex', name: 'Flex de Power' },
  { id: 879, type: 'flex', name: 'Flex Interconexión' }
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

async function loginArmar() {
  console.log('1. Autenticando en Grupo Armar...');
  const getRes = await fetch('https://grupoarmar.com.ar/ingresar', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });

  const rawCookies = getRes.headers.getSetCookie ? getRes.headers.getSetCookie() : [getRes.headers.get('set-cookie')];
  const initialCookies = (rawCookies || []).map(c => c.split(';')[0]).join('; ');
  const getHtml = await getRes.text();
  const tokenMatch = getHtml.match(/<input[^>]*name="_token"[^>]*value="([^"]+)"/i);
  if (!tokenMatch) throw new Error('No se encontró _token CSRF');
  const token = tokenMatch[1];

  const formData = new URLSearchParams();
  formData.append('_token', token);
  formData.append('email', EMAIL);
  formData.append('pass', PASS);

  const loginRes = await fetch('https://grupoarmar.com.ar/login', {
    method: 'POST',
    headers: {
      'Cookie': initialCookies,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://grupoarmar.com.ar/ingresar',
      'Origin': 'https://grupoarmar.com.ar'
    },
    body: formData.toString(),
    redirect: 'manual'
  });

  const loginSetCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie')];
  const cookieMap = {};
  [...initialCookies.split('; '), ...(loginSetCookies || []).map(c => c.split(';')[0])].forEach(c => {
    const [k, v] = c.split('=');
    if (k && v) cookieMap[k.trim()] = v.trim();
  });

  const authCookies = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; ');
  console.log('[OK] Sesión iniciada con éxito para:', EMAIL);
  return authCookies;
}

async function scrapeCategory(cat, authCookies) {
  try {
    const url = `https://grupoarmar.com.ar/categoria/${cat.id}`;
    const res = await fetch(url, {
      headers: {
        'Cookie': authCookies,
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://grupoarmar.com.ar/'
      }
    });

    const html = await res.text();
    const productWraps = [...html.matchAll(/<div[^>]*class=["'][^"']*single-product-wrap[^"']*["'][\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi)].map(m => m[0]);

    const items = [];
    const seen = new Set();

    for (const wrap of productWraps) {
      const nameMatch = wrap.match(/class="product_name"[^>]*>([\s\S]*?)<\/a>/i);
      const urlMatch = wrap.match(/href="(\/tienda\/articulo\/\d+)"/i);
      const priceMatch = wrap.match(/class="new-price"[^>]*>\$?\s*([\d\.\,]+)/i);
      const stockMatch = wrap.match(/class="product-details-ref"[^>]*>Stock:\s*<span class="([^"]*)">([^<]*)<\/span>/i);

      if (nameMatch && priceMatch) {
        const rawName = nameMatch[1].replace(/<[^>]+>/g, '').trim();
        const artUrl = urlMatch ? `https://grupoarmar.com.ar${urlMatch[1]}` : '';
        const skuMatch = artUrl.match(/\/(\d+)$/);
        const sku = skuMatch ? skuMatch[1] : '';

        // Precio
        const strPrice = priceMatch[1].trim();
        const price = parseFloat(strPrice.replace(/\./g, '').replace(',', '.'));

        // Stock
        const stockClass = stockMatch ? stockMatch[1].toLowerCase() : '';
        const inStock = stockClass.includes('disponible') && !stockClass.includes('no');

        const DOLAR_VENTA_REF = 1545;
        const priceUsd = price;
        const priceArs = Math.round(priceUsd * DOLAR_VENTA_REF);

        if (price > 0 && !seen.has(sku || rawName)) {
          seen.add(sku || rawName);
          items.push({
            name: rawName,
            sku: sku,
            brand: detectBrand(rawName),
            part_type: cat.type,
            price_usd: priceUsd,
            price_lista_ars: priceArs,
            price_cash_ars: priceArs, // Grupo Armar cotiza en USD, convertido a ARS con dolar venta ref
            in_stock: inStock,
            url: artUrl
          });
        }
      }
    }

    console.log(`[OK] ${cat.name} (/categoria/${cat.id}): ${items.length} repuestos extraídos.`);
    return items;
  } catch (err) {
    console.error(`[ERR] Error en categoría ${cat.id}:`, err.message);
    return [];
  }
}

async function run() {
  console.log('Iniciando extracción completa de Grupo Armar (grupoarmar.com.ar)...\n');
  const authCookies = await loginArmar();

  const allParts = [];
  for (const cat of CATEGORIES_TO_SCRAPE) {
    const parts = await scrapeCategory(cat, authCookies);
    allParts.push(...parts);
    await new Promise(r => setTimeout(r, 400));
  }

  // Eliminar duplicados globales por SKU
  const uniqueParts = [];
  const seenGlobal = new Set();
  allParts.forEach(p => {
    const key = p.sku || p.name;
    if (!seenGlobal.has(key)) {
      seenGlobal.add(key);
      uniqueParts.push(p);
    }
  });

  console.log(`\n==============================================`);
  console.log(`TOTAL DE REPUESTOS DE GRUPO ARMAR: ${uniqueParts.length}`);
  const inStockCount = uniqueParts.filter(p => p.in_stock).length;
  console.log(`En Stock: ${inStockCount} | Sin Stock: ${uniqueParts.length - inStockCount}`);
  console.log(`==============================================`);

  const summary = {};
  uniqueParts.forEach(p => {
    const key = `${p.brand} (${p.part_type})`;
    summary[key] = (summary[key] || 0) + 1;
  });
  console.log('Resumen:', summary);

  const outputData = {
    provider: 'Grupo Armar (grupoarmar.com.ar)',
    extracted_at: new Date().toISOString(),
    total_parts: uniqueParts.length,
    in_stock_parts: inStockCount,
    parts: uniqueParts
  };

  fs.writeFileSync('grupoarmar_repuestos.json', JSON.stringify(outputData, null, 2));
  fs.writeFileSync('src/data/grupoarmarParts.json', JSON.stringify(outputData, null, 2));

  const jsContent = `// Catálogo importado de repuestos de Grupo Armar (grupoarmar.com.ar)
// Generado automáticamente el ${new Date().toLocaleString('es-AR')}

export const GRUPOARMAR_PARTS_INFO = {
  provider: ${JSON.stringify(outputData.provider)},
  extracted_at: ${JSON.stringify(outputData.extracted_at)},
  total_parts: ${outputData.total_parts},
  in_stock_parts: ${outputData.in_stock_parts}
};

export const GRUPOARMAR_PARTS = ${JSON.stringify(uniqueParts, null, 2)};
`;

  fs.writeFileSync('src/data/grupoarmarParts.js', jsContent);
  console.log('\nArchivos guardados con éxito:');
  console.log(' - grupoarmar_repuestos.json');
  console.log(' - src/data/grupoarmarParts.json');
  console.log(' - src/data/grupoarmarParts.js');
}

run().catch(console.error);
