/**
 * SERVICIO PÚBLICO DE SEGUIMIENTO Y TRACKING DE ÓRDENES
 * montec.ar • Servicio Técnico y Laboratorio Especializado
 */

import { trackPublicOrder } from './api';

/**
 * Genera la URL pública de seguimiento para un número de orden
 * @param {string|number} orderNumber - Ej: '#MON-1042', '1042', 'ORD-1042'
 * @returns {string} URL absoluta o relativa para el cliente
 */
export function getOrderTrackingUrl(orderNumber) {
  if (!orderNumber) return 'https://montec.ar/estado';
  
  // Limpiar el número de orden para URL limpia
  const cleanNumber = String(orderNumber).trim().replace(/^#/, '');
  
  // Si estamos en un navegador en producción montec.ar
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('montec.ar')) {
      return `https://montec.ar/estado?orden=${encodeURIComponent(cleanNumber)}`;
    }
    // En desarrollo local (localhost)
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${window.location.protocol}//${window.location.hostname}${port}/estado?orden=${encodeURIComponent(cleanNumber)}`;
  }
  
  return `https://montec.ar/estado?orden=${encodeURIComponent(cleanNumber)}`;
}

/**
 * Normaliza y sanitiza una orden para consumo público de cliente.
 * NUNCA expone costos internos de repuestos, proveedores, contraseñas, patrones ni notas privadas de técnicos.
 */
export function sanitizeOrderForPublic(rawOrder) {
  if (!rawOrder) return null;

  const customer = rawOrder.customer || rawOrder.client || {};
  const device = rawOrder.device || {};
  const service = rawOrder.service || {};
  const logs = rawOrder.logs || [];

  // Nombre de cliente legible y seguro (ej: 'Martín B.')
  const rawName = String(customer.name || customer.fullName || rawOrder.client_name || 'Cliente').trim();
  const nameParts = rawName.split(/\s+/);
  const safeClientName = nameParts.length > 1
    ? `${nameParts[0]} ${nameParts[1].charAt(0).toUpperCase()}.`
    : (nameParts[0] || 'Cliente');

  // Cálculos económicos transparentes
  const budgetTotal = parseFloat(
    service.budgetTotal ?? rawOrder.budget_total ?? rawOrder.budgetTotal ?? 0
  ) || 0;
  const deposit = parseFloat(
    service.deposit ?? rawOrder.deposit ?? 0
  ) || 0;
  const balanceDue = parseFloat(
    service.balanceDue ?? rawOrder.balance_due ?? rawOrder.balanceDue ?? Math.max(0, budgetTotal - deposit)
  ) || 0;

  // Filtrar logs públicos únicamente
  const publicLogs = Array.isArray(logs) ? logs.map(l => ({
    timestamp: l.timestamp || l.date || l.createdAt,
    status: l.status,
    action: l.action || l.message || 'Actualización de estado en taller'
  })) : [];

  return {
    id: rawOrder.id,
    orderNumber: rawOrder.orderNumber || rawOrder.order_number || String(rawOrder.id),
    createdAt: rawOrder.createdAt || rawOrder.created_at || new Date().toISOString(),
    updatedAt: rawOrder.updatedAt || rawOrder.updated_at || new Date().toISOString(),
    status: rawOrder.status || service.status || 'received',
    client: {
      name: safeClientName,
      fullName: rawName
    },
    device: {
      brand: device.brand || '',
      model: device.model || rawOrder.device_model || 'Dispositivo móvil',
      type: device.type || rawOrder.device_type || 'Smartphone',
      color: device.color || ''
    },
    service: {
      requestedRepair: service.requestedRepair || service.issueDescription || service.problem || service.falla || 'Revisión técnica general',
      preliminaryDiagnosis: service.preliminaryDiagnosis || '',
      technicalReport: service.techReport || service.technicalReport || rawOrder.technical_report || '',
      estimatedDeliveryDate: service.estimatedDeliveryDate || service.estimatedTime || '24 a 48 hs',
      budgetTotal,
      deposit,
      balanceDue,
      warranty: service.warranty || '90 días escrita'
    },
    logs: publicLogs
  };
}

/**
 * Consulta de estado pública: busca en API remota o hace fallback a órdenes locales
 * @param {Object} params
 * @param {string} params.orderNumber - Número de orden a consultar
 * @param {string} [params.dniOrPhone] - DNI o Teléfono para validación de titular
 * @param {Array} [params.localOrders] - Lista de órdenes en memoria/localStorage como fallback
 */
export async function queryOrderTracking({ orderNumber, dniOrPhone = '', localOrders = [] }) {
  const cleanOrder = String(orderNumber || '').trim().replace(/^#/, '');
  const cleanDni = String(dniOrPhone || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();

  if (!cleanOrder) {
    return {
      success: false,
      error: 'Por favor, ingresá un número de orden válido.'
    };
  }

  // 1. Intentar consultar el backend público en PostgreSQL
  try {
    const apiRes = await trackPublicOrder({
      order: cleanOrder,
      dni: cleanDni || undefined
    });

    if (apiRes.success && apiRes.order) {
      return {
        success: true,
        order: sanitizeOrderForPublic(apiRes.order),
        source: 'backend'
      };
    }
  } catch (err) {
    console.warn('⚠️ No se pudo consultar la API pública remota, verificando datos locales...', err);
  }

  // 2. Fallback de resiliencia en órdenes locales (localStorage / DataContext)
  if (Array.isArray(localOrders) && localOrders.length > 0) {
    const foundOrder = localOrders.find(o => {
      const num = String(o.orderNumber || o.order_number || o.id || '').replace(/^#/, '').toLowerCase();
      const target = cleanOrder.toLowerCase();
      return num === target || num.endsWith(target) || target.endsWith(num);
    });

    if (foundOrder) {
      // Si se proporcionó DNI/teléfono, validar coincidencia estricta
      if (cleanDni) {
        const cust = foundOrder.customer || foundOrder.client || {};
        const phone = String(cust.phone || '').replace(/[^0-9]/g, '');
        const docNum = String(cust.docNumber || cust.dni || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();

        const matchesPhone = phone.includes(cleanDni) || cleanDni.includes(phone.slice(-6));
        const matchesDoc = docNum.includes(cleanDni) || cleanDni.includes(docNum);

        if (!matchesPhone && !matchesDoc) {
          return {
            success: false,
            error: 'No encontramos una reparación que coincida con ese número de orden y DNI / Teléfono. Verificá los datos o consultanos por WhatsApp.'
          };
        }
      }

      return {
        success: true,
        order: sanitizeOrderForPublic(foundOrder),
        source: 'local'
      };
    }
  }

  return {
    success: false,
    error: 'No encontramos una reparación con el número de orden ingresado. Verificá los datos o escribinos por WhatsApp para asistirte.'
  };
}

