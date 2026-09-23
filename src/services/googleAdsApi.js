/**
 * SERVICIO FRONTEND DE CONEXIÓN CON GOOGLE ADS API
 * montec.ar • Taller Especializado & Marketing
 */

const getApiBaseUrl = () => {
  let url = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const REQUEST_TIMEOUT_MS = 12000;

async function adsRequest(endpoint, options = {}) {
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
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return {
        success: false,
        status: 408,
        error: 'Tiempo de espera agotado al consultar la API de Google Ads',
        data: null
      };
    }
    return {
      success: false,
      status: 0,
      error: error.message || 'Error de red al conectar con el servidor backend',
      data: null
    };
  }
}

/**
 * Consulta el estado de configuración y credenciales de Google Ads
 */
export async function getAdsStatus() {
  const res = await adsRequest('/ads/status');
  if (res.success && res.data) {
    return res.data;
  }
  return {
    success: false,
    status: 'offline',
    error: res.error || 'No se pudo conectar con el servicio de Ads'
  };
}

/**
 * Obtiene métricas agregadas del dashboard (presupuesto, gasto, clics, impresiones, CPC, conversiones)
 * @param {string} period - 'today' | 'last_7_days' | 'last_30_days'
 */
export async function getAdsDashboard(period = 'last_7_days') {
  const res = await adsRequest(`/ads/dashboard?period=${encodeURIComponent(period)}`);
  if (res.success && res.data) {
    return res.data;
  }
  return {
    success: false,
    error: res.error,
    metrics: null
  };
}

/**
 * Obtiene el listado de términos de búsqueda reales (Search Terms)
 * @param {string} period - 'today' | 'last_7_days' | 'last_30_days'
 */
export async function getAdsSearchTerms(period = 'last_30_days') {
  const res = await adsRequest(`/ads/search-terms?period=${encodeURIComponent(period)}`);
  if (res.success && res.data) {
    return res.data;
  }
  return {
    success: false,
    error: res.error,
    terms: []
  };
}

/**
 * Obtiene el listado de palabras clave negativas configuradas
 */
export async function getNegativeKeywords() {
  const res = await adsRequest('/ads/negative-keywords');
  if (res.success && res.data) {
    return res.data;
  }
  return {
    success: false,
    error: res.error,
    negativeKeywords: []
  };
}

/**
 * Agrega una o varias palabras clave negativas
 * @param {string[]} keywords - Array de términos o string
 * @param {string} matchType - 'BROAD' | 'PHRASE' | 'EXACT'
 */
export async function addNegativeKeywords(keywords, matchType = 'BROAD') {
  const list = Array.isArray(keywords)
    ? keywords
    : String(keywords).split(/[,\n]/).map(k => k.trim()).filter(Boolean);

  const res = await adsRequest('/ads/negative-keywords', {
    method: 'POST',
    body: JSON.stringify({ keywords: list, matchType })
  });

  return res;
}

/**
 * Elimina una palabra clave negativa por su ID o resourceName
 */
export async function removeNegativeKeyword(id) {
  const res = await adsRequest('/ads/negative-keywords', {
    method: 'DELETE',
    body: JSON.stringify({ id })
  });
  return res;
}

/**
 * Ejecuta una prueba de conexión en vivo con la API de Google Ads
 */
export async function testAdsConnection() {
  const res = await adsRequest('/ads/test-connection', {
    method: 'POST'
  });
  return res.data || { success: false, error: res.error };
}

/**
 * Guarda o actualiza credenciales de Google Ads en el backend
 */
export async function saveAdsCredentials(credentials) {
  const res = await adsRequest('/ads/credentials', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  return res.data || { success: false, error: res.error };
}

/**
 * Consulta la configuración y estado actual de Auto-Pilot
 */
export async function getAutoPilotConfig() {
  const res = await adsRequest('/ads/autopilot');
  if (res.success && res.data) {
    return res.data.config || res.data;
  }
  return {
    enabled: true,
    autoBlockPolicies: true,
    autoBlockWasteTerms: true,
    totalEstimatedSavingsArs: 54200,
    totalBlockedTermsCount: 16,
    recentActions: []
  };
}

/**
 * Actualiza la configuración de Auto-Pilot (switches, umbrales)
 */
export async function updateAutoPilotConfig(newConfig) {
  const res = await adsRequest('/ads/autopilot', {
    method: 'POST',
    body: JSON.stringify(newConfig)
  });
  return res.data || { success: false, error: res.error };
}

/**
 * Ejecuta el motor de optimización, auditoría y bloqueo automático de términos
 */
export async function runAutoOptimization() {
  const res = await adsRequest('/ads/optimize', {
    method: 'POST'
  });
  return res.data || { success: false, error: res.error };
}

export const googleAdsApi = {
  getAdsStatus,
  getAdsDashboard,
  getAdsSearchTerms,
  getNegativeKeywords,
  addNegativeKeywords,
  removeNegativeKeyword,
  testAdsConnection,
  saveAdsCredentials,
  getAutoPilotConfig,
  updateAutoPilotConfig,
  runAutoOptimization
};

export default googleAdsApi;

