// Servicio de Cotización de Dólar Blue en Tiempo Real
// Fuente: Bluelytics API (https://api.bluelytics.com.ar/v2/latest)

const BLUELYTICS_URL = 'https://api.bluelytics.com.ar/v2/latest';
const STORAGE_KEY = 'montec_dolar_blue_v1';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos de caché

// Valor de respaldo en caso de desconexión o falla de la API externa
export const DEFAULT_FALLBACK_RATE = 1545.00;

/**
 * Obtiene la cotización del Dólar Blue Venta en pesos argentinos.
 * Maneja caché en localStorage y fallback resiliente.
 */
export async function fetchDolarBlueRate() {
  // 1. Verificar caché existente
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const isFresh = (Date.now() - parsed.timestamp) < CACHE_TTL_MS;
      if (isFresh && parsed.value_sell > 0) {
        return {
          rate: parsed.value_sell,
          lastUpdate: parsed.last_update || new Date(parsed.timestamp).toISOString(),
          isLive: true,
          fromCache: true
        };
      }
    }
  } catch (err) {
    console.warn('⚠️ No se pudo leer caché de dólar:', err);
  }

  // 2. Intentar llamada en vivo a Bluelytics
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(BLUELYTICS_URL, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const blueSell = data?.blue?.value_sell;

      if (blueSell && typeof blueSell === 'number' && blueSell > 0) {
        const payload = {
          value_sell: blueSell,
          last_update: data.last_update,
          timestamp: Date.now()
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch {
          // Ignore localStorage quota errors
        }

        return {
          rate: blueSell,
          lastUpdate: data.last_update || new Date().toISOString(),
          isLive: true,
          fromCache: false
        };
      }
    }
  } catch (err) {
    console.warn('⚠️ Error al consultar Bluelytics API, usando fallback:', err.message);
  }

  // 3. Fallback a último valor guardado o valor por defecto
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.value_sell > 0) {
        return {
          rate: parsed.value_sell,
          lastUpdate: parsed.last_update,
          isLive: false,
          fromCache: true
        };
      }
    }
  } catch {}

  return {
    rate: DEFAULT_FALLBACK_RATE,
    lastUpdate: new Date().toISOString(),
    isLive: false,
    fromCache: false
  };
}

/**
 * Convierte un monto en USD a ARS usando la tasa dada
 */
export function convertUsdToArs(amountUsd, rate) {
  if (!amountUsd || isNaN(amountUsd)) return 0;
  const effectiveRate = rate || DEFAULT_FALLBACK_RATE;
  return amountUsd * effectiveRate;
}
