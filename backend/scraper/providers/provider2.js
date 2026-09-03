import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizeModelName, detectCategory, parsePrice } from '../normalizer.js';

export const provider2Config = {
  name: 'Distribuidor Mayorista Zona Güemes',
  slug: 'proveedor-2-guemes',
  baseUrl: process.env.PROVIDER_2_URL || 'https://proveedor2-guemes-parts.com',
  paths: ['/categoria/pantallas', '/categoria/baterias'],
  selectors: {
    productCard: '.product-wrapper, .vtex-search-result-3-x-galleryItem',
    title: '.product-name, .vtex-product-summary-2-x-nameContainer',
    price: '.price-tag, .vtex-product-price-1-x-sellingPriceValue',
    stock: '.stock-label',
    link: 'a'
  }
};

export async function scrapeProvider2() {
  console.log(`📡 [Scraper] Iniciando extracción de: ${provider2Config.name}`);
  const results = [];

  if (provider2Config.baseUrl.includes('proveedor2-guemes-parts.com')) {
    return [
      { rawName: 'Modulo Apple iPhone 13 OLED Super Retina', cost: 65000, inStock: true, url: '#' },
      { rawName: 'Bateria Samsung Galaxy S21 FE 4500mAh Original', cost: 18900, inStock: true, url: '#' },
      { rawName: 'Display Motorola Moto G52 Amoled Con Marco', cost: 32000, inStock: true, url: '#' },
      { rawName: 'Modulo Xiaomi Redmi Note 12 4G Original Service Pack', cost: 29500, inStock: true, url: '#' }
    ].map(item => {
      const normalized = normalizeModelName(item.rawName);
      return {
        providerSlug: provider2Config.slug,
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
    for (const path of provider2Config.paths) {
      const targetUrl = `${provider2Config.baseUrl}${path}`;
      const response = await axios.get(targetUrl, { timeout: 10000 });
      const $ = cheerio.load(response.data);
      $(provider2Config.selectors.productCard).each((_, el) => {
        const title = $(el).find(provider2Config.selectors.title).first().text().trim();
        const priceText = $(el).find(provider2Config.selectors.price).first().text().trim();
        if (title && priceText) {
          const normalized = normalizeModelName(title);
          results.push({
            providerSlug: provider2Config.slug,
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
    console.error(`⚠️ [Scraper] Error con ${provider2Config.name}:`, err.message);
  }

  return results;
}
