/**
 * SERVICIO BACKEND DE GOOGLE SEARCH CONSOLE API
 * montec.ar • Posicionamiento SEO & Search Analytics
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEFAULT_SITE_URL = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'sc-domain:montec.ar';

/**
 * Obtiene un Access Token fresco usando el Refresh Token de OAuth2
 */
async function getAccessToken() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Faltan credenciales OAuth2 de Google en las variables de entorno.');
  }

  const response = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  return response.data.access_token;
}

/**
 * Consulta el listado de propiedades verificadas en Search Console
 */
export async function listVerifiedSites() {
  const accessToken = await getAccessToken();
  const response = await axios.get('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data.siteEntry || [];
}

/**
 * Obtiene las métricas de rendimiento y consultas de búsqueda de Search Console
 * @param {Object} options
 * @param {number} options.days - Días hacia atrás a consultar (default: 30)
 */
export async function getSearchPerformance(options = {}) {
  const days = options.days || 30;
  const siteUrl = encodeURIComponent(DEFAULT_SITE_URL);

  try {
    const accessToken = await getAccessToken();

    const endDateObj = new Date();
    // Search console data suele tener un delay de 2 a 3 días en datos definitivos
    const endDate = endDateObj.toISOString().split('T')[0];
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - days);
    const startDate = startDateObj.toISOString().split('T')[0];

    // 1. Consultar evolución diaria (dimension: date)
    const dailyPromise = axios.post(
      `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`,
      {
        startDate,
        endDate,
        dimensions: ['date'],
        rowLimit: 100
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // 2. Consultar términos de búsqueda principales (dimension: query)
    const queriesPromise = axios.post(
      `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`,
      {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 50
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // 3. Consultar páginas principales (dimension: page)
    const pagesPromise = axios.post(
      `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`,
      {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 20
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const [dailyRes, queriesRes, pagesRes] = await Promise.all([
      dailyPromise,
      queriesPromise,
      pagesPromise
    ]);

    const dailyRows = dailyRes.data.rows || [];
    const queryRows = queriesRes.data.rows || [];
    const pageRows = pagesRes.data.rows || [];

    // Calcular totales
    let totalClicks = 0;
    let totalImpressions = 0;
    let sumCtr = 0;
    let sumPosition = 0;

    dailyRows.forEach(r => {
      totalClicks += r.clicks || 0;
      totalImpressions += r.impressions || 0;
      sumCtr += r.ctr || 0;
      sumPosition += r.position || 0;
    });

    const avgCtr = dailyRows.length > 0 ? (sumCtr / dailyRows.length) * 100 : 0;
    const avgPosition = dailyRows.length > 0 ? sumPosition / dailyRows.length : 0;

    const formattedDaily = dailyRows.map(r => ({
      date: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: +(r.ctr * 100).toFixed(2),
      position: +r.position.toFixed(1)
    }));

    const formattedQueries = queryRows.map((r, idx) => ({
      query: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: +(r.ctr * 100).toFixed(2),
      position: +r.position.toFixed(1)
    }));

    const formattedPages = pageRows.map(r => ({
      url: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: +(r.ctr * 100).toFixed(2),
      position: +r.position.toFixed(1)
    }));

    const hasData = dailyRows.length > 0 || queryRows.length > 0;

    return {
      success: true,
      isLive: true,
      siteUrl: DEFAULT_SITE_URL,
      hasData,
      summary: {
        totalClicks,
        totalImpressions,
        avgCtr: +avgCtr.toFixed(2),
        avgPosition: +avgPosition.toFixed(1)
      },
      dailyData: formattedDaily,
      queries: formattedQueries,
      pages: formattedPages,
      message: hasData
        ? 'Datos de Search Console sincronizados con éxito.'
        : 'Propiedad verificada en Search Console. Google está procesando las primeras estadísticas de búsqueda de montec.ar.'
    };
  } catch (error) {
    const errorDetails = error.response ? error.response.data : error.message;
    console.error('Error en Search Console Service:', errorDetails);
    return {
      success: false,
      isLive: false,
      error: typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails,
      siteUrl: DEFAULT_SITE_URL
    };
  }
}
