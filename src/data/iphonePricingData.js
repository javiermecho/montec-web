// Base de datos de mano de obra y costos del gremio para iPhone (iLab)
// Integra la regla de ganancia de Montec: $30 USD en modelos más antiguos hasta $100 USD en iPhone 17 Pro Max de forma gradual.
// Cubre: Pantallas, Baterías, Reparación en Placa y Cambio de Tapa Trasera.

import { ALL_MODELS } from './allModels.js';

// Datos oficiales extraídos del gremio (iLab)
export const GUILD_IPHONE_DATA = {
  // Reparación en Placa (Fallas de sonido, señal baseband, mojado/sulfatado, en corto, Face ID, etc.)
  placa: {
    "iPhone 6": 22, "iPhone 6 Plus": 22, "iPhone 6s": 24, "iPhone 6s Plus": 24,
    "iPhone 7": 39, "iPhone 7 Plus": 39, "iPhone 8": 45, "iPhone 8 Plus": 45,
    "iPhone X": 60, "iPhone XS": 65, "iPhone XS Max": 65, "iPhone SE 2020": 65,
    "iPhone XR": 60, "iPhone 11": 80, "iPhone 11 Pro": 80, "iPhone 11 Pro Max": 80,
    "iPhone 12 Mini": 100, "iPhone 12": 100, "iPhone 12 Pro": 100, "iPhone 12 Pro Max": 100,
    "iPhone 13 Mini": 140, "iPhone 13": 140, "iPhone 13 Pro": 140, "iPhone 13 Pro Max": 140,
    "iPhone 14": 200, "iPhone 14 Plus": 200, "iPhone 14 Pro": 200, "iPhone 14 Pro Max": 200,
    "iPhone 15": 240, "iPhone 15 Plus": 240, "iPhone 15 Pro": 240, "iPhone 15 Pro Max": 240,
    "iPhone 16": 290, "iPhone 16 Plus": 290, "iPhone 16 Pro": 290, "iPhone 16 Pro Max": 290, "iPhone 16e": 290,
    "iPhone 17": 320, "iPhone 17 Pro": 350, "iPhone 17 Pro Max": 380,
    "iPhone 5": 20, "iPhone 5C": 20, "iPhone 5S": 20, "iPhone 5Se": 20, "iPhone 5G": 20
  },

  // Reemplazo de Batería (Costo gremio en USD)
  bateria: {
    "iPhone 6": 19, "iPhone 6 Plus": 19, "iPhone 6s": 20, "iPhone 6s Plus": 20,
    "iPhone 7": 20, "iPhone 7 Plus": 21, "iPhone 8": 20, "iPhone 8 Plus": 21,
    "iPhone X": 24, "iPhone XS": 26, "iPhone XS Max": 29, "iPhone SE 2020": 39,
    "iPhone XR": 30, "iPhone 11": 40, "iPhone 11 Pro": 45, "iPhone 11 Pro Max": 45,
    "iPhone 12 Mini": 48, "iPhone 12": 50, "iPhone 12 Pro": 50, "iPhone 12 Pro Max": 60,
    "iPhone 13 Mini": 55, "iPhone 13": 60, "iPhone 13 Pro": 62, "iPhone 13 Pro Max": 62,
    "iPhone 14": 65, "iPhone 14 Plus": 65, "iPhone 14 Pro": 70, "iPhone 14 Pro Max": 72,
    "iPhone 15": 75, "iPhone 15 Plus": 75, "iPhone 15 Pro": 80, "iPhone 15 Pro Max": 90,
    "iPhone 16": 85, "iPhone 16 Plus": 85, "iPhone 16 Pro": 95, "iPhone 16 Pro Max": 100, "iPhone 16e": 85,
    "iPhone 17": 95, "iPhone 17 Pro": 105, "iPhone 17 Pro Max": 115,
    "iPhone 5": 16, "iPhone 5C": 16, "iPhone 5S": 16, "iPhone 5Se": 16, "iPhone 5G": 16
  },

  // Cambio de Tapa Trasera / Back Glass (Costo gremio en USD)
  tapa: {
    "iPhone 8": 30, "iPhone 8 Plus": 30, "iPhone X": 33, "iPhone XS": 33, "iPhone XS Max": 33,
    "iPhone SE 2020": 30, "iPhone XR": 33, "iPhone 11": 35, "iPhone 11 Pro": 40, "iPhone 11 Pro Max": 40,
    "iPhone 12 Mini": 40, "iPhone 12": 40, "iPhone 12 Pro": 40, "iPhone 12 Pro Max": 40,
    "iPhone 13 Mini": 45, "iPhone 13": 45, "iPhone 13 Pro": 50, "iPhone 13 Pro Max": 50,
    "iPhone 14": 50, "iPhone 14 Plus": 50, "iPhone 14 Pro": 55, "iPhone 14 Pro Max": 55,
    "iPhone 15": 65, "iPhone 15 Plus": 65, "iPhone 15 Pro": 65, "iPhone 15 Pro Max": 65,
    "iPhone 16": 90, "iPhone 16 Plus": 90, "iPhone 16 Pro": 90, "iPhone 16 Pro Max": 90, "iPhone 16e": 90,
    "iPhone 17": 95, "iPhone 17 Pro": 98, "iPhone 17 Pro Max": 100
  }
};

