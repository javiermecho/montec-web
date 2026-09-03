import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, isDbConnected } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
  console.log('🚀 [DB Init] Verificando conexión a PostgreSQL (Railway)...');

  const connected = await isDbConnected();
  if (!connected) {
    console.error('❌ [DB Init] Error: No se pudo conectar a la base de datos. Verifica DATABASE_URL en tu .env o variables de Railway.');
    process.exit(1);
  }

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 [DB Init] Ejecutando esquema DDL (tablas e índices)...');
    await query(sql);
    console.log('✅ [DB Init] Tablas (providers, replacement_parts, quotations_log) inicializadas correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ [DB Init] Falló la inicialización de la base de datos:', error);
    process.exit(1);
  }
}

initDb();
