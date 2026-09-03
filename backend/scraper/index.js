import dotenv from 'dotenv';
import { query, isDbConnected } from '../db/index.js';
import { scrapeProvider1 } from './providers/provider1.js';
import { scrapeProvider2 } from './providers/provider2.js';
import { scrapeProvider3 } from './providers/provider3.js';
import { scrapeProvider4 } from './providers/provider4.js';

dotenv.config();

const MARGIN_MULTIPLIER = parseFloat(process.env.DEFAULT_MARGIN_MULTIPLIER || '1.45');
const MINIMUM_LABOR_FEE = parseFloat(process.env.MINIMUM_LABOR_FEE || '12000');

export async function runScraperSync() {
  console.log('🏁 [Scraper Orchestrator] Iniciando ciclo de sincronización de las 4 fuentes de Mar del Plata...');
  const startTime = Date.now();

  try {
    // 1. Ejecución concurrente o secuencial de los 4 proveedores
    const [p1, p2, p3, p4] = await Promise.all([
      scrapeProvider1(),
      scrapeProvider2(),
      scrapeProvider3(),
      scrapeProvider4()
    ]);

    const allItems = [...p1, ...p2, ...p3, ...p4];
    console.log(`📦 [Scraper Orchestrator] Total de repuestos extraídos y normalizados: ${allItems.length}`);

    // 2. Persistencia en PostgreSQL si la base de datos de Railway está disponible
    const dbAvailable = await isDbConnected();

    if (dbAvailable) {
      console.log('💾 [Scraper Orchestrator] Guardando repuestos en PostgreSQL (Railway)...');

      // Mapeo de proveedores en DB
      const provRows = await query('SELECT id, slug FROM providers');
      const providerMap = new Map();
      provRows.rows.forEach(r => providerMap.set(r.slug, r.id));

      let savedCount = 0;
      for (const item of allItems) {
        const providerId = providerMap.get(item.providerSlug) || null;
        
        // Cálculo automático de precio final con margen comercial + mano de obra
        const rawFinalPrice = (item.cost * MARGIN_MULTIPLIER) + MINIMUM_LABOR_FEE;
        const finalPrice = Math.round(rawFinalPrice / 500) * 500;

        await query(`
          INSERT INTO replacement_parts 
            (provider_id, raw_name, normalized_model, brand, category, base_cost, margin_multiplier, final_price, in_stock, source_url, last_scraped_at)
          VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        `, [
          providerId,
          item.rawName,
          item.model,
          item.brand,
          item.category,
          item.cost,
          MARGIN_MULTIPLIER,
          finalPrice,
          item.inStock,
          item.sourceUrl
        ]);

        savedCount++;
      }

      console.log(`✅ [Scraper Orchestrator] ${savedCount} repuestos guardados/actualizados con éxito en PostgreSQL.`);
    } else {
      console.log('⚠️ [Scraper Orchestrator] Base de datos no conectada. Los repuestos están listos en memoria para responder por API.');
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ [Scraper Orchestrator] Ciclo completado en ${duration}s.`);
    
    return {
      success: true,
      totalScraped: allItems.length,
      items: allItems.map(i => ({
        ...i,
        finalEstimatedPrice: Math.round(((i.cost * MARGIN_MULTIPLIER) + MINIMUM_LABOR_FEE) / 500) * 500
      })),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ [Scraper Orchestrator] Error en el proceso:', error);
    return { success: false, error: error.message };
  }
}

// Ejecución directa si se invoca con: node scraper/index.js
if (process.argv[1]?.endsWith('index.js')) {
  runScraperSync().then(() => process.exit(0));
}
