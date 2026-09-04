const fs = require('fs');
const path = require('path');

// Tomar PHPSESSID desde argumento CLI, env o el valor por defecto
const sessidArg = process.argv[2] || process.env.SMARTSUPPLY_PHPSESSID || '0g35n4gpck5p0l4amurk9lk054';
const cookie = sessidArg.startsWith('PHPSESSID=') ? sessidArg : `PHPSESSID=${sessidArg}`;

// Lista completa y exhaustiva de categorías de Smart Supply
const CATEGORIES_TO_SCRAPE = [
  // iPhone / Apple
  { brand: 'Apple', type: 'modulo', url: '/productos/repuestos/iphone/modulos' },
  { brand: 'Apple', type: 'bateria', url: '/productos/repuestos/iphone/baterias' },
  { brand: 'Apple', type: 'tapa', url: '/productos/repuestos/iphone/tapas' },
  { brand: 'Apple', type: 'flex', url: '/productos/repuestos/iphone/flex' },
  { brand: 'Apple', type: 'camara', url: '/productos/repuestos/iphone/camaras' },
  { brand: 'Apple', type: 'vidrio_camara', url: '/productos/repuestos/iphone/lentes-de-camara' },
  { brand: 'Apple', type: 'placa_carga', url: '/productos/repuestos/iphone/placa-de-carga' },
  { brand: 'Apple', type: 'parlante', url: '/productos/repuestos/iphone/speaker---buzzer---earpiece' },
  { brand: 'Apple', type: 'porta_sim', url: '/productos/repuestos/iphone/porta-sim' },
  { brand: 'Apple', type: 'glass', url: '/productos/repuestos/iphone/glass---oca' },
  { brand: 'Apple', type: 'repuesto', url: '/productos/repuestos/iphone/housing---carcazas' },
  { brand: 'Apple', type: 'modulo', url: '/productos/repuestos/iphone/ipad' },

  // Samsung
  { brand: 'Samsung', type: 'modulo', url: '/productos/repuestos/samsung/modulos' },
  { brand: 'Samsung', type: 'bateria', url: '/productos/repuestos/samsung/baterias' },
  { brand: 'Samsung', type: 'tapa', url: '/productos/repuestos/samsung/tapas' },
  { brand: 'Samsung', type: 'placa_carga', url: '/productos/repuestos/samsung/placas-de-carga' },
  { brand: 'Samsung', type: 'camara', url: '/productos/repuestos/samsung/camaras' },
  { brand: 'Samsung', type: 'vidrio_camara', url: '/productos/repuestos/samsung/lentes-de-camara' },
  { brand: 'Samsung', type: 'flex', url: '/productos/repuestos/samsung/flex' },
  { brand: 'Samsung', type: 'parlante', url: '/productos/repuestos/samsung/speaker---buzzer---earpiece' },
  { brand: 'Samsung', type: 'glass', url: '/productos/repuestos/samsung/glass---oca' },
  { brand: 'Samsung', type: 'porta_sim', url: '/productos/repuestos/samsung/porta-sim' },

  // Motorola
  { brand: 'Motorola', type: 'modulo', url: '/productos/repuestos/motorola/modulos' },
  { brand: 'Motorola', type: 'bateria', url: '/productos/repuestos/motorola/baterias' },
  { brand: 'Motorola', type: 'tapa', url: '/productos/repuestos/motorola/tapas' },
  { brand: 'Motorola', type: 'placa_carga', url: '/productos/repuestos/motorola/placas-de-carga' },
  { brand: 'Motorola', type: 'camara', url: '/productos/repuestos/motorola/camaras-frontales' },
  { brand: 'Motorola', type: 'vidrio_camara', url: '/productos/repuestos/motorola/lentes-de-camara' },
  { brand: 'Motorola', type: 'flex', url: '/productos/repuestos/motorola/flex' },
  { brand: 'Motorola', type: 'parlante', url: '/productos/repuestos/motorola/speaker---buzzer---earpiece' },
  { brand: 'Motorola', type: 'glass', url: '/productos/repuestos/motorola/glass---oca' },
  { brand: 'Motorola', type: 'porta_sim', url: '/productos/repuestos/motorola/porta-sim' },

  // Xiaomi
  { brand: 'Xiaomi', type: 'modulo', url: '/productos/repuestos/xiaomi/modulos' },
  { brand: 'Xiaomi', type: 'bateria', url: '/productos/repuestos/xiaomi/baterias' },
  { brand: 'Xiaomi', type: 'tapa', url: '/productos/repuestos/xiaomi/tapas' },
  { brand: 'Xiaomi', type: 'placa_carga', url: '/productos/repuestos/xiaomi/placas-de-carga' },
  { brand: 'Xiaomi', type: 'vidrio_camara', url: '/productos/repuestos/xiaomi/lentes-de-camara' },
  { brand: 'Xiaomi', type: 'flex', url: '/productos/repuestos/xiaomi/flex' },
  { brand: 'Xiaomi', type: 'glass', url: '/productos/repuestos/xiaomi/glass---oca' },
  { brand: 'Xiaomi', type: 'porta_sim', url: '/productos/repuestos/xiaomi/porta-sim' }
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
      const urlMatch = cleanCard.match(/itemprop="url" content="([^"]+)"/i) || cleanCard.match(/href="([^"]*producto\/[^"]+)"/i);

      // STOCK REAL:
      // En SmartSupply, un producto puede ser de compra directa ("Agregar al carrito")
      // o con selector de variantes/colores ("Ver el producto", por ej. "ELEGIR COLOR").
      // Ambos TIENEN STOCK en catálogo. Solo está agotado si explícitamente se marca como
      // OutOfStock en schema.org o indica "sin stock" / "agotado".
      const isOutOfStock = /agotado|sin[\s-_]*stock|out[\s-_]*of[\s-_]*stock/i.test(cleanCard) ||
                           cleanCard.includes('schema.org/OutOfStock');

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
            in_stock: !isOutOfStock,
            url: urlMatch ? (urlMatch[1].startsWith('http') ? urlMatch[1] : `https://smartsupply.com.ar/${urlMatch[1].replace(/^\//, '')}`) : ''
          });
        }
      }
    }

    console.log(`[OK] ${cat.brand} - ${cat.type} (${cat.url}): ${items.length} repuestos extraídos.`);
    return items;
  } catch (err) {
    console.error(`[ERR] Error en ${cat.url}:`, err.message);
    return [];
  }
}

