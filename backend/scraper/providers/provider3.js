import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizeModelName, detectCategory, parsePrice } from '../normalizer.js';

export const provider3Config = {
  name: 'Importadora Repuestos Constitución',
  slug: 'proveedor-3-constitucion',
  baseUrl: process.env.PROVIDER_3_URL || 'https://proveedor3-constitucion.com',
  paths: ['/repuestos/celulares'],
  selectors: {
    productCard: '.product, .grid-item',
    title: '.woocommerce-loop-product__title, .p-title',
    price: '.woocommerce-Price-amount, .current-price',
    stock: '.in-stock'
  }
};

export async function scrapeProvider3() {
  console.log(`📡 [Scraper] Iniciando extracción de: ${provider3Config.name}`);
  const results = [];

  if (provider3Config.baseUrl.includes('proveedor3-constitucion.com')) {
    return [
      { rawName: 'Modulo iPhone 14 Incell FHD Con Táctil', cost: 42000, inStock: true, url: '#' },
      { rawName: 'Pin de Carga Tipo C Samsung Galaxy A14 / A24', cost: 5800, inStock: true, url: '#' },
      { rawName: 'Bateria iPhone 12 / 12 Pro 2815mAh Con Adhesivos', cost: 19800, inStock: true, url: '#' },
      { rawName: 'Pantalla Completa Moto G23 / G13 Original', cost: 23500, inStock: true, url: '#' }
    ].map(item => {
      const normalized = normalizeModelName(item.rawName);
      return {
        providerSlug: provider3Config.slug,
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
    const targetUrl = `${provider3Config.baseUrl}${provider3Config.paths[0]}`;
    const response = await axios.get(targetUrl, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    $(provider3Config.selectors.productCard).each((_, el) => {
      const title = $(el).find(provider3Config.selectors.title).first().text().trim();
      const priceText = $(el).find(provider3Config.selectors.price).first().text().trim();
      if (title && priceText) {
        const normalized = normalizeModelName(title);
        results.push({
          providerSlug: provider3Config.slug,
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
  } catch (err) {
    console.error(`⚠️ [Scraper] Error con ${provider3Config.name}:`, err.message);
  }

  return results;
}
