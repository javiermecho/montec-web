const fs = require('fs');

// Tomar PHPSESSID desde argumento CLI, env o el valor por defecto
const sessidArg = process.argv[2] || process.env.SMARTSUPPLY_PHPSESSID || '0g35n4gpck5p0l4amurk9lk054';
const cookie = sessidArg.startsWith('PHPSESSID=') ? sessidArg : `PHPSESSID=${sessidArg}`;

// Lista de rutas de categorías relevantes a scrapear
const CATEGORIES_TO_SCRAPE = [
  // iPhone
  { brand: 'Apple', type: 'modulo', url: '/productos/repuestos/iphone/modulos' },
  { brand: 'Apple', type: 'bateria', url: '/productos/repuestos/iphone/baterias' },
  { brand: 'Apple', type: 'flex', url: '/productos/repuestos/iphone/flex' },
  
  // Samsung
  { brand: 'Samsung', type: 'modulo', url: '/productos/repuestos/samsung/modulos' },
  { brand: 'Samsung', type: 'bateria', url: '/productos/repuestos/samsung/baterias' },
  { brand: 'Samsung', type: 'placa_carga', url: '/productos/repuestos/samsung/placas-de-carga' },
  { brand: 'Samsung', type: 'tapa', url: '/productos/repuestos/samsung/tapas' },
  { brand: 'Samsung', type: 'camara', url: '/productos/repuestos/samsung/camaras' },

  // Motorola
  { brand: 'Motorola', type: 'modulo', url: '/productos/repuestos/motorola/modulos' },
  { brand: 'Motorola', type: 'bateria', url: '/productos/repuestos/motorola/baterias' },
  { brand: 'Motorola', type: 'placa_carga', url: '/productos/repuestos/motorola/placas-de-carga' },
  { brand: 'Motorola', type: 'tapa', url: '/productos/repuestos/motorola/tapas' },

  // Xiaomi
  { brand: 'Xiaomi', type: 'modulo', url: '/productos/repuestos/xiaomi/modulos' },
  { brand: 'Xiaomi', type: 'bateria', url: '/productos/repuestos/xiaomi/baterias' },
  { brand: 'Xiaomi', type: 'placa_carga', url: '/productos/repuestos/xiaomi/placas-de-carga' },
  { brand: 'Xiaomi', type: 'tapa', url: '/productos/repuestos/xiaomi/tapas' }
];