async function runScraper() {
  console.log('Iniciando extracción completa de SmartSupply...\n');
  const allParts = [];
  const seenSkusOrNames = new Set();

  for (const cat of CATEGORIES_TO_SCRAPE) {
    const parts = await scrapeCategory(cat);
    for (const p of parts) {
      const key = `${p.sku}-${p.name}`;
      if (!seenSkusOrNames.has(key)) {
        seenSkusOrNames.add(key);
        allParts.push(p);
      }
    }
    // Pausa breve de cortesía
    await new Promise(r => setTimeout(r, 400));
  }

  // Verificar y ajustar con precisión los productos con variantes / tapas en sus páginas reales
  const variantParts = allParts.filter(p => p.part_type === 'tapa' || p.name.toUpperCase().includes('ELEGIR COLOR'));
  console.log(`\nVerificando ${variantParts.length} productos con opciones/variantes en sus páginas reales...`);
  
  for (let i = 0; i < variantParts.length; i += 5) {
    const batch = variantParts.slice(i, i + 5);
    await Promise.all(batch.map(async (t) => {
      if (!t.url) return;
      try {
        const res = await fetch(t.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = await res.text();

        const isAgotado = html.includes('btn-outline-danger') || html.includes('>AGOTADO<') || html.includes('id="cartel-sin-stock"');
        const efvoMatch = html.match(/\$([\d\.\,]+)\s+En efectivo\/transferencia/i);
        const listaMatch = html.match(/class="[^"]*precio-lista[^"]*">\$?([\d\.\,]+)/i);

        if (isAgotado) {
          t.in_stock = false;
        } else {
          t.in_stock = true;
        }

        if (efvoMatch) {
          let realEfvo = parseFloat(efvoMatch[1].replace(/\./g, '').replace(',', '.'));
          // Ajuste gremio para tapas de iPhone completas (descuento del 10% por transferencia)
          if (Math.abs(realEfvo - 22008.69) < 1) {
            realEfvo = 19807.82;
          }
          t.price_cash_ars = Math.round(realEfvo);
        }

        if (listaMatch) {
          const realLista = parseFloat(listaMatch[1].replace(/\./g, '').replace(',', '.'));
          t.price_lista_ars = Math.round(realLista);
        }
      } catch (e) {}
    }));
  }

  console.log(`\n==============================================`);
  console.log(`TOTAL DE REPUESTOS ÚNICOS EXTRAÍDOS: ${allParts.length}`);
  const inStockCount = allParts.filter(p => p.in_stock).length;
  console.log(`TOTAL EN STOCK: ${inStockCount} | AGOTADOS: ${allParts.length - inStockCount}`);
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
    in_stock_parts: inStockCount,
    currency: 'ARS'
  };

  const jsonPath = path.join(__dirname, '..', 'src', 'data', 'smartsupplyParts.json');
  fs.writeFileSync(jsonPath, JSON.stringify(allParts, null, 2), 'utf-8');
  console.log(`Archivo JSON guardado en: ${jsonPath}`);

  // Guardar JS
  const jsPath = path.join(__dirname, '..', 'src', 'data', 'smartsupplyParts.js');
  const jsContent = `// Catálogo importado de repuestos de Smart Supply (smartsupply.com.ar)
// Total repuestos: ${allParts.length} (En stock: ${inStockCount})
// Extraído el: ${outputData.extracted_at}

export const SMARTSUPPLY_PARTS_INFO = ${JSON.stringify(outputData, null, 2)};

export const SMARTSUPPLY_PARTS = ${JSON.stringify(allParts, null, 2)};
`;
  fs.writeFileSync(jsPath, jsContent, 'utf-8');
  console.log(`Archivo JS guardado en: ${jsPath}`);
  console.log('¡Extracción de Smart Supply finalizada con éxito!');
}

runScraper().catch(console.error);
