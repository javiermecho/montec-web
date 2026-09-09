import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query, isDbConnected, initDatabaseSchema } from './db/index.js';
import { runScraperSync } from './scraper/index.js';
import { normalizeModelName } from './scraper/normalizer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*', // Permite solicitudes desde montec.ar en Hostinger o localhost
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-scraper-key']
}));
app.use(express.json());

// Helper para formatear ordenes de DB a estructura frontend
const mapDbOrderToFrontend = (row) => ({
  id: row.id,
  orderNumber: row.order_number,
  client: {
    name: row.client_name,
    phone: row.client_phone,
    ...(row.client_data || {})
  },
  device: {
    model: row.device_model,
    type: row.device_type,
    ...(row.device_data || {})
  },
  service: {
    status: row.status,
    budgetTotal: parseFloat(row.budget_total || 0),
    deposit: parseFloat(row.deposit || 0),
    balanceDue: parseFloat(row.balance_due || 0),
    ...(row.service_data || {})
  },
  payments: row.payments || [],
  logs: row.logs || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// Helper para formatear productos
const mapDbProductToFrontend = (row) => ({
  id: row.id,
  sku: row.sku,
  barcode: row.barcode,
  name: row.name,
  category: row.category,
  compatible: row.compatible,
  costPrice: parseFloat(row.cost_price || 0),
  price: parseFloat(row.price || 0),
  stock: parseInt(row.stock || 0, 10),
  minStock: parseInt(row.min_stock || 3, 10),
  visibleInWeb: row.visible_in_web !== false,
  image: row.image,
  badge: row.badge
});

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

// ==========================================
// 2. ENDPOINTS DE ÓRDENES DE TALLER
// ==========================================

// Listar órdenes (con filtros opcionales de status o search)
app.get('/api/orders', async (req, res) => {
  const { status, search } = req.query;
  const dbConnected = await isDbConnected();

  if (!dbConnected) {
    return res.json({
      source: 'offline_memory',
      orders: []
    });
  }

  try {
    let sql = 'SELECT * FROM repair_orders WHERE 1=1';
    const params = [];
    let counter = 1;

    if (status && status !== 'all') {
      sql += ` AND status = $${counter++}`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (LOWER(order_number) LIKE LOWER($${counter}) OR LOWER(client_name) LIKE LOWER($${counter}) OR LOWER(device_model) LIKE LOWER($${counter}) OR client_phone LIKE $${counter})`;
      params.push(`%${search}%`);
      counter++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    const orders = result.rows.map(mapDbOrderToFrontend);

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('❌ Error al consultar órdenes:', error);
    res.status(500).json({ error: 'Error al consultar órdenes en PostgreSQL', details: error.message });
  }
});

// Obtener orden individual por ID o OrderNumber
app.get('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const dbConnected = await isDbConnected();

  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }

  try {
    const isNum = !isNaN(parseInt(id, 10)) && String(parseInt(id, 10)) === id;
    const sql = isNum 
      ? 'SELECT * FROM repair_orders WHERE id = $1 LIMIT 1'
      : 'SELECT * FROM repair_orders WHERE LOWER(order_number) = LOWER($1) LIMIT 1';

    const result = await query(sql, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json({
      success: true,
      order: mapDbOrderToFrontend(result.rows[0])
    });
  } catch (error) {
    console.error('❌ Error al buscar orden:', error);
    res.status(500).json({ error: 'Error al buscar orden en la base de datos' });
  }
});

// Crear nueva orden de reparación (genera #MON-XXXX con secuencia en PostgreSQL)
app.post('/api/orders', async (req, res) => {
  const data = req.body;
  const dbConnected = await isDbConnected();

  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos PostgreSQL en Railway no conectada' });
  }

  try {
    // Si no trae número oficial de orden, se genera correlativo desde la secuencia de DB
    let orderNumber = data.orderNumber;
    if (!orderNumber || !orderNumber.startsWith('#MON-')) {
      const seqRes = await query("SELECT nextval('repair_order_seq') AS next_num");
      const nextNum = seqRes.rows[0]?.next_num || (1040 + Math.floor(Math.random() * 500));
      orderNumber = `#MON-${nextNum}`;
    }

    const clientName = data.client?.name || data.clientName || 'Cliente Mostrador';
    const clientPhone = data.client?.phone || data.clientPhone || '';
    const deviceModel = data.device?.model || data.deviceModel || 'Dispositivo';
    const deviceType = data.device?.type || data.deviceType || 'Smartphone';
    const status = data.service?.status || data.status || 'received';
    const budgetTotal = parseFloat(data.service?.budgetTotal ?? data.budgetTotal ?? 0);
    const deposit = parseFloat(data.service?.deposit ?? data.deposit ?? 0);
    const balanceDue = budgetTotal - deposit;

    const clientData = data.client || {};
    const deviceData = data.device || {};
    const serviceData = {
      issue: data.service?.issue || data.issue || '',
      diagnosis: data.service?.diagnosis || '',
      patternLock: data.device?.patternLock || data.patternLock || '',
      pinLock: data.device?.pinLock || data.pinLock || '',
      ...(data.service || {})
    };

    const initialPayments = data.payments || (deposit > 0 ? [{
      id: `PAY-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'seña',
      amount: deposit,
      method: data.paymentMethod || 'Efectivo',
      receiver: data.operator || 'Operador Mostrador'
    }] : []);

    const initialLogs = data.logs || [{
      date: new Date().toISOString(),
      action: 'Orden Ingresada',
      details: `Equipo recibido: ${deviceModel} (${serviceData.issue || 'Sin falla especificada'}). Seña: $${deposit}.`,
      user: data.operator || 'Operador Mostrador'
    }];

    const insertSql = `
      INSERT INTO repair_orders (
        order_number, client_name, client_phone, device_model, device_type,
        status, budget_total, deposit, balance_due,
        client_data, device_data, service_data, payments, logs
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) RETURNING *;
    `;

    const values = [
      orderNumber, clientName, clientPhone, deviceModel, deviceType,
      status, budgetTotal, deposit, balanceDue,
      JSON.stringify(clientData), JSON.stringify(deviceData), JSON.stringify(serviceData),
      JSON.stringify(initialPayments), JSON.stringify(initialLogs)
    ];

    const result = await query(insertSql, values);
    const createdOrder = mapDbOrderToFrontend(result.rows[0]);

    console.log(`✅ Orden ${createdOrder.orderNumber} creada exitosamente en PostgreSQL`);
    res.status(201).json({
      success: true,
      message: 'Orden creada exitosamente',
      order: createdOrder
    });
  } catch (error) {
    console.error('❌ Error al crear orden en PostgreSQL:', error);
    res.status(500).json({ error: 'Error al registrar orden en la base de datos', details: error.message });
  }
});

// Actualizar estado e informe técnico de una orden
app.patch('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, technicalReport, operator, internalNotes } = req.body;
  const dbConnected = await isDbConnected();

  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }

  try {
    // 1. Obtener orden existente
    const existingRes = await query('SELECT * FROM repair_orders WHERE id = $1 OR order_number = $1 LIMIT 1', [id]);
    if (existingRes.rowCount === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const currentOrder = existingRes.rows[0];
    const updatedServiceData = {
      ...(currentOrder.service_data || {}),
      technicalReport: technicalReport || currentOrder.service_data?.technicalReport,
      internalNotes: internalNotes || currentOrder.service_data?.internalNotes
    };

    const currentLogs = Array.isArray(currentOrder.logs) ? currentOrder.logs : [];
    const newLog = {
      date: new Date().toISOString(),
      action: `Cambio de Estado a: ${status}`,
      details: technicalReport || 'Estado actualizado desde panel de taller',
      user: operator || 'Taller Montec'
    };
    const updatedLogs = [newLog, ...currentLogs];

    const updateSql = `
      UPDATE repair_orders 
      SET status = $1, service_data = $2, logs = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
    `;

    const result = await query(updateSql, [
      status, 
      JSON.stringify(updatedServiceData), 
      JSON.stringify(updatedLogs), 
      currentOrder.id
    ]);

    res.json({
      success: true,
      message: 'Estado de orden actualizado',
      order: mapDbOrderToFrontend(result.rows[0])
    });
  } catch (error) {
    console.error('❌ Error al actualizar estado de orden:', error);
    res.status(500).json({ error: 'Error al actualizar estado en la base de datos' });
  }
});

// Registrar pago / seña o cobro de saldo
app.patch('/api/orders/:id/payments', async (req, res) => {
  const { id } = req.params;
  const { amount, method, operator, isFinalPayment } = req.body;
  const dbConnected = await isDbConnected();

  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }

  try {
    const existingRes = await query('SELECT * FROM repair_orders WHERE id = $1 OR order_number = $1 LIMIT 1', [id]);
    if (existingRes.rowCount === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const currentOrder = existingRes.rows[0];
    const payAmount = parseFloat(amount || 0);
    const newBalance = Math.max(0, parseFloat(currentOrder.balance_due || 0) - payAmount);
    
    const currentPayments = Array.isArray(currentOrder.payments) ? currentOrder.payments : [];
    const newPayment = {
      id: `PAY-${Date.now()}`,
      date: new Date().toISOString(),
      type: isFinalPayment ? 'saldo_final' : 'pago_parcial',
      amount: payAmount,
      method: method || 'Efectivo',
      receiver: operator || 'Operador Mostrador'
    };
    const updatedPayments = [...currentPayments, newPayment];

    const currentLogs = Array.isArray(currentOrder.logs) ? currentOrder.logs : [];
    const newLog = {
      date: new Date().toISOString(),
      action: isFinalPayment ? 'Cobro Final Registrado' : 'Pago Registrado',
      details: `Cobro de $${payAmount.toLocaleString('es-AR')} por ${method || 'Efectivo'}. Saldo restante: $${newBalance.toLocaleString('es-AR')}.`,
      user: operator || 'Operador Mostrador'
    };
    const updatedLogs = [newLog, ...currentLogs];

    let newStatus = currentOrder.status;
    if (isFinalPayment && newBalance === 0 && newStatus !== 'delivered') {
      newStatus = 'delivered';
    }

    const updateSql = `
      UPDATE repair_orders 
      SET balance_due = $1, status = $2, payments = $3, logs = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *;
    `;

    const result = await query(updateSql, [
      newBalance,
      newStatus,
      JSON.stringify(updatedPayments),
      JSON.stringify(updatedLogs),
      currentOrder.id
    ]);

    res.json({
      success: true,
      message: 'Pago registrado exitosamente',
      order: mapDbOrderToFrontend(result.rows[0])
    });
  } catch (error) {
    console.error('❌ Error al registrar pago de orden:', error);
    res.status(500).json({ error: 'Error al registrar pago en la base de datos' });
  }
});

// Eliminar orden por ID o número correlativo
app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const dbConnected = await isDbConnected();

  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }

  try {
    const isNum = !isNaN(parseInt(id, 10)) && String(parseInt(id, 10)) === id;
    const sql = isNum
      ? 'DELETE FROM repair_orders WHERE id = $1 RETURNING *'
      : 'DELETE FROM repair_orders WHERE LOWER(order_number) = LOWER($1) RETURNING *';

    const result = await query(sql, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json({
      success: true,
      message: 'Orden eliminada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar orden:', error);
    res.status(500).json({ error: 'Error al eliminar orden de la base de datos' });
  }
});

// ==========================================
// 3. ENDPOINTS DE INVENTARIO Y PRODUCTOS
// ==========================================

// Listar productos de inventario
app.get('/api/inventory', async (req, res) => {
  const { category, inStockOnly } = req.query;
  const dbConnected = await isDbConnected();

  if (!dbConnected) {
    return res.json({
      source: 'offline_memory',
      products: []
    });
  }

  try {
    let sql = 'SELECT * FROM inventory WHERE 1=1';
    const params = [];
    let counter = 1;

    if (category && category !== 'Todos') {
      sql += ` AND LOWER(category) = LOWER($${counter++})`;
      params.push(category);
    }
    if (inStockOnly === 'true') {
      sql += ' AND stock > 0';
    }

    sql += ' ORDER BY category ASC, name ASC';

    const result = await query(sql, params);
    const products = result.rows.map(mapDbProductToFrontend);

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('❌ Error al consultar inventario:', error);
    res.status(500).json({ error: 'Error al consultar inventario en PostgreSQL' });
  }
});

// Actualizar stock o detalles de producto
app.patch('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  const { stock, price, costPrice, name, category } = req.body;
  const dbConnected = await isDbConnected();

  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }

  try {
    const fields = [];
    const params = [];
    let counter = 1;

    if (stock !== undefined) {
      fields.push(`stock = $${counter++}`);
      params.push(parseInt(stock, 10));
    }
    if (price !== undefined) {
      fields.push(`price = $${counter++}`);
      params.push(parseFloat(price));
    }
    if (costPrice !== undefined) {
      fields.push(`cost_price = $${counter++}`);
      params.push(parseFloat(costPrice));
    }
    if (name) {
      fields.push(`name = $${counter++}`);
      params.push(name);
    }
    if (category) {
      fields.push(`category = $${counter++}`);
      params.push(category);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `UPDATE inventory SET ${fields.join(', ')} WHERE id = $${counter} RETURNING *;`;
    const result = await query(sql, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({
      success: true,
      product: mapDbProductToFrontend(result.rows[0])
    });
  } catch (error) {
    console.error('❌ Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// ==========================================
// 4. ENDPOINTS DE VENTAS (POS)
// ==========================================

// Registrar venta y descontar stock automáticamente
app.post('/api/sales', async (req, res) => {
  const { items, subtotal, discount, total, paymentMethod, customer, seller } = req.body;
  const dbConnected = await isDbConnected();

  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }

  try {
    // Generar ticket correlativo
    const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;
    
    // Inserción de venta
    const insertSaleSql = `
      INSERT INTO sales (ticket_number, items, subtotal, discount, total, payment_method, customer_data, seller)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const saleResult = await query(insertSaleSql, [
      ticketNumber,
      JSON.stringify(items || []),
      parseFloat(subtotal || total || 0),
      parseFloat(discount || 0),
      parseFloat(total || 0),
      paymentMethod || 'Efectivo',
      JSON.stringify(customer || {}),
      seller || 'Mostrador Montec'
    ]);

    // Descontar stock de cada producto vendido
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.id || item.sku) {
          await query(`
            UPDATE inventory 
            SET stock = GREATEST(0, stock - $1), updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2 OR sku = $3
          `, [item.quantity || 1, item.id || null, item.sku || null]);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Venta registrada y stock actualizado con éxito',
      sale: saleResult.rows[0]
    });
  } catch (error) {
    console.error('❌ Error al registrar venta:', error);
    res.status(500).json({ error: 'Error al registrar venta en la base de datos', details: error.message });
  }
});

// Endpoint para auto-inicializar o verificar esquema en Railway
app.get('/api/db/init', async (req, res) => {
  const result = await initDatabaseSchema();
  res.json({
    message: 'Inicialización de esquema solicitada',
    ...result
  });
});

// ==========================================
// 5. ENDPOINTS DE CONFIGURACIONES & BACKUP
// ==========================================

// Obtener configuración (modelos, fallas/precios, márgenes, configs de iphone)
app.get('/api/settings/:key', async (req, res) => {
  const { key } = req.params;
  const dbConnected = await isDbConnected();

  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }

  try {
    const result = await query('SELECT value, updated_at FROM app_settings WHERE key = $1 LIMIT 1', [key]);
    if (result.rowCount === 0) {
      return res.json({ success: true, key, data: null });
    }
    res.json({
      success: true,
      key,
      data: result.rows[0].value,
      updatedAt: result.rows[0].updated_at
    });
  } catch (error) {
    console.error(`❌ Error al obtener setting ${key}:`, error);
    res.status(500).json({ error: 'Error al consultar configuración' });
  }
});

// Guardar o actualizar configuración en PostgreSQL
app.post('/api/settings/:key', async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  const dbConnected = await isDbConnected();

  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }

  if (value === undefined) {
    return res.status(400).json({ error: 'Se requiere el campo value en el cuerpo de la solicitud' });
  }

  try {
    const upsertSql = `
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (key) 
      DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const result = await query(upsertSql, [key, JSON.stringify(value)]);
    res.json({
      success: true,
      message: `Configuración '${key}' respaldada exitosamente en PostgreSQL`,
      key,
      data: result.rows[0].value,
      updatedAt: result.rows[0].updated_at
    });
  } catch (error) {
    console.error(`❌ Error al guardar setting ${key}:`, error);
    res.status(500).json({ error: 'Error al respaldar configuración en base de datos' });
  }
});

// Generar backup completo de todo el sistema (Órdenes, Inventario, Ventas, Modelos, Precios)
app.get('/api/backup', async (req, res) => {
  const dbConnected = await isDbConnected();
  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible para generar backup' });
  }

  try {
    const ordersRes = await query('SELECT * FROM repair_orders ORDER BY id ASC');
    const inventoryRes = await query('SELECT * FROM inventory ORDER BY id ASC');
    const salesRes = await query('SELECT * FROM sales ORDER BY id ASC');
    const settingsRes = await query('SELECT * FROM app_settings ORDER BY key ASC');

    const settingsMap = {};
    settingsRes.rows.forEach(r => {
      settingsMap[r.key] = r.value;
    });

    const backupSnapshot = {
      system: 'montec.ar Taller & POS',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      location: 'Montes Carballo 943, Mar del Plata',
      counts: {
        orders: ordersRes.rowCount,
        inventory: inventoryRes.rowCount,
        sales: salesRes.rowCount,
        settingsKeys: settingsRes.rowCount
      },
      data: {
        repairOrders: ordersRes.rows.map(mapDbOrderToFrontend),
        inventory: inventoryRes.rows.map(mapDbProductToFrontend),
        sales: salesRes.rows,
        settings: settingsMap
      }
    };

    res.json({
      success: true,
      backup: backupSnapshot
    });
  } catch (error) {
    console.error('❌ Error al generar backup:', error);
    res.status(500).json({ error: 'Error al exportar snapshot del sistema' });
  }
});

// Inicio del servidor
app.listen(PORT, async () => {
  console.log(`
  ⚡ ======================================================== ⚡
     montec API Server & Scraper Engine
     Puerto: http://localhost:${PORT}
     Ubicación: Montes Carballo 943, Mar del Plata
     Ambiente: ${process.env.NODE_ENV || 'development'}
  ⚡ ======================================================== ⚡
  `);

  // Auto-verificación de tablas e índices en PostgreSQL
  try {
    await initDatabaseSchema();
  } catch (e) {
    console.warn('⚠️ No se pudo auto-inicializar esquema al arranque:', e.message);
  }
});

