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

-- 4. Secuencia para Órdenes de Reparación (#MON-1042)
CREATE SEQUENCE IF NOT EXISTS repair_order_seq START WITH 1042;

-- 5. Tabla de Órdenes de Reparación (Taller Montec)
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

CREATE INDEX IF NOT EXISTS idx_repair_orders_number ON repair_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_repair_orders_status ON repair_orders(status);
CREATE INDEX IF NOT EXISTS idx_repair_orders_client_phone ON repair_orders(client_phone);

-- 6. Tabla de Inventario de Productos y Accesorios
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

CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory(barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);

-- 7. Tabla de Ventas de Mostrador (Punto de Venta - POS)
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(30) UNIQUE NOT NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    customer_data JSONB DEFAULT '{}'::jsonb,
    seller VARCHAR(100) DEFAULT 'Mostrador Montec',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_ticket ON sales(ticket_number);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);

-- 8. Tabla de Configuraciones del Sistema y Backup Centralizado (Modelos, Fallas, Precios, Márgenes)
CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_settings_updated ON app_settings(updated_at);
