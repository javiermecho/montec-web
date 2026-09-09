/**
 * SERVICIO CENTRALIZADO DE CONEXIÓN CON LA API REST EN RAILWAY
 * montec.ar • Servicio Técnico y Taller Especializado
 */

const getApiBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Si tiene una barra al final, eliminarla para consistencia
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
};

const REQUEST_TIMEOUT_MS = 6000;

/**
 * Cliente HTTP unificado con timeout y manejo robusto de excepciones
 */
async function request(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    },
    signal: controller.signal
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `Error del servidor (${response.status})`;
      return {
        success: false,
        status: response.status,
        error: errorMessage,
        data: null
      };
    }

    return {
      success: true,
      status: response.status,
      data: data
    };
  } catch (err) {
    clearTimeout(timeoutId);

    const isTimeout = err.name === 'AbortError';
    const errorText = isTimeout 
      ? 'Tiempo de espera agotado al conectar con el servidor central'
      : (err.message || 'Error de red o servidor no disponible');

    return {
      success: false,
      status: 0,
      isOffline: true,
      error: errorText,
      data: null
    };
  }
}

// ============================================================================
// 1. ESTADO DEL SERVIDOR (HEALTHCHECK)
// ============================================================================

export async function checkServerHealth() {
  const res = await request('/health', { method: 'GET' });
  if (res.success && res.data) {
    return {
      online: true,
      database: res.data.database?.connected ?? true,
      service: res.data.service || 'online',
      data: res.data
    };
  }
  return {
    online: false,
    database: false,
    error: res.error
  };
}

// ============================================================================
// 2. MÓDULO DE ÓRDENES DE TALLER (POSTGRESQL)
// ============================================================================

/**
 * Consulta la lista de órdenes activas con filtros opcionales
 */
export async function getOrdenes(filtros = {}) {
  const queryParams = new URLSearchParams();
  if (filtros.status && filtros.status !== 'all') queryParams.append('status', filtros.status);
  if (filtros.search) queryParams.append('search', filtros.search);
  if (filtros.limit) queryParams.append('limit', filtros.limit);

  const qs = queryParams.toString();
  const res = await request(`/orders${qs ? `?${qs}` : ''}`, { method: 'GET' });

  const ordersList = res.data?.orders || res.data?.data || (Array.isArray(res.data) ? res.data : []);
  if (res.success && Array.isArray(ordersList)) {
    return ordersList;
  }
  return [];
}

/**
 * Obtiene el detalle completo de una orden por ID o correlativo
 */
export async function getOrdenById(id) {
  const res = await request(`/orders/${encodeURIComponent(id)}`, { method: 'GET' });
  if (res.success && (res.data?.order || res.data?.data)) {
    return { success: true, order: res.data?.order || res.data?.data };
  }
  return { success: false, error: res.error };
}

/**
 * Crea una nueva orden en PostgreSQL y devuelve el número correlativo oficial #MON-XXXX
 */
export async function createOrden(orderData) {
  const res = await request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });

  if (res.success && res.data?.order) {
    return {
      success: true,
      order: res.data.order,
      orderNumber: res.data.order.orderNumber || res.data.order.order_number
    };
  }
  return { success: false, error: res.error };
}

/**
 * Actualiza el estado técnico de una orden
 */
export async function updateOrdenEstado(id, estadoData) {
  const res = await request(`/orders/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(estadoData)
  });
  return res;
}

/**
 * Registra un cobro de saldo o seña adicional
 */
export async function updateOrdenPago(id, pagoData) {
  const res = await request(`/orders/${encodeURIComponent(id)}/payments`, {
    method: 'PATCH',
    body: JSON.stringify(pagoData)
  });
  return res;
}

// ============================================================================
// 3. MÓDULO DE INVENTARIO Y PRODUCTOS (POSTGRESQL)
// ============================================================================

/**
 * Consulta el catálogo de productos y stock disponible
 */
export async function getProductos(filtros = {}) {
  const queryParams = new URLSearchParams();
  if (filtros.category && filtros.category !== 'Todos') queryParams.append('category', filtros.category);
  if (filtros.inStockOnly) queryParams.append('inStockOnly', 'true');

  const qs = queryParams.toString();
  const res = await request(`/inventory${qs ? `?${qs}` : ''}`, { method: 'GET' });

  const productList = res.data?.products || res.data?.data || (Array.isArray(res.data) ? res.data : []);
  if (res.success && Array.isArray(productList)) {
    return productList;
  }
  return [];
}

/**
 * Crea un nuevo producto en el catálogo
 */
export async function createProducto(productData) {
  const res = await request('/inventory', {
    method: 'POST',
    body: JSON.stringify(productData)
  });
  return res;
}

/**
 * Actualiza un producto existente
 */
export async function updateProducto(id, productData) {
  const res = await request(`/inventory/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(productData)
  });
  return res;
}

// ============================================================================
// 4. MÓDULO DE VENTAS (PUNTO DE VENTA - POS)
// ============================================================================

/**
 * Registra una venta en el POS y descuenta el stock atómicamente en PostgreSQL
 */
export async function createVenta(ventaData) {
  const res = await request('/sales', {
    method: 'POST',
    body: JSON.stringify(ventaData)
  });

  if (res.success && res.data?.sale) {
    return {
      success: true,
      sale: res.data.sale,
      ticketNumber: res.data.sale.ticketNumber || res.data.sale.ticket_number
    };
  }
  return { success: false, error: res.error };
}

export const api = {
  checkServerHealth,
  getOrdenes,
  getOrdenById,
  createOrden,
  updateOrdenEstado,
  updateOrdenPago,
  getProductos,
  createProducto,
  updateProducto,
  createVenta
};

export default api;
