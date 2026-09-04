const https = require('https');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

function decodeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '-')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#0*(\d+);/g, (_, code) => String.fromCharCode(code))
    .replace(/\s+/g, ' ')
    .trim();
}

function detectBrand(name, categories = []) {
  const text = (name + ' ' + categories.map(c => c.name).join(' ')).toUpperCase();
  if (text.includes('IPHONE') || text.includes('APPLE') || text.includes('IPAD') || text.includes('WATCH') || text.includes('MACBOOK')) return 'Apple';
  if (text.includes('SAMSUNG') || text.includes('GALAXY')) return 'Samsung';
  if (text.includes('MOTOROLA') || text.includes('MOTO ')) return 'Motorola';
  if (text.includes('XIAOMI') || text.includes('REDMI') || text.includes('POCO')) return 'Xiaomi';
  if (text.includes('HUAWEI') || text.includes('HONOR')) return 'Huawei';
  if (text.includes('LG')) return 'LG';
  if (text.includes('ALCATEL') || text.includes('TCL')) return 'TCL / Alcatel';
  if (text.includes('ZTE')) return 'ZTE';
  if (text.includes('TECNO')) return 'Tecno';
  if (text.includes('INFINIX')) return 'Infinix';
  if (text.includes('SONY')) return 'Sony';
  if (text.includes('NOKIA')) return 'Nokia';
  return 'Genérico / Multimarca';
}

function detectPartType(name, categories = []) {
  const upper = (name + ' ' + categories.map(c => c.name).join(' ')).toUpperCase();
  if (upper.includes('MODULO') || upper.includes('PANTALLA') || upper.includes('DISPLAY')) return 'modulo';
  if (upper.includes('BATERIA') || upper.includes('BATTERIA')) return 'bateria';
  if (upper.includes('PLACA DE CARGA') || upper.includes('SUBPLACA')) return 'placa_carga';
  if (upper.includes('PIN DE CARGA') || upper.includes('PIN CARGA') || upper.includes('CONECTOR DE CARGA')) return 'pin_carga';
  if (upper.includes('TAPA')) return 'tapa';
  if (upper.includes('CAMARA') || upper.includes('CÁMARA')) return 'camara';
  if (upper.includes('LENTE') || upper.includes('VIDRIO CAMARA')) return 'vidrio_camara';
  if (upper.includes('FLEX')) return 'flex';
  if (upper.includes('GLASS') || upper.includes('OCA')) return 'glass';
  if (upper.includes('SPEAKER') || upper.includes('AURICULAR') || upper.includes('PARLANTE') || upper.includes('BUZZER')) return 'parlante';
  return 'repuesto';
}