async function scrapeCategory(cat) {
  try {
    const fullUrl = `https://smartsupply.com.ar${cat.url}`;
    const pageRes = await fetch(fullUrl, {
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://smartsupply.com.ar/'
      }
    });

    const html = await pageRes.text();
    const match = html.match(/__filtros_bucle"\s*:\s*"([^"]+)"/i);
    if (!match) {
      console.warn(`[!] No se encontraron filtros_bucle para ${cat.url}`);
      return [];
    }

    const filtrosBucle = match[1];

    // Cargar productos por AJAX (hasta 500 por categoría)
    const formData = new URLSearchParams();
    formData.append('carga-por-ajax', '1');
    formData.append('__filtros_bucle', filtrosBucle);
    formData.append('listado_inicio', '0');
    formData.append('listado_cantidad', '500');
    formData.append('__vista_productos', 'mosaico');
    formData.append('__orden_productos', 'predt');

    const res = await fetch('https://smartsupply.com.ar/cargar_productos.php', {
      method: 'POST',
      headers: {
        'Cookie': cookie,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': fullUrl
      },
      body: formData.toString()
    });

    const ajaxText = await res.text();
    // Dividir por tarjetas de producto
    const rawCards = ajaxText.split(/(?=<div class="col-6)/gi).filter(c => c.includes('carta-producto'));
    const items = [];

    for (const card of rawCards) {
      // Remover estilos incrustados que confunden el texto
      const cleanCard = card.replace(/<style>[\s\S]*?<\/style>/gi, '');

      const nameMatch = cleanCard.match(/itemprop="name" content="([^"]+)"/i) || cleanCard.match(/class="descripcion-producto[^>]*><span>([\s\S]*?)<\/span>/i);
      const skuMatch = cleanCard.match(/itemprop="sku" content="([^"]+)"/i);
      const priceMatch = cleanCard.match(/itemprop="price" content="([^"]+)"/i) || cleanCard.match(/class="carta2-precio-lista">\$?\s*([\d\.\,]+)/i);
      const urlMatch = cleanCard.match(/itemprop="url" content="([^"]+)"/i) || cleanCard.match(/href="(producto\/[^"]+)"/i);

      // STOCK REAL: Solo está en stock si tiene el botón "Agregar al carrito" o la clase "carrito-comprar-producto"
      // Si dice "Ver el producto" o no tiene clase de compra directa, está AGOTADO en el sistema de SmartSupply
      const hasRealStock = cleanCard.includes('carrito-comprar-producto') || 
                           /<a[^>]*class="[^"]*carta2-boton[^"]*"[^>]*>\s*Agregar al carrito\s*<\/a>/i.test(cleanCard);

      if (nameMatch && priceMatch) {
        let strPrice = priceMatch[1].trim();
        let rawPrice = 0;
        if (strPrice.includes(',')) {
          rawPrice = parseFloat(strPrice.replace(/\./g, '').replace(',', '.'));
        } else {
          rawPrice = parseFloat(strPrice);
        }
        if (rawPrice > 0) {
          items.push({
            name: nameMatch[1].replace(/<[^>]+>/g, '').trim(),
            sku: skuMatch ? skuMatch[1].trim() : '',
            brand: cat.brand,
            part_type: cat.type,
            price_lista_ars: rawPrice,
            price_cash_ars: Math.round(rawPrice / 1.18),
            in_stock: hasRealStock,
            url: urlMatch ? (urlMatch[1].startsWith('http') ? urlMatch[1] : `https://smartsupply.com.ar/${urlMatch[1].replace(/^\//, '')}`) : ''
          });
        }
      }
    }

    console.log(`[OK] ${cat.brand} - ${cat.type}: ${items.length} repuestos extraídos.`);
    return items;
  } catch (err) {
    console.error(`[ERR] Error en ${cat.url}:`, err.message);
    return [];
  }
}

async function runScraper() {
  console.log('Iniciando extracción completa de SmartSupply...\n');
  const allParts = [];

  for (const cat of CATEGORIES_TO_SCRAPE) {
    const parts = await scrapeCategory(cat);
    allParts.push(...parts);
    // Pausa breve de cortesía
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\n==============================================`);
  console.log(`TOTAL DE REPUESTOS EXTRAÍDOS: ${allParts.length}`);
  console.log(`==============================================`);

  // Agrupado por marca y tipo
  const summary = {};
  allParts.forEach(p => {
    const key = `${p.brand} (${p.part_type})`;
    summary[key] = (summary[key] || 0) + 1;
  });
  console.log('Resumen:', summary);

  // Guardar JSON con repuestos de SmartSupply
  const outputData = {
    provider: 'Smart Supply (smartsupply.com.ar)',
    extracted_at: new Date().toISOString(),
    total_parts: allParts.length,
    parts: allParts
  };

  fs.writeFileSync('smartsupply_repuestos.json', JSON.stringify(outputData, null, 2));
  fs.writeFileSync('src/data/smartsupplyParts.json', JSON.stringify(outputData, null, 2));
  
  const jsContent = `// Catálogo importado de repuestos de Smart Supply (smartsupply.com.ar)
// Generado automáticamente el ${new Date().toLocaleString('es-AR')}

export const SMARTSUPPLY_PARTS_INFO = {
  provider: ${JSON.stringify(outputData.provider)},
  extracted_at: ${JSON.stringify(outputData.extracted_at)},
  total_parts: ${outputData.total_parts}
};

export const SMARTSUPPLY_PARTS = ${JSON.stringify(allParts, null, 2)};
`;
  fs.writeFileSync('src/data/smartsupplyParts.js', jsContent);
  console.log('\nGuardado exitoso en:');
  console.log(' - smartsupply_repuestos.json');
  console.log(' - src/data/smartsupplyParts.json');
  console.log(' - src/data/smartsupplyParts.js');
}

runScraper().catch(console.error);
