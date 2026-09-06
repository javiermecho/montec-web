/**
 * Servicio Centralizado de Seguimiento de Eventos para Google Analytics 4 (GA4) y Google Ads
 * Garantiza el disparo seguro a través de window.gtag y window.dataLayer.
 * Permite configuración dinámica del Measurement ID (G-XXXXXXXXXX) desde el panel de administración.
 */

const STORAGE_KEYS = {
  CONFIG: 'montec_analytics_config_v1',
  EVENTS_LOG: 'montec_analytics_logs_v1'
};

// Inicializar dataLayer global de forma segura
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
  window.__MONTEC_ANALYTICS_LOGS__ = window.__MONTEC_ANALYTICS_LOGS__ || [];
}

/**
 * Obtener la configuración actual de Google Analytics y Google Ads
 */
export function getAnalyticsConfig() {
  if (typeof window === 'undefined') {
    return { gaId: '', adsId: '', adsConversionLabel: '' };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error leyendo configuración de analytics de localStorage', e);
  }

  // Fallback a variables de entorno si existen
  const envGa = import.meta.env.VITE_GA_TRACKING_ID;
  const envAds = import.meta.env.VITE_GOOGLE_ADS_ID;
  const envConv = import.meta.env.VITE_GOOGLE_ADS_CONVERSION_ID;

  return {
    gaId: envGa && !envGa.includes('XXXXX') ? envGa : '',
    adsId: envAds && !envAds.includes('XXXXX') ? envAds : '',
    adsConversionLabel: envConv && !envConv.includes('XXXXX') ? envConv : ''
  };
}

/**
 * Guardar nueva configuración de Analytics desde el panel y recargar los tags
 */
export function saveAnalyticsConfig(config) {
  if (typeof window === 'undefined') return false;

  try {
    const cleanConfig = {
      gaId: (config.gaId || '').trim(),
      adsId: (config.adsId || '').trim(),
      adsConversionLabel: (config.adsConversionLabel || '').trim()
    };

    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(cleanConfig));

    // También actualizar keys individuales para index.html
    if (cleanConfig.gaId) localStorage.setItem('montec_ga_id', cleanConfig.gaId);
    else localStorage.removeItem('montec_ga_id');

    if (cleanConfig.adsId) localStorage.setItem('montec_ads_id', cleanConfig.adsId);
    else localStorage.removeItem('montec_ads_id');

    // Inicializar o reconfigurar gtag en vivo
    if (cleanConfig.gaId) {
      ensureGoogleAnalyticsLoaded(cleanConfig.gaId);
    }

    return true;
  } catch (err) {
    console.error('Error guardando configuración de analytics:', err);
    return false;
  }
}

/**
 * Inyecta el script gtag.js si no existe en el DOM y envía el config de GA4
 */
export function ensureGoogleAnalyticsLoaded(gaId) {
  if (typeof window === 'undefined' || !gaId || gaId.includes('XXXXX')) return;

  // 1. Asegurar función gtag
  if (typeof window.gtag !== 'function') {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
  }

  // 2. Comprobar si ya existe el script de gtag en el DOM
  const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
  if (!existingScript) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);
  }

  // 3. Enviar comando config
  window.gtag('config', gaId, {
    page_title: document.title,
    page_location: window.location.href
  });

  console.log(`✅ [Analytics] Conectado a Google Analytics ID: ${gaId}`);
}

/**
 * Guarda el evento en memoria y en localStorage para inspección en el AdminPanel
 */
function logEventLocally(eventName, params) {
  if (typeof window === 'undefined') return;

  try {
    const eventItem = {
      id: 'ev-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      eventName,
      timestamp: new Date().toISOString(),
      params
    };

    window.__MONTEC_ANALYTICS_LOGS__ = [eventItem, ...(window.__MONTEC_ANALYTICS_LOGS__ || [])].slice(0, 100);

    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS_LOG);
    const list = saved ? JSON.parse(saved) : [];
    const updated = [eventItem, ...list].slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.EVENTS_LOG, JSON.stringify(updated));
  } catch (e) {
    // Ignorar si localStorage está lleno
  }
}

/**
 * Obtiene el historial de eventos recientes registrados localmente
 */
export function getRecentEvents() {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS_LOG);
    return saved ? JSON.parse(saved) : (window.__MONTEC_ANALYTICS_LOGS__ || []);
  } catch (e) {
    return window.__MONTEC_ANALYTICS_LOGS__ || [];
  }
}

/**
 * Limpia el historial de eventos locales
 */
