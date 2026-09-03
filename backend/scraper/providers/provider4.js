import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizeModelName, detectCategory, parsePrice } from '../normalizer.js';

export const provider4Config = {
  name: 'Proveedor Especializado Apple & Android MDP',
  slug: 'proveedor-4-especializado',
  baseUrl: process.env.PROVIDER_4_URL || 'https://proveedor4-mdp-tech.com',
  paths: ['/catalogo/apple', '/catalogo/samsung'],
  selectors: {
    productCard: '.product-card, .tienda-item',
    title: '.prod-title',
    price: '.prod-price',
    stock: '.badge-stock'
  }
};

export async function scrapeProvider4() {
  console.log(`📡 [Scraper] Iniciando extracción de: ${provider4Config.name}`);
  const results = [];

  if (provider4Config.baseUrl.includes('proveedor4-mdp-tech.com')) {
    return [
      { rawName: 'iP 15 Pro Max Display Screen OLED Pulled Original', cost: 110000, inStock: true, url: '#' },
      { rawName: 'Display Samsung S23 Ultra Original Con Marco y Bateria', cost: 145000, inStock: true, url: '#' },
      { rawName: 'Modulo iPhone XR Incell FHD Con TrueTone Ready', cost: 24000, inStock: true, url: '#' },
      { rawName: 'Bateria iPhone 13 Pro 3095mAh Original TI Gas Gauge', cost: 26000, inStock: true, url: '#' }
    ].map(item => {
      const normalized = normalizeModelName(item.rawName);
      return {
        providerSlug: provider4Config.slug,
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

  try {
    for (const path of provider4Config.paths) {
      const targetUrl = `${provider4Config.baseUrl}${path}`;
      const response = await axios.get(targetUrl, { timeout: 10000 });
      const $ = cheerio.load(response.data);
      $(provider4Config.selectors.productCard).each((_, el) => {
        const title = $(el).find(provider4Config.selectors.title).first().text().trim();
        const priceText = $(el).find(provider4Config.selectors.price).first().text().trim();
        if (title && priceText) {
          const normalized = normalizeModelName(title);
          results.push({
            providerSlug: provider4Config.slug,
            rawName: title,
            brand: normalized.brand,
            model: normalized.model,
            category: detectCategory(title),
            cost: parsePrice(priceText),
            inStock: true,
            sourceUrl: targetUrl
          });
        }
      });
    }
  } catch (err) {
    console.error(`⚠️ [Scraper] Error con ${provider4Config.name}:`, err.message);
  }

  return results;
}
