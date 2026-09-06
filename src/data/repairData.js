// Base de datos local inicial de reparaciones, modelos y fallas comunes para montec
// Esta estructura se integra con el cotizador interactivo y se sincroniza con el backend de Railway

export const DEVICE_TYPES = [
  { id: 'iphone', name: 'iPhone / Apple', icon: 'Smartphone', badge: 'Especialidad Laboratorio' },
  { id: 'android', name: 'Smartphone Android', icon: 'Cpu', badge: 'Samsung • Motorola • Xiaomi' },
  { id: 'notebook', name: 'Notebook / Mac', icon: 'Laptop', badge: 'Hardware & Microelectrónica' },
];

import { ALL_MODELS } from './allModels.js';

export const MODELS_DATABASE = ALL_MODELS;

export const MINIMUM_REPAIR_PRICES = {
  android: {
    'screen': 55000,        // cambio de modulo de pantalla $55.000
    'battery': 45000,       // cambio de bateria $45.000
    'charging-port': 30000, // reparacion de carga $30.000
    'software': 25000,      // reparacion de software $25.000
    'speaker': 38000,       // reparacion de sonido $38.000
    'motherboard': 55000,   // reparacion en placa $55.000
    'back-glass': 35000     // cambio de tapa o carcasa $35.000
  },
  iphone: {
    'screen': 65000,        // modulo de pantalla iPhone minimo mas alto
    'battery': 50000,       // bateria iPhone minimo mas alto
    'charging-port': 38000, // carga iPhone
    'software': 30000,      // software iPhone
    'speaker': 45000,       // sonido iPhone
    'motherboard': 55000,   // reparacion en placa iPhone (minimo $55.000)
    'back-glass': 65000     // tapa trasera laser iPhone
  },
  notebook: {
    'screen': 75000,
    'battery': 48000,
    'charging-port': 35000,
    'software': 25000,
    'speaker': 42000,
    'motherboard': 65000,
    'thermal-maintenance': 28000,
    'upgrade-storage': 45000
  }
};

export function getMinimumRepairPrice(deviceType, issueId) {
  const deviceFloors = MINIMUM_REPAIR_PRICES[deviceType] || MINIMUM_REPAIR_PRICES.android;
  return deviceFloors[issueId] || 0;
}