export function clearRecentEvents() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.EVENTS_LOG);
    window.__MONTEC_ANALYTICS_LOGS__ = [];
  } catch (e) {}
}

/**
 * Calcula un resumen de métricas en base a los eventos locales
 */
export function getAnalyticsSummary() {
  const events = getRecentEvents();
  let cotizaciones = 0;
  let conversionesWhatsapp = 0;
  let clicksContacto = 0;
  let accesoriosConsultados = 0;

  events.forEach(e => {
    if (e.eventName === 'cotizacion_iniciada') cotizaciones++;
    else if (e.eventName === 'click_whatsapp_cotizacion') conversionesWhatsapp++;
    else if (e.eventName === 'click_llamada_o_mapa') clicksContacto++;
    else if (e.eventName === 'consulta_accesorio') accesoriosConsultados++;
  });

  return {
    totalEvents: events.length,
    cotizaciones,
    conversionesWhatsapp,
    clicksContacto,
    accesoriosConsultados
  };
}

/**
 * Disparar evento genérico a GA4 / GTM / Google Ads
 */
export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;

  try {
    // Registro local para visualización en el AdminPanel
    logEventLocally(eventName, params);

    // 1. Envío a dataLayer (GTM)
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: eventName,
        timestamp: new Date().toISOString(),
        ...params
      });
    }

    // 2. Envío a gtag.js (GA4 / Google Ads)
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }

    // Registro en desarrollo para depuración
    if (import.meta.env.DEV) {
      console.log(`📊 [Analytics] Evento disparado: ${eventName}`, params);
    }
  } catch (err) {
    console.warn('⚠️ [Analytics] Error al registrar evento:', err);
  }
}

/**
 * Enviar un evento de prueba manual desde el AdminPanel para verificar en Google Analytics en tiempo real
 */
export function sendTestEvent() {
  const testData = {
    test_id: 'test_' + Date.now(),
    message: 'Prueba de conexión exitosa desde el Panel de Administrador de Montec',
    timestamp: new Date().toLocaleTimeString('es-AR')
  };
  trackEvent('test_conexion_admin', testData);
  return testData;
}

/**
 * Evento 1: Cotización iniciada en el presupuestador
 */
export function trackCotizacionIniciada({ deviceType, modelName, issueName, estimatedPrice }) {
  trackEvent('cotizacion_iniciada', {
    device_type: deviceType,
    model_name: modelName,
    issue_name: issueName,
    value: estimatedPrice || 0,
    currency: 'ARS'
  });
}

/**
 * Evento 2: Click en enviar cotización por WhatsApp (CONVERSIÓN PRINCIPAL GOOGLE ADS)
 */
export function trackClickWhatsappCotizacion({ deviceType, modelName, issueName, estimatedPrice, whatsappUrl }) {
  const config = getAnalyticsConfig();
  trackEvent('click_whatsapp_cotizacion', {
    event_category: 'Conversion',
    event_label: `${deviceType} - ${modelName} - ${issueName}`,
    device_type: deviceType,
    model_name: modelName,
    issue_name: issueName,
    value: estimatedPrice || 0,
    currency: 'ARS',
    send_to: config.adsConversionLabel || import.meta.env.VITE_GOOGLE_ADS_CONVERSION_ID || undefined
  });
}

/**
 * Evento 3: Click en llamada, mapa o 'Cómo llegar'
 */
export function trackClickLlamadaOMapa({ type, label, url }) {
  trackEvent('click_llamada_o_mapa', {
    contact_type: type, // 'mapa', 'como_llegar', 'telefono', 'whatsapp_general'
    contact_label: label,
    target_url: url
  });
}

/**
 * Evento 4: Consulta o click de compra en accesorio
 */
export function trackConsultaAccesorio({ accessoryName, category, price }) {
  trackEvent('consulta_accesorio', {
    item_name: accessoryName,
    item_category: category,
    price: price || 0,
    currency: 'ARS'
  });
}

// Inicializar automáticamente en el inicio de la app si hay ID guardado
if (typeof window !== 'undefined') {
  const initialConfig = getAnalyticsConfig();
  if (initialConfig.gaId) {
    ensureGoogleAnalyticsLoaded(initialConfig.gaId);
  }
}

export default {
  getAnalyticsConfig,
  saveAnalyticsConfig,
  getRecentEvents,
  clearRecentEvents,
  getAnalyticsSummary,
  sendTestEvent,
  trackEvent,
  trackCotizacionIniciada,
  trackClickWhatsappCotizacion,
  trackClickLlamadaOMapa,
  trackConsultaAccesorio
};
