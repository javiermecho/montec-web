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

export default { query, isDbConnected };
