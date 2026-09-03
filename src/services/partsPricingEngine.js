// Motor de Cotización Inteligente de Módulos
// Basado en repuestos reales del proveedor, tasa Dólar Blue y reglas comerciales de Montec

import { SUPPLIER_PARTS } from '../data/supplierParts.js';
import { DEFAULT_FALLBACK_RATE } from './dolarService.js';

// 1. Filtrar repuestos válidos: solo módulos, excluyendo estrictamente INCELL y TFT
export const VALID_MODULES = SUPPLIER_PARTS.filter(part => {
  if (part.part_type !== 'modulo') return false;
  const upper = part.raw_name.toUpperCase();
  if (upper.includes('INCELL') || upper.includes('TFT')) return false;
  return true;
});

// Parámetros de reglas de negocio
export const PRICING_RULES = {
  MIN_LABOR_ARS: 30000,    // Mano de obra mínima garantizada
  MAX_MARGIN_ARS: 80000,   // Margen / ganancia máxima en gama alta
  ROUND_STEP: 500          // Redondeo comercial amigable
};

/**
 * Calcula el precio final de un módulo en ARS según las reglas de Montec:
 * - costo_ars = costo_usd * dolar_rate
 * - ganancia = min(maxMargin, max(minLabor, markupProfit))
 * - precio_final = round(costo_ars + ganancia)
 */
export function calculatePartPrice(part, dolarRate = DEFAULT_FALLBACK_RATE, customRules = null) {
  const minLabor = customRules?.minLaborArs !== undefined ? Number(customRules.minLaborArs) : PRICING_RULES.MIN_LABOR_ARS;
  const maxMargin = customRules?.maxMarginArs !== undefined ? Number(customRules.maxMarginArs) : PRICING_RULES.MAX_MARGIN_ARS;
  const multiplier = customRules?.markupMultiplier !== undefined ? Number(customRules.markupMultiplier) : 2.0;

  const costoUsd = part.cost_usd || 0;
  const costoArs = costoUsd * dolarRate;

  // Ganancia: multiplicador sobre costo con piso de mano de obra mínima y tope para gama alta
  const markupProfit = costoArs * Math.max(0.5, multiplier - 1);
  const ganancia = Math.min(maxMargin, Math.max(minLabor, markupProfit));
  const rawFinal = costoArs + ganancia;
  const finalPrice = Math.round(rawFinal / PRICING_RULES.ROUND_STEP) * PRICING_RULES.ROUND_STEP;

  return {
    id: part.id,
    raw_name: part.raw_name,
    brand: part.brand,
    cost_usd: costoUsd,
    cost_ars: Math.round(costoArs),
    ganancia: Math.round(ganancia),
    final_price: finalPrice,
    tags: part.tags || [],
    hasFrame: (part.tags || []).includes('CON MARCO'),
    qualityType: detectQualityType(part.raw_name)
  };
}

/**
 * Detecta la calidad descriptiva para mostrar al cliente
 */
function detectQualityType(name) {
  const upper = name.toUpperCase();
  if (upper.includes('ORIGINAL') || upper.includes('SERVICE PACK')) return 'Original de Fábrica';
  if (upper.includes('AMOLED')) return 'Super AMOLED';
  if (upper.includes('OLED')) return 'OLED Premium';
  if (upper.includes('PREMIUM')) return 'Calidad Premium';
  return 'Calidad Premium Garantizada';
}

/**
 * Normaliza nombres para comparación flexible y extrae tokens clave
 */
function extractCoreTokens(str) {
  const ignored = new Set([
    'samsung', 'motorola', 'moto', 'apple', 'iphone', 'xiaomi', 'redmi', 'lg', 'tcl', 
    'galaxy', 'smartphone', 'serie', 'celular', 'de', 'con', 'el', 'la', 'los', 'las', 'gen'
  ]);

  return (str || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // sin acentos
    .replace(/[\(\)\/\-_]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 0 && !ignored.has(t));
}

/**
 * Busca módulos compatibles en la base de repuestos del proveedor (excluyendo Incell y TFT)
 */
export function findModulesForModel(modelName, brand = '') {
  if (!modelName) return [];

  const normBrand = (brand || '').toLowerCase();
  const tokens = extractCoreTokens(modelName);

  if (tokens.length === 0) return [];

  return VALID_MODULES.filter(part => {
    // 1. Verificación de marca
    const partBrand = (part.brand || '').toLowerCase();
    if (normBrand) {
      if (normBrand === 'apple' && partBrand !== 'apple') return false;
      if (normBrand !== 'apple' && partBrand !== normBrand && !part.raw_name.toLowerCase().includes(normBrand)) {
        return false;
      }
    }

    const partName = part.raw_name.toLowerCase();

    // 2. Todos los tokens principales deben estar presentes en el nombre del repuesto
    // Tokens como '5g' o '4g' son opcionales si no están en el repuesto
    return tokens.every(tok => {
      if (tok === '5g' || tok === '4g' || tok === 'plus' || tok === 'pro' || tok === 'ultra') {
        // Para variantes como plus/pro/ultra/5g se verifica con más precisión
        if (tok === '5g' || tok === '4g') return true;
        const r = new RegExp('(\\b|[^a-z0-9])' + tok + '(\\b|[^a-z0-9])', 'i');
        return r.test(partName);
      }
      const r = new RegExp('(\\b|[^a-z0-9])' + tok + '(\\b|[^a-z0-9])', 'i');
      return r.test(partName);
    });
  });
}

/**
 * Calcula cotización completa de módulo para un modelo de equipo dado
 */
export function calculateModuleEstimate(modelName, brand, dolarRate = DEFAULT_FALLBACK_RATE, customRules = null) {
  const matches = findModulesForModel(modelName, brand);

  if (matches.length === 0) {
    return null; // Indica que debe usar fallback genérico
  }

  // Calcular precios para todas las variantes válidas (sin Incell) con reglas dinámicas
  const pricedOptions = matches.map(part => calculatePartPrice(part, dolarRate, customRules));

  // Ordenar por precio ascendente
  pricedOptions.sort((a, b) => a.final_price - b.final_price);

  const minOption = pricedOptions[0];
  const maxOption = pricedOptions[pricedOptions.length - 1];

  return {
    success: true,
    isDirectMatch: true,
    minPrice: minOption.final_price,
    maxPrice: maxOption.final_price,
    minCostUsd: minOption.cost_usd,
    maxCostUsd: maxOption.cost_usd,
    optionsCount: pricedOptions.length,
    options: pricedOptions,
    bestOption: minOption,
    duration: '45 a 60 minutos en el acto (Express)',
    warranty: '90 días de garantía escrita',
    qualityLabel: minOption.qualityType === maxOption.qualityType 
      ? minOption.qualityType 
      : `${minOption.qualityType} a ${maxOption.qualityType}`,
    badge: 'Repuesto de Proveedor MDP (Sin Incell)'
  };
}
