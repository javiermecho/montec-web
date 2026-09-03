// Base de datos local inicial de reparaciones, modelos y fallas comunes para montec
// Esta estructura se integra con el cotizador interactivo y se sincroniza con el backend de Railway

export const DEVICE_TYPES = [
  { id: 'iphone', name: 'iPhone / Apple', icon: 'Smartphone', badge: 'Especialidad Laboratorio' },
  { id: 'android', name: 'Smartphone Android', icon: 'Cpu', badge: 'Samsung • Motorola • Xiaomi' },
  { id: 'notebook', name: 'Notebook / Mac', icon: 'Laptop', badge: 'Hardware & Microelectrónica' },
];

import { ALL_MODELS } from './allModels.js';

export const MODELS_DATABASE = ALL_MODELS;

export const ISSUE_TYPES = [
  {
    id: 'screen',
    name: 'Módulo / Pantalla Completa',
    description: 'Vidrio roto, líneas en display, pantalla en negro o falla de táctil.',
    duration: 'En 45 a 60 min (Express)',
    warranty: '90 días de garantía escrita',
    badge: 'Repuesto Seleccionado',
    icon: 'Maximize2',
    basePrices: {
      iphone: { min: 45000, max: 145000 },
      android: { min: 28000, max: 78000 },
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
    basePrices: {
      iphone: { min: 38000, max: 75000 },
      android: { min: 24000, max: 42000 },
      notebook: { min: 48000, max: 95000 }
    }
  },
  {
    id: 'charging-port',
    name: 'Pin / Puerto de Carga',
    description: 'Falso contacto, no carga, cable flojo o suciedad compactada.',
    duration: 'En 45 a 90 min',
    warranty: '90 días de garantía escrita',
    badge: 'Limpieza o Reemplazo',
    icon: 'Zap',
    basePrices: {
      iphone: { min: 25000, max: 48000 },
      android: { min: 18000, max: 32000 },
      notebook: { min: 35000, max: 62000 }
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
    basePrices: {
      iphone: { min: 80000, max: 350000 },
      android: { min: 35000, max: 85000 },
      notebook: { min: 65000, max: 155000 }
    }
  },
  {
    id: 'back-glass',
    name: 'Cambio de Tapa Trasera (Glass Trasero)',
    description: 'Vidrio trasero trizado o astillado. Remoción precisa con tecnología láser y repuesto original manteniendo carga inalámbrica MagSafe y estética.',
    duration: 'En el día (3 a 5 hs)',
    warranty: '30 días escrita',
    badge: 'Láser & Precisión',
    icon: 'Smartphone',
    basePrices: {
      iphone: { min: 65000, max: 195000 },
      android: { min: 28000, max: 60000 },
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

  const min = Math.round((baseRange.min * multiplier) / 500) * 500;
  const max = Math.round((baseRange.max * multiplier) / 500) * 500;

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
