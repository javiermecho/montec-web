import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  pool.on('error', (err) => {
    console.error('⚠️ [PostgreSQL Railway] Error inesperado en el cliente del pool:', err);
  });
} else {
  console.warn('⚠️ [PostgreSQL] No se detectó DATABASE_URL en variables de entorno. La API operará con la base de datos estática inicial.');
}

export const query = async (text, params) => {
  if (!pool) {
    throw new Error('DATABASE_URL no configurada. Conexión a PostgreSQL no disponible.');
  }
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // Log en desarrollo para debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SQL Query] ejecutada en ${duration}ms:`, { text, rows: res.rowCount });
  }
  return res;
};

export const isDbConnected = async () => {
  if (!pool) return false;
  try {
    const res = await pool.query('SELECT 1');
    return res.rowCount > 0;
  } catch (err) {
    return false;
  }
};

/**
 * Inicialización automática del esquema de Base de Datos en Railway
 */
export const initDatabaseSchema = async () => {
  if (!pool) return { success: false, message: 'Sin conexión a base de datos' };

  const ddl = `
    CREATE TABLE IF NOT EXISTS providers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        slug VARCHAR(60) UNIQUE NOT NULL,
        base_url VARCHAR(255) NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS replacement_parts (
        id SERIAL PRIMARY KEY,
        provider_id INTEGER REFERENCES providers(id) ON DELETE SET NULL,
        raw_name TEXT NOT NULL,
        normalized_model VARCHAR(120) NOT NULL,
        brand VARCHAR(60) NOT NULL,
        category VARCHAR(60) NOT NULL,
        base_cost NUMERIC(12, 2) NOT NULL,
        margin_multiplier NUMERIC(4, 2) DEFAULT 1.45,
        final_price NUMERIC(12, 2) NOT NULL,
        in_stock BOOLEAN DEFAULT TRUE,
        source_url TEXT,
        last_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotations_log (
        id SERIAL PRIMARY KEY,
        device_type VARCHAR(60) NOT NULL,
        brand VARCHAR(60),
        model_name VARCHAR(120) NOT NULL,
        issue_type VARCHAR(80) NOT NULL,
        estimated_min NUMERIC(12, 2) NOT NULL,
        estimated_max NUMERIC(12, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE SEQUENCE IF NOT EXISTS repair_order_seq START WITH 1042;

    CREATE TABLE IF NOT EXISTS repair_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(30) UNIQUE NOT NULL,
        client_name VARCHAR(150) NOT NULL,
        client_phone VARCHAR(60),
        device_model VARCHAR(150) NOT NULL,
        device_type VARCHAR(60) DEFAULT 'Smartphone',
        status VARCHAR(50) NOT NULL DEFAULT 'received',
        budget_total NUMERIC(12, 2) DEFAULT 0,
        deposit NUMERIC(12, 2) DEFAULT 0,
        balance_due NUMERIC(12, 2) DEFAULT 0,
        client_data JSONB DEFAULT '{}'::jsonb,
        device_data JSONB DEFAULT '{}'::jsonb,
        service_data JSONB DEFAULT '{}'::jsonb,
        payments JSONB DEFAULT '[]'::jsonb,
        logs JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(60) UNIQUE NOT NULL,
        barcode VARCHAR(60),
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        compatible TEXT,
        cost_price NUMERIC(12, 2) DEFAULT 0,
        price NUMERIC(12, 2) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER DEFAULT 3,
        visible_in_web BOOLEAN DEFAULT TRUE,
        image TEXT,
        badge VARCHAR(60) DEFAULT 'Disponible',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        ticket_number VARCHAR(30) UNIQUE NOT NULL,
        document_type VARCHAR(50) DEFAULT 'ticket_x',
        document_number VARCHAR(60),
        items JSONB NOT NULL,
        subtotal NUMERIC(12, 2) NOT NULL,
        discount NUMERIC(12, 2) DEFAULT 0,
        total NUMERIC(12, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        customer_data JSONB DEFAULT '{}'::jsonb,
        seller VARCHAR(100) DEFAULT 'Mostrador Montec',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE sales ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'ticket_x';
    ALTER TABLE sales ADD COLUMN IF NOT EXISTS document_number VARCHAR(60);

    CREATE INDEX IF NOT EXISTS idx_repair_orders_number ON repair_orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_repair_orders_status ON repair_orders(status);
    CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
    CREATE INDEX IF NOT EXISTS idx_sales_ticket ON sales(ticket_number);

    -- Tabla de configuraciones y backup (modelos, precios de reparación, fallas, márgenes)
    CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(ddl);
    console.log('✅ [PostgreSQL Railway] Tablas e índices verificados/creados exitosamente.');
    return { success: true };
  } catch (err) {
    console.error('❌ [PostgreSQL Railway] Error inicializando esquema:', err);
    return { success: false, error: err.message };
  }
};

export default { query, isDbConnected, initDatabaseSchema };