export const ISSUE_TYPES = [
  {
    id: 'screen',
    name: 'Módulo / Pantalla Completa',
    description: 'Vidrio roto, líneas en display, pantalla en negro o falla de táctil.',
    duration: 'En 45 a 60 min (Express)',
    warranty: '90 días de garantía escrita',
    badge: 'Repuesto Seleccionado',
    icon: 'Maximize2',
    applicableDevices: ['iphone', 'android', 'notebook'],
    basePrices: {
      iphone: { min: 65000, max: 145000 },
      android: { min: 55000, max: 95000 },
      notebook: { min: 75000, max: 165000 }
    }
  },
  {
    id: 'battery',
    name: 'Cambio de Batería Original/Premium',
    description: 'Se descarga rápido, se apaga de golpe o batería hinchada con riesgo.',
    duration: 'En 40 a 60 min (En el acto)',
    warranty: '90 días de garantía escrita',
    badge: 'Celdas Nuevas 100%',
    icon: 'BatteryCharging',
    applicableDevices: ['iphone', 'android', 'notebook'],
    basePrices: {
      iphone: { min: 50000, max: 85000 },
      android: { min: 45000, max: 65000 }, // Piso mínimo $45.000 (Repuesto + $35.000 mano de obra)
      notebook: { min: 48000, max: 95000 }
    }
  },
  {
    id: 'charging-port',
    name: 'Reparación de Carga (Pin / Placa)',
    description: 'Falso contacto, no carga, humedad o reemplazo de pin / subplaca de carga completa.',
    duration: 'En 45 a 90 min',
    warranty: '90 días de garantía escrita',
    badge: 'Limpieza o Reemplazo',
    icon: 'Zap',
    applicableDevices: ['iphone', 'android', 'notebook'],
    basePrices: {
      iphone: { min: 38000, max: 55000 },
      android: { min: 30000, max: 48000 }, // Piso mínimo $30.000
      notebook: { min: 35000, max: 62000 }
    }
  },
  {
    id: 'software',
    name: 'Reparación de Software / Sistema',
    description: 'Flasheo, recuperación de booteo o reinicios en logo, reinstalación de sistema operativo, desbrickeo y optimización.',
    duration: 'En el día (1 a 3 hs)',
    warranty: 'Garantía de funcionamiento y estabilidad',
    badge: 'Soporte Especializado',
    icon: 'Terminal',
    applicableDevices: ['iphone', 'android', 'notebook'],
    basePrices: {
      iphone: { min: 30000, max: 45000 },
      android: { min: 25000, max: 38000 }, // Piso mínimo $25.000
      notebook: { min: 25000, max: 48000 }
    }
  },
  {
    id: 'speaker',
    name: 'Reparación de Sonido (Parlante / Altavoz / Buzzer)',
    description: 'Sin sonido en llamadas/música, sonido distorsionado, fritura, bajo volumen o falla de buzzer.',
    duration: 'En 40 a 60 min',
    warranty: '90 días de garantía escrita',
    badge: 'Sonido Nítido',
    icon: 'Volume2',
    applicableDevices: ['iphone', 'android', 'notebook'],
    basePrices: {
      iphone: { min: 45000, max: 65000 },
      android: { min: 38000, max: 48000 }, // Piso mínimo $38.000
      notebook: { min: 42000, max: 75000 }
    }
  },
  {
    id: 'motherboard',
    name: 'Reparación en Placa (Sonido, Señal, Mojado, En Corto, Face ID)',
    description: 'Fallas de audio IC (sin sonido/micrófono), baseband (sin señal), equipo mojado, en corto, Face ID desactivado o reinicios constantes.',
    duration: '24 a 48 hs (Laboratorio Especializado)',
    warranty: '30 días escrita',
    badge: 'Microelectrónica Gremio',
    icon: 'Cpu',
    applicableDevices: ['iphone', 'android', 'notebook'],
    basePrices: {
      iphone: { min: 80000, max: 350000 }, // Piso mínimo $55.000
      android: { min: 55000, max: 95000 },  // Piso mínimo $55.000
      notebook: { min: 65000, max: 155000 }
    }
  },
  {
    id: 'back-glass',
    name: 'Cambio de Tapa Trasera de Vidrio (Láser / Proceso Térmico)',
    description: 'Tapa trasera trizada o rota. En iPhone remoción con láser preservando chasis y MagSafe; en Android cambio de tapa original o carcasa.',
    duration: 'En el día (2 a 4 hs)',
    warranty: '30 días escrita',
    badge: 'Láser & Precisión',
    icon: 'Smartphone',
    applicableDevices: ['iphone', 'android'],
    basePrices: {
      iphone: { min: 65000, max: 195000 },
      android: { min: 35000, max: 60000 }, // Piso mínimo $35.000
      notebook: { min: 45000, max: 95000 }
    }
  },
  {
    id: 'thermal-maintenance',
    name: 'Mantenimiento Térmico & Limpieza',
    description: 'Ventilador ruidoso, recalentamiento extremo, cambio de pasta térmica Artic Silver.',
    duration: 'En 2 a 4 hs',
    warranty: 'Garantía de rendimiento óptimo',
    badge: 'Pasta Térmica Alta Gama',
    icon: 'Fan',
    applicableDevices: ['notebook'], // Exclusivo de computadoras
    basePrices: {
      iphone: { min: 18000, max: 28000 },
      android: { min: 16000, max: 25000 },
      notebook: { min: 28000, max: 48000 }
    }
  },
  {
    id: 'upgrade-storage',
    name: 'Upgrade SSD / Memoria RAM',
    description: 'Acelera tu notebook hasta 10 veces más con SSD NVMe y ampliación de RAM.',
    duration: 'En el día (2 a 4 hs)',
    warranty: 'Garantía 12 meses en hardware',
    badge: 'Máximo Rendimiento',
    icon: 'HardDrive',
    applicableDevices: ['notebook'], // Exclusivo de computadoras
    basePrices: {
      iphone: { min: 45000, max: 85000 },
      android: { min: 22000, max: 38000 },
      notebook: { min: 45000, max: 115000 }
    }
  }
];

// Función para calcular presupuesto estimado con ajuste según gama de equipo
export function calculateEstimate(deviceType, modelId, issueId) {
  const model = MODELS_DATABASE.find(m => m.id === modelId);
  const issue = ISSUE_TYPES.find(i => i.id === issueId);

  if (!issue) return null;

  const baseRange = issue.basePrices[deviceType] || issue.basePrices.android;
  let multiplier = 1.0;

  if (model) {
    const isRecent = model.year >= 2023;
    const isApple = model.brand === 'Apple';
    const isPro = model.model.toLowerCase().includes('pro') || model.model.toLowerCase().includes('ultra');

    if (isApple && isPro) multiplier = 1.35;
    else if (isApple) multiplier = 1.15;
    else if (isPro) multiplier = 1.25;
    else if (isRecent) multiplier = 1.1;
  }

  const floorMin = getMinimumRepairPrice(deviceType, issueId);
  const min = Math.max(floorMin, Math.round((baseRange.min * multiplier) / 500) * 500);
  const max = Math.max(min, Math.round((baseRange.max * multiplier) / 500) * 500);

  return {
    minPrice: min,
    maxPrice: max,
    duration: issue.duration,
    warranty: issue.warranty,
    issueName: issue.name,
    issueBadge: issue.badge,
    modelName: model ? model.model : 'Modelo Personalizado',
    brand: model ? model.brand : 'Genérico'
  };
}
