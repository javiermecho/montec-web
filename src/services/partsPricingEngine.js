// Motor de Cotización Inteligente de Módulos
// Basado en repuestos reales del proveedor, tasa Dólar Blue y reglas comerciales de Montec

import { CELLSTORE_PARTS } from '../data/cellstoreParts.js';
import { GRUPOARMAR_PARTS } from '../data/grupoarmarParts.js';
import { SMARTSUPPLY_PARTS } from '../data/smartsupplyParts.js';
import { SOULFIX_PARTS } from '../data/soulfixParts.js';
import { DEFAULT_FALLBACK_RATE } from './dolarService.js';

function formatToModule(p, provider) {
  const usd = p.price_usd || (p.price_cash_ars ? p.price_cash_ars / DEFAULT_FALLBACK_RATE : 0);
  return {
    id: `${provider}-${p.sku || p.name}`,
    raw_name: p.name || '',
    brand: p.brand || '',
    part_type: p.part_type || (p.name && p.name.toUpperCase().startsWith('MODULO') ? 'modulo' : ''),
    cost_usd: usd,
    cost_ars: p.price_cash_ars || Math.round(usd * DEFAULT_FALLBACK_RATE),
    in_stock: p.in_stock !== false,
    provider
  };
}

const ALL_RAW_MODULES = [
  ...CELLSTORE_PARTS.map(p => formatToModule(p, 'cellstore')),
  ...GRUPOARMAR_PARTS.map(p => formatToModule(p, 'grupoarmar')),
  ...SMARTSUPPLY_PARTS.map(p => formatToModule(p, 'smartsupply')),
  ...SOULFIX_PARTS.map(p => formatToModule(p, 'soulfix'))
];

// 1. Filtrar repuestos válidos: solo módulos reales de pantalla completa (excluyendo conectores FPC, flex, herramientas y calidad Incell/TFT)
export const VALID_MODULES = ALL_RAW_MODULES.filter(part => {
  const upper = part.raw_name.toUpperCase();
  // Excluir estrictamente partes secundarias, conectores y herramientas
  if (/CONECTOR|FPC|FLEX|PIN DE CARGA|CAMARA|LENTE|TAPA|BANDEJA|SUBPLACA|PLACA|HUELLA|ANTENA|HERRAMIENTA|ESTACION|ALCOHOL|MALLA|ESTAÑO|PEGAMENTO|MAQUINA|DESTORNILLADOR|BATERIA|CABLE|CARGADOR|AURICULAR|PARLANTE|ALTAVOZ|MICROFONO|SENSOR/.test(upper)) {
    return false;
  }
  // Excluir Incell y TFT
  if (upper.includes('INCELL') || upper.includes('TFT')) return false;
  // Debe ser módulo o pantalla
  return /MODULO|PANTALLA/i.test(upper);
});

// Parámetros de reglas de negocio
export const PRICING_RULES = {
  MIN_LABOR_ARS: 30000,    // Mano de obra mínima garantizada
  MAX_MARGIN_ARS: 80000,   // Margen / ganancia máxima en gama alta
  ROUND_STEP: 500          // Redondeo comercial amigable
};

/**
 * Calcula el precio final de un módulo en ARS según las reglas de Montec:
 * - costo_ars = costo real en efectivo (o costo_usd * dolar_rate)
 * - ganancia = min(maxMargin, max(minLabor, markupProfit))
 * - precio_final = round(costo_ars + ganancia)
 */
export function calculatePartPrice(part, dolarRate = DEFAULT_FALLBACK_RATE, customRules = null) {
  const minLabor = customRules?.minLaborArs !== undefined ? Number(customRules.minLaborArs) : PRICING_RULES.MIN_LABOR_ARS;
  const maxMargin = customRules?.maxMarginArs !== undefined ? Number(customRules.maxMarginArs) : PRICING_RULES.MAX_MARGIN_ARS;
  const multiplier = customRules?.markupMultiplier !== undefined ? Number(customRules.markupMultiplier) : 2.0;

  const costoUsd = part.cost_usd || 0;
  const costoArs = part.cost_ars ? part.cost_ars : (costoUsd * dolarRate);

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