/**
 * Escala gradual de ganancia de Montec para iPhone:
 * Desde $30 USD en los modelos más antiguos hasta $100 USD en iPhone 17 Pro Max.
 */
export function getMontecIphoneMarginUsd(modelName) {
  const m = (modelName || '').toUpperCase();
  if (m.includes('17 PRO MAX')) return 100;
  if (m.includes('17 PRO')) return 98;
  if (m.includes('17')) return 95;
  if (m.includes('16 PRO MAX')) return 95;
  if (m.includes('16 PRO')) return 92;
  if (m.includes('16')) return 88;
  if (m.includes('15 PRO MAX')) return 88;
  if (m.includes('15 PRO')) return 85;
  if (m.includes('15')) return 80;
  if (m.includes('14 PRO MAX')) return 78;
  if (m.includes('14 PRO')) return 75;
  if (m.includes('14')) return 70;
  if (m.includes('13 PRO MAX')) return 68;
  if (m.includes('13 PRO')) return 65;
  if (m.includes('13')) return 60;
  if (m.includes('12 PRO MAX')) return 58;
  if (m.includes('12 PRO')) return 55;
  if (m.includes('12')) return 50;
  if (m.includes('11 PRO MAX')) return 48;
  if (m.includes('11 PRO')) return 45;
  if (m.includes('11')) return 40;
  if (m.includes('XS MAX') || m.includes('XS')) return 38;
  if (m.includes('XR') || m.includes('X')) return 35;
  if (m.includes('SE 2022') || m.includes('SE 2020') || m.includes('8')) return 32;
  return 30; // iPhone 6, 6s, 7, 5, etc.
}

// Búsqueda inteligente por nombre en las tablas de gremio
function findGuildCost(map, modelName, fallback = 35) {
  const norm = (modelName || '').toLowerCase().trim();
  
  // Coincidencia exacta
  for (const [k, v] of Object.entries(map)) {
    if (k.toLowerCase() === norm) return v;
  }

  // Coincidencia parcial ordenada por especificidad (ej: 13 Pro Max antes que 13)
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const cleanKey = k.toLowerCase().replace('iphone ', '');
    const cleanNorm = norm.replace('iphone ', '');
    if (cleanNorm.includes(cleanKey) || cleanKey.includes(cleanNorm)) {
      return map[k];
    }
  }

  return fallback;
}

export function getGuildPlacaCost(modelName) {
  return findGuildCost(GUILD_IPHONE_DATA.placa, modelName, 75);
}

export function getGuildBateriaCost(modelName) {
  return findGuildCost(GUILD_IPHONE_DATA.bateria, modelName, 35);
}

export function getGuildTapaCost(modelName) {
  return findGuildCost(GUILD_IPHONE_DATA.tapa, modelName, 40);
}

