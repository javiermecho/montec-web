import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizeModelName, detectCategory, parsePrice } from '../normalizer.js';

export const provider1Config = {
  name: 'Distribuidor Repuestos MDP Centro',
  slug: 'proveedor-1-centro',
  baseUrl: process.env.PROVIDER_1_URL || 'https://proveedor1-mdp-repuestos.com',
  // Rutas o páginas de repuestos de celulares
  paths: ['/modulos-pantallas', '/baterias', '/pines-de-carga'],
  
  // Selectores CSS adaptables a la estructura del proveedor
  selectors: {
    productCard: '.product-item, .card-producto, .item-box',
    title: '.product-title, .title, h2.woocommerce-loop-product__title, .name',
    price: '.price, .product-price, .amount',
    stock: '.stock-status, .availability',
    link: 'a.product-link, a.woocommerce-LoopProduct-link'
  }
};

export async function scrapeProvider1() {
  console.log(`📡 [Scraper] Iniciando extracción de: ${provider1Config.name}`);
  const results = [];

  // Si la URL es de ejemplo o no está en producción aún, generamos datos simulados basados en catálogo real de Mar del Plata
  if (provider1Config.baseUrl.includes('proveedor1-mdp-repuestos.com')) {
    console.log(`ℹ️ [Scraper] Generando lote representativo para ${provider1Config.name} (Modo catálogo local)`);
    return [
      { rawName: 'Modulo iPhone 11 Incell Calidad Premium Con Touch', cost: 28500, inStock: true, url: '#' },
      { rawName: 'Modulo iPhone 12 / 12 Pro OLED Hard Premium', cost: 48000, inStock: true, url: '#' },
      { rawName: 'Bateria iPhone 11 3110mAh Con Chip Celdas Nuevas', cost: 16500, inStock: true, url: '#' },
      { rawName: 'Modulo Samsung A54 5G Calidad Oled Con Marco', cost: 36000, inStock: true, url: '#' },
      { rawName: 'Pin de Carga Subplaca Moto G84 5G Original', cost: 7200, inStock: true, url: '#' }
    ].map(item => {
      const normalized = normalizeModelName(item.rawName);
      return {
        providerSlug: provider1Config.slug,
        rawName: item.rawName,
        brand: normalized.brand,
        model: normalized.model,
        category: detectCategory(item.rawName),
        cost: item.cost,
        inStock: item.inStock,
        sourceUrl: item.url
      };
    });
  }

  // Flujo HTTP real mediante axios y cheerio cuando se configura la URL definitiva
  try {
    for (const path of provider1Config.paths) {
      const targetUrl = `${provider1Config.baseUrl}${path}`;
      const response = await axios.get(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MontecBot/1.0' },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      $(provider1Config.selectors.productCard).each((_, el) => {
        const title = $(el).find(provider1Config.selectors.title).first().text().trim();
        const priceText = $(el).find(provider1Config.selectors.price).first().text().trim();
        const stockText = $(el).find(provider1Config.selectors.stock).first().text().trim().toLowerCase();
        const link = $(el).find(provider1Config.selectors.link).first().attr('href') || targetUrl;

        if (title && priceText) {
          const cost = parsePrice(priceText);
          const normalized = normalizeModelName(title);
          results.push({
            providerSlug: provider1Config.slug,
            rawName: title,
            brand: normalized.brand,
            model: normalized.model,
            category: detectCategory(title),
            cost: cost,
            inStock: !stockText.includes('agotado') && !stockText.includes('sin stock'),
            sourceUrl: link
          });
        }
      });
    }
  } catch (err) {
    console.error(`⚠️ [Scraper] Error al conectar con ${provider1Config.name}:`, err.message);
  }

  return results;
}
