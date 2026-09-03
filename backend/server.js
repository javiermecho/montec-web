import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query, isDbConnected } from './db/index.js';
import { runScraperSync } from './scraper/index.js';
import { normalizeModelName } from './scraper/normalizer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*', // Permite solicitudes desde montec.ar en Hostinger o localhost
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 1. Healthcheck para Railway y monitoreo
app.get('/api/health', async (req, res) => {
  const dbConnected = await isDbConnected();
  res.json({
    status: 'online',
    service: 'montec-backend-api',
    version: '1.0.0',
    location: 'Mar del Plata, Montes Carballo 943',
    database: {
      type: 'PostgreSQL (Railway)',
      connected: dbConnected
    },
    timestamp: new Date().toISOString()
  });
});

// 2. Endpoint: Listado de repuestos con filtros (marca, modelo, categoría)
app.get('/api/repuestos', async (req, res) => {
  const { brand, model, category, inStock } = req.query;
  const dbConnected = await isDbConnected();

  if (!dbConnected) {
    // Fallback con datos estáticos si la base de datos aún no fue enlazada en Railway
    return res.json({
      source: 'fallback_memory',
      message: 'Base de datos en modo fallback. Configura DATABASE_URL en Railway para sincronización persistente.',
      data: [
        { brand: 'Apple', model: 'iPhone 11', category: 'pantalla', final_price: 55000, in_stock: true },
        { brand: 'Apple', model: 'iPhone 12', category: 'pantalla', final_price: 85000, in_stock: true },
        { brand: 'Apple', model: 'iPhone 11', category: 'bateria', final_price: 38000, in_stock: true },
        { brand: 'Samsung', model: 'Galaxy A54 5G', category: 'pantalla', final_price: 64000, in_stock: true },
        { brand: 'Motorola', model: 'Moto G84 5G', category: 'pin_carga', final_price: 22000, in_stock: true }
      ]
    });
  }

  try {
    let sql = 'SELECT * FROM replacement_parts WHERE 1=1';
    const params = [];
    let counter = 1;

    if (brand) {
      sql += ` AND LOWER(brand) = LOWER($${counter++})`;
      params.push(brand);
    }
    if (model) {
      sql += ` AND LOWER(normalized_model) LIKE LOWER($${counter++})`;
      params.push(`%${model}%`);
    }
    if (category) {
      sql += ` AND LOWER(category) = LOWER($${counter++})`;
      params.push(category);
    }
    if (inStock !== undefined) {
      sql += ` AND in_stock = $${counter++}`;
      params.push(inStock === 'true');
    }

    sql += ' ORDER BY final_price ASC LIMIT 100';

    const result = await query(sql, params);
    res.json({
      source: 'postgresql_railway',
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error al consultar repuestos:', error);
    res.status(500).json({ error: 'Error al consultar repuestos en la base de datos' });
  }
});

// 3. Endpoint: Cotizador inteligente de reparación
app.post('/api/cotizar', async (req, res) => {
  const { deviceType, brand, model, issueType } = req.body;

  if (!model || !issueType) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos: model y issueType' });
  }

  const normalized = normalizeModelName(model);
  const dbConnected = await isDbConnected();

  let estimatedMin = 25000;
  let estimatedMax = 45000;
  let duration = '45 a 60 minutos en el acto';
  let warranty = '90 días de garantía escrita';

  // Si la base de datos está conectada, consultamos el repuesto real del scraper
  if (dbConnected) {
    try {
      const partQuery = await query(`
        SELECT final_price, in_stock, category 
        FROM replacement_parts 
        WHERE LOWER(normalized_model) LIKE LOWER($1) 
        ORDER BY final_price ASC 
        LIMIT 1
      `, [`%${normalized.model}%`]);

      if (partQuery.rowCount > 0) {
        const baseCost = parseFloat(partQuery.rows[0].final_price);
        estimatedMin = Math.round((baseCost * 0.95) / 500) * 500;
        estimatedMax = Math.round((baseCost * 1.15) / 500) * 500;
      }

      // Registro analítico de la cotización
      await query(`
        INSERT INTO quotations_log (device_type, brand, model_name, issue_type, estimated_min, estimated_max)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [deviceType || 'smartphone', normalized.brand, normalized.model, issueType, estimatedMin, estimatedMax]);

    } catch (e) {
      console.warn('⚠️ No se pudo registrar cotización en DB:', e.message);
    }
  }

  // Tiempos según falla
  if (issueType.includes('motherboard') || issueType.includes('placa')) {
    duration = '24 a 48 hs (Laboratorio Técnico)';
    estimatedMin += 25000;
    estimatedMax += 45000;
  }

  res.json({
    success: true,
    device: {
      type: deviceType,
      brand: normalized.brand,
      model: normalized.model
    },
    issue: issueType,
    estimate: {
      min: estimatedMin,
      max: estimatedMax,
      currency: 'ARS',
      formatted: `$${estimatedMin.toLocaleString('es-AR')} a $${estimatedMax.toLocaleString('es-AR')}`
    },
    duration,
    warranty,
    location: 'Montes Carballo 943, Mar del Plata'
  });
});

// 4. Endpoint: Disparador del Scraper de Distribuidores de Mar del Plata
app.post('/api/scraper/trigger', async (req, res) => {
  const secret = req.headers['x-scraper-key'] || req.body?.secretKey;
  const expectedSecret = process.env.SCRAPER_SECRET_KEY || 'montec_mdp_secret_scrape_2026';

  if (secret !== expectedSecret) {
    return res.status(401).json({ error: 'No autorizado. Provee el header x-scraper-key correcto.' });
  }

  // Ejecución en segundo plano o sincrónica
  try {
    const result = await runScraperSync();
    res.json({
      message: 'Scraper ejecutado exitosamente',
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`
  ⚡ ======================================================== ⚡
     montec API Server & Scraper Engine
     Puerto: http://localhost:${PORT}
     Ubicación: Montes Carballo 943, Mar del Plata
     Ambiente: ${process.env.NODE_ENV || 'development'}
  ⚡ ======================================================== ⚡
  `);
});