// --- CLASIFICACIÓN DE GENERACIONES DE IPHONE PARA REGLAS TÉCNICAS Y LEGALES ---
export function getIphoneGenerationInfo(modelName) {
  const m = (modelName || '').toLowerCase().trim();

  // 1. TAPA TRASERA:
  // iPhone 6 al 7 Plus (y iPhone 5, etc.): Chasis de aluminio unibody (SIN vidrio trasero).
  // iPhone 8 hasta iPhone 16/17: Vidrio trasero templado procesable con láser / proceso térmico.
  const isAluminumBack = (
    m.includes('iphone 6') || 
    m.includes('iphone 7') || 
    m.includes('iphone 5') || 
    (m.includes('iphone se') && !m.includes('2020') && !m.includes('2022') && !m.includes('2da') && !m.includes('3ra'))
  );

  const hasBackGlass = !isAluminumBack && (
    m.includes('iphone 8') ||
    m.includes('iphone x') ||
    m.includes('iphone 1') || // iPhone 11, 12, 13, 14, 15, 16, 17
    m.includes('se (2da') ||
    m.includes('se (3ra') ||
    m.includes('se 2020') ||
    m.includes('se 2022')
  );

  // 2. BATERÍAS:
  // - iPhone 6 al 8 Plus / X: Opción estándar (muestra condición 100% de salud automáticamente sin bloqueo de serial en iOS).
  // - iPhone XS, XR, SE 2020 en adelante: Serialización de batería (opción económica con aviso vs traspaso de flex BMS al 100%).
  const isBatteryWithoutBmsLock = (
    m.includes('iphone 6') ||
    m.includes('iphone 7') ||
    m.includes('iphone 8') ||
    m.includes('iphone 5') ||
    (m.includes('iphone x') && !m.includes('xr') && !m.includes('xs')) ||
    (m.includes('iphone se') && !m.includes('2020') && !m.includes('2022') && !m.includes('2da') && !m.includes('3ra'))
  );

  // 3. PANTALLAS / MÓDULOS:
  // - iPhone 6 al 8 Plus / X / XS / XR / SE: Módulo Incell/OLED Premium con reprogramación True Tone sin aviso bloqueante de display IC.
  // - iPhone 11 en adelante: Serialización de pantalla en iOS (Módulo Premium con aviso vs Trasplante de microchip IC sin aviso).
  const isScreenBefore11 = (
    m.includes('iphone 6') ||
    m.includes('iphone 7') ||
    m.includes('iphone 8') ||
    m.includes('iphone 5') ||
    m.includes('iphone x') || // X, XS, XS Max, XR
    m.includes('iphone se')   // SE 2020 y 2022
  );

  return {
    hasBackGlass,
    isAluminumBack,
    isBatteryWithoutBmsLock,
    isScreenBefore11
  };
}

// --- MODALIDADES DE PANTALLAS SEGÚN MODELO ---

// iPhone 6 al 8 Plus / X / XS / XR:
export const IPHONE_SCREEN_MODALITIES_PRE_11 = [
  {
    key: 'screen_premium',
    name: 'Calidad Premium (Excelente brillo, color y respuesta táctil)',
    badge: 'True Tone Incluido',
    iosNotice: 'Con reprogramación de True Tone de fábrica incluida',
    description: 'Pantalla de alta calidad con colores nítidos, excelente brillo y respuesta táctil inmediata. Incluye reprogramación de True Tone.',
    defaultLabor: 30000
  }
];

// iPhone 11 en adelante (11, 11 Pro, 12, 13, 14, 15, 16):
export const IPHONE_SCREEN_MODALITIES_POST_11 = [
  {
    key: 'compatible_unknown',
    name: 'Calidad Premium (Excelente brillo, color y respuesta táctil)',
    badge: 'Opción Recomendada',
    iosNotice: 'Mantiene True Tone. Muestra aviso de pieza cambiada en Ajustes sin afectar el uso',
    description: 'Pantalla de máxima calidad visual y táctil manteniendo True Tone activo. Muestra aviso informativo en Ajustes según la política de Apple.',
    defaultLabor: 32000
  },
  {
    key: 'ic_transplant',
    name: 'Calidad Original (Conserva todas las funciones de fábrica)',
    badge: 'Laboratorio Sin Avisos',
    iosNotice: 'Sin avisos en Ajustes (Conserva funciones originales al 100%)',
    description: 'Servicio de laboratorio de microelectrónica: se trasplanta el microchip integrado de tu pantalla original para evitar avisos en iOS.',
    defaultLabor: 55000
  }
];

