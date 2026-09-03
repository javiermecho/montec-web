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

// Modalidades para Pantalla de iPhone
export const IPHONE_SCREEN_MODALITIES = [
  {
    key: 'compatible_unknown',
    name: 'Compatible Premium (OLED/Incell GX)',
    badge: 'Más Económica',
    iosNotice: 'Con aviso informativo en Ajustes de iOS',
    description: 'Módulo OLED/Premium compatible. Muestra aviso de pieza desconocida en iOS pero funciona con total fluidez táctil.',
    defaultLabor: 30000
  },
  {
    key: 'ic_transplant',
    name: 'Sin Aviso / Trasplante IC (TrueTone)',
    badge: 'Especialidad Laboratorio',
    iosNotice: '100% Libre de aviso en Ajustes (TrueTone activo)',
    description: 'Microelectrónica de laboratorio: se trasplanta el chip IC original o módulo JCID pre-programado para no emitir alertas.',
    defaultLabor: 55000
  },
  {
    key: 'original_used',
    name: 'Original Segunda Mano (Desarme)',
    badge: '100% Apple Fábrica',
    iosNotice: 'Pieza extraída de desarme original Apple',
    description: 'Módulo original Apple recuperado de otro equipo. Máxima calidad de colorimetría, brillo nits y respuesta táctil original.',
    defaultLabor: 42000
  }
];

// Modalidades para Batería de iPhone
export const IPHONE_BATTERY_MODALITIES = [
  {
    key: 'standard_unknown',
    name: 'Cambio Estándar',
    badge: 'Económica',
    iosNotice: 'Con aviso de Pieza Desconocida (sin % de salud)',
    description: 'Batería nueva de alta capacidad. En Ajustes figura pieza desconocida y no marca porcentaje.',
    defaultLabor: 25000
  },
  {
    key: 'bms_transplant',
    name: 'Mantener Condición 100%',
    badge: 'Recomendada Laboratorio',
    iosNotice: 'Condición al 100% y Sin aviso en Ajustes',
    description: 'Microelectrónica: se desuelda la placa BMS original, se suelda celda nueva, flex tag-on y se resetean ciclos a 0 y salud al 100%.',
    defaultLabor: 48000
  },
  {
    key: 'original_used',
    name: 'Original Segunda Mano',
    badge: 'Original Apple',
    iosNotice: 'Batería original comprobada (>85% salud)',
    description: 'Batería original de despiece Apple en óptimo estado de salud.',
    defaultLabor: 32000
  }
];

// Generador de configuración predeterminada para todos los iPhone con datos de gremio
export function buildDefaultIphoneConfigs() {
  const iphoneModels = ALL_MODELS.filter(m => m.type === 'iphone');
  const configs = {};

  iphoneModels.forEach(item => {
    const marginUsd = getMontecIphoneMarginUsd(item.model);
    const guildPlacaUsd = getGuildPlacaCost(item.model);
    const guildBateriaUsd = getGuildBateriaCost(item.model);
    const guildTapaUsd = getGuildTapaCost(item.model);

    // Mano de obra sugerida en base a la ganancia en USD (asumiendo tipo de cambio base o calibración)
    // Pantalla
    const screenBaseLabor = Math.round((marginUsd * 800) / 1000) * 1000;
    // Batería
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
        original_used: Math.max(38000, Math.round(screenBaseLabor * 1.25 / 1000) * 1000)
      },

      // Mano de obra de batería en ARS
      batteryLabor: {
        standard_unknown: Math.max(25000, batteryBaseLabor),
        bms_transplant: Math.max(45000, Math.round(batteryBaseLabor * 1.6 / 1000) * 1000),
        original_used: Math.max(30000, Math.round(batteryBaseLabor * 1.2 / 1000) * 1000)
      },

      notes: `Gremio Placa: $${guildPlacaUsd} USD | Tapa: $${guildTapaUsd} USD | Ganancia Montec: $${marginUsd} USD`
    };
  });

  return configs;
}