function requestPromise(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Timeout requesting ${url}`));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function scrapeSoulfix() {
  console.log('--- Iniciando Scraping de SoulFix (soulfix.com.ar) ---');
  
  // 1. Login
  console.log('1. Autenticando con javier.mecho@gmail.com...');
  const loginData = querystring.stringify({
    log: 'javier.mecho@gmail.com',
    pwd: 'Usx31156762',
    'wp-submit': 'Acceder',
    redirect_to: 'https://soulfix.com.ar/mi-cuenta/',
    testcookie: '1'
  });

  const loginRes = await requestPromise('https://soulfix.com.ar/wp-login.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(loginData),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Cookie': 'wordpress_test_cookie=WP%20Cookie%20check'
    }
  }, loginData);

  const cookies = (loginRes.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
  console.log('Sesión iniciada con éxito. Cookies:', cookies ? 'OK' : 'No set');

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
    'Accept': 'application/json',
    ...(cookies ? { 'Cookie': cookies } : {})
  };

  // 2. Obtener primera página y total de páginas
  console.log('2. Consultando total de productos y páginas...');
  const page1Res = await requestPromise('https://soulfix.com.ar/wp-json/wc/store/v1/products?per_page=100&page=1', { headers });
  const totalProducts = parseInt(page1Res.headers['x-wp-total'] || '0', 10);
  const totalPages = parseInt(page1Res.headers['x-wp-totalpages'] || '1', 10);

  console.log(`Catálogo SoulFix: ${totalProducts} productos en ${totalPages} páginas.`);

  let rawProducts = [];
  try {
    rawProducts.push(...JSON.parse(page1Res.data));
  } catch (e) {
    console.error('Error parseando página 1:', e.message);
  }

  // 3. Iterar páginas 2 a totalPages
  for (let page = 2; page <= totalPages; page++) {
    process.stdout.write(`Descargando página ${page}/${totalPages}... `);
    try {
      const pageRes = await requestPromise(`https://soulfix.com.ar/wp-json/wc/store/v1/products?per_page=100&page=${page}`, { headers });
      const pageProducts = JSON.parse(pageRes.data);
      rawProducts.push(...pageProducts);
      console.log(`OK (${pageProducts.length} items. Total: ${rawProducts.length})`);
    } catch (err) {
      console.log(`Error: ${err.message}. Reintentando...`);
      try {
        await new Promise(r => setTimeout(r, 2000));
        const retryRes = await requestPromise(`https://soulfix.com.ar/wp-json/wc/store/v1/products?per_page=100&page=${page}`, { headers });
        const retryProducts = JSON.parse(retryRes.data);
        rawProducts.push(...retryProducts);
        console.log(`Reintento OK (${retryProducts.length} items)`);
      } catch (err2) {
        console.error(`Fallo reintento página ${page}:`, err2.message);
      }
    }
  }

  console.log(`\n4. Procesando y normalizando ${rawProducts.length} productos de SoulFix...`);

  const processedParts = rawProducts.map(p => {
    const cleanName = decodeHtml(p.name);
    const brand = detectBrand(cleanName, p.categories);
    const partType = detectPartType(cleanName, p.categories);
    
    // Precios
    let rawPrice = 0;
    if (p.prices && p.prices.price) {
      rawPrice = parseFloat(p.prices.price) || 0;
    }
    // Si la moneda trae decimales o centavos:
    if (p.prices && p.prices.currency_minor_unit && p.prices.currency_minor_unit > 0) {
      // algunos endpoints devuelven precio en centavos si minor_unit = 2
      // pero en nuestro test vimos: price: '360678', currency_minor_unit: 0 (es decir pesos directos)
    }

    const priceCashArs = Math.round(rawPrice);
    const priceListaArs = p.prices && p.prices.regular_price ? Math.round(parseFloat(p.prices.regular_price)) : priceCashArs;

    return {
      name: cleanName,
      sku: p.sku || `SF-${p.id}`,
      brand: brand,
      part_type: partType,
      price_lista_ars: priceListaArs,
      price_cash_ars: priceCashArs,
      in_stock: Boolean(p.is_in_stock),
      url: p.permalink || `https://soulfix.com.ar/?p=${p.id}`,
      categories: (p.categories || []).map(c => decodeHtml(c.name))
    };
  });

  const inStockCount = processedParts.filter(p => p.in_stock).length;
  console.log(`Procesados ${processedParts.length} repuestos. En stock: ${inStockCount}.`);

  const infoObj = {
    provider: 'SoulFix (soulfix.com.ar)',
    extracted_at: new Date().toISOString(),
    total_parts: processedParts.length,
    in_stock_parts: inStockCount,
    currency: 'ARS'
  };

  // Guardar JSON
  const jsonPath = path.join(__dirname, '..', 'src', 'data', 'soulfixParts.json');
  fs.writeFileSync(jsonPath, JSON.stringify(processedParts, null, 2), 'utf-8');
  console.log(`Archivo JSON guardado en: ${jsonPath}`);

  // Guardar JS
  const jsPath = path.join(__dirname, '..', 'src', 'data', 'soulfixParts.js');
  const jsContent = `// Catálogo importado de repuestos de SoulFix (soulfix.com.ar)
// Total repuestos: ${processedParts.length} (En stock: ${inStockCount})
// Extraído el: ${infoObj.extracted_at}

export const SOULFIX_PARTS_INFO = ${JSON.stringify(infoObj, null, 2)};

export const SOULFIX_PARTS = ${JSON.stringify(processedParts, null, 2)};
`;
  fs.writeFileSync(jsPath, jsContent, 'utf-8');
  console.log(`Archivo JS guardado en: ${jsPath}`);
  console.log('--- Scraping de SoulFix finalizado con éxito ---');
}

scrapeSoulfix().catch(err => {
  console.error('Error fatal en scraping:', err);
  process.exit(1);
});
