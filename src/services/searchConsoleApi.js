/**
 * SERVICIO FRONTEND DE CONEXIÓN CON GOOGLE SEARCH CONSOLE API
 * montec.ar • SEO & Rendimiento Orgánico
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

const REQUEST_TIMEOUT_MS = 15000;

export const searchConsoleApi = {
  /**
   * Obtiene métricas reales de Google Search Console para montec.ar
   */
  async getSearchPerformance(days = 30) {
    const baseUrl = getApiBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl}/seo/performance?days=${days}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('No se pudo conectar a la API de Search Console:', error.message);
      return {
        success: false,
        isLive: false,
        error: error.message
      };
    }
  },

  /**
   * Obtiene la lista de sitios autorizados
   */
  async getVerifiedSites() {
    const baseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/seo/sites`);
      return await response.json();
    } catch (e) {
      return { success: false, sites: [] };
    }
  }
};