// --- MODALIDADES DE BATERÍAS SEGÚN MODELO ---

// iPhone 6 al 8 Plus / X:
export const IPHONE_BATTERY_MODALITIES_PRE_XS = [
  {
    key: 'battery_standard_100',
    name: 'Batería Nueva de Alta Capacidad y Rendimiento',
    badge: 'Condición 100% Automática',
    iosNotice: 'Indica condición 100% en Ajustes automáticamente',
    description: 'Batería nueva con celdas de máxima durabilidad y rendimiento garantizado.',
    defaultLabor: 25000
  }
];

// iPhone XS, XR, SE 2020 en adelante (hasta serie 16/17):
export const IPHONE_BATTERY_MODALITIES_POST_XS = [
  {
    key: 'standard_unknown',
    name: 'Batería Nueva de Alta Capacidad y Rendimiento',
    badge: 'Rápido y Económico',
    iosNotice: 'Aclaración: Los iPhones de esta generación muestran aviso de pieza cambiada en Ajustes sin afectar el rendimiento',
    description: 'Reemplazo directo de celda nueva de alta capacidad. Rápido y accesible. El equipo rinde con total autonomía.',
    defaultLabor: 28000
  },
  {
    key: 'bms_transplant',
    name: 'Batería con Traspaso de Flex Original & Reprogramación 100%',
    badge: 'Servicio de Laboratorio',
    iosNotice: 'Conserva flex original Apple y muestra 100% de salud en Ajustes',
    description: 'Servicio de laboratorio: conserva el flex original, se coloca celda nueva y se reprograma la condición al 100% sin aviso de pieza.',
    defaultLabor: 48000
  }
];

// Retorna las modalidades válidas para un modelo y falla determinados
export function getIphoneModalities(modelName, issueId) {
  const genInfo = getIphoneGenerationInfo(modelName);

  if (issueId === 'screen') {
    return genInfo.isScreenBefore11 ? IPHONE_SCREEN_MODALITIES_PRE_11 : IPHONE_SCREEN_MODALITIES_POST_11;
  }

  if (issueId === 'battery') {
    return genInfo.isBatteryWithoutBmsLock ? IPHONE_BATTERY_MODALITIES_PRE_XS : IPHONE_BATTERY_MODALITIES_POST_XS;
  }

  return null;
}

// Generador de configuración predeterminada para todos los iPhone con datos de gremio
export function buildDefaultIphoneConfigs() {
  const iphoneModels = ALL_MODELS.filter(m => m.type === 'iphone');
  const configs = {};

  iphoneModels.forEach(item => {
    const marginUsd = getMontecIphoneMarginUsd(item.model);
    const guildPlacaUsd = getGuildPlacaCost(item.model);
    const guildBateriaUsd = getGuildBateriaCost(item.model);
    const guildTapaUsd = getGuildTapaCost(item.model);

    // Mano de obra sugerida en base a la ganancia en USD
    const screenBaseLabor = Math.round((marginUsd * 800) / 1000) * 1000;
    const batteryBaseLabor = Math.round((marginUsd * 650) / 1000) * 1000;

    configs[item.id] = {
      modelId: item.id,
      modelName: item.model,
      montecMarginUsd: marginUsd,
      
      // Costos del gremio en USD
      guildPlacaUsd,
      guildBateriaUsd,
      guildTapaUsd,

      // Mano de obra de pantalla en ARS
      screenLabor: {
        compatible_unknown: Math.max(30000, screenBaseLabor),
        ic_transplant: Math.max(50000, Math.round(screenBaseLabor * 1.55 / 1000) * 1000),
        screen_premium: Math.max(30000, screenBaseLabor),
        screen_incell_oled_premium: Math.max(30000, screenBaseLabor)
      },

      // Mano de obra de batería en ARS
      batteryLabor: {
        standard_unknown: Math.max(25000, batteryBaseLabor),
        bms_transplant: Math.max(45000, Math.round(batteryBaseLabor * 1.6 / 1000) * 1000),
        battery_standard_100: Math.max(25000, batteryBaseLabor)
      },

      notes: `Gremio Placa: $${guildPlacaUsd} USD | Tapa: $${guildTapaUsd} USD | Ganancia Montec: $${marginUsd} USD`
    };
  });

  return configs;
}
