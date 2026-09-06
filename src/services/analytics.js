/**
 * Servicio Centralizado de Seguimiento de Eventos para Google Analytics 4 (GA4) y Google Ads
 * Garantiza el disparo seguro a través de window.gtag y window.dataLayer.
 */

// Inicializar dataLayer global de forma segura
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

/**
 * Disparar evento genérico a GA4 / GTM / Google Ads
 */
export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;

  try {
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
 * Evento 1: Cotización iniciada en el presupuestador
 * Disparado cuando el usuario selecciona modelo y falla.
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
 * Este evento es el objetivo clave de conversión para optimización de campañas publicitarias.
 */
export function trackClickWhatsappCotizacion({ deviceType, modelName, issueName, estimatedPrice, whatsappUrl }) {
  trackEvent('click_whatsapp_cotizacion', {
    event_category: 'Conversion',
    event_label: `${deviceType} - ${modelName} - ${issueName}`,
    device_type: deviceType,
    model_name: modelName,
    issue_name: issueName,
    value: estimatedPrice || 0,
    currency: 'ARS',
    send_to: import.meta.env.VITE_GOOGLE_ADS_CONVERSION_ID || undefined
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

export default {
  trackEvent,
  trackCotizacionIniciada,
  trackClickWhatsappCotizacion,
  trackClickLlamadaOMapa,
  trackConsultaAccesorio
};
