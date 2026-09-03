-- Esquema de Base de Datos para montec en PostgreSQL (Railway)

-- 1. Tabla de Proveedores de Repuestos de Mar del Plata
CREATE TABLE IF NOT EXISTS providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(60) UNIQUE NOT NULL,
    base_url VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Repuestos Extraídos y Normalizados
CREATE TABLE IF NOT EXISTS replacement_parts (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers(id) ON DELETE SET NULL,
    raw_name TEXT NOT NULL,
    normalized_model VARCHAR(120) NOT NULL,
    brand VARCHAR(60) NOT NULL,
    category VARCHAR(60) NOT NULL, -- 'pantalla', 'bateria', 'pin_carga', 'placa', 'flex'
    base_cost NUMERIC(12, 2) NOT NULL,
    margin_multiplier NUMERIC(4, 2) DEFAULT 1.45,
    final_price NUMERIC(12, 2) NOT NULL,
    in_stock BOOLEAN DEFAULT TRUE,
    source_url TEXT,
    last_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas ultra rápidas desde el cotizador web
CREATE INDEX IF NOT EXISTS idx_parts_normalized_model ON replacement_parts(normalized_model);
CREATE INDEX IF NOT EXISTS idx_parts_brand_category ON replacement_parts(brand, category);
CREATE INDEX IF NOT EXISTS idx_parts_in_stock ON replacement_parts(in_stock);

-- 3. Tabla de Registro de Cotizaciones Web (Métricas de Demanda)
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

-- Inserción inicial de los 4 proveedores locales de Mar del Plata
INSERT INTO providers (name, slug, base_url) VALUES 
('Distribuidor Repuestos MDP Centro', 'proveedor-1-centro', 'https://proveedor1-mdp-repuestos.com'),
('Distribuidor Mayorista Zona Güemes', 'proveedor-2-guemes', 'https://proveedor2-guemes-parts.com'),
('Importadora Repuestos Constitución', 'proveedor-3-constitucion', 'https://proveedor3-constitucion.com'),
('Proveedor Especializado Apple & Android MDP', 'proveedor-4-especializado', 'https://proveedor4-mdp-tech.com')
ON CONFLICT (slug) DO NOTHING;
