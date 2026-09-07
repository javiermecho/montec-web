// Servicio de Búsqueda y Vinculación de Repuestos para Taller de Montec
// Integra catálogos reales de CellStore MDP, Smart Supply, SoulFix y Grupo Armar

import { CELLSTORE_PARTS } from '../data/cellstoreParts.js';
import { SMARTSUPPLY_PARTS } from '../data/smartsupplyParts.js';
import { SOULFIX_PARTS } from '../data/soulfixParts.js';
import { GRUPOARMAR_PARTS } from '../data/grupoarmarParts.js';

// Lista unificada de todos los repuestos catalogados con su proveedor y enlace
const ALL_CATALOG_PARTS = [
  ...CELLSTORE_PARTS.map(p => ({
    name: p.name || '',
    brand: p.brand || '',
    part_type: p.part_type || '',
    price_cash_ars: p.price_cash_ars || (p.price_usd ? Math.round(p.price_usd * 1545) : 0),
    price_usd: p.price_usd || 0,
    in_stock: p.in_stock !== false,
    url: p.url || '',
    sku: p.sku || '',
    provider: 'CellStore MDP',
    provider_key: 'cellstore'
  })),
  ...SMARTSUPPLY_PARTS.map(p => ({
    name: p.name || '',
    brand: p.brand || '',
    part_type: p.part_type || '',
    price_cash_ars: p.price_cash_ars || (p.price_usd ? Math.round(p.price_usd * 1545) : 0),
    price_usd: p.price_usd || 0,
    in_stock: p.in_stock !== false,
    url: p.url || '',
    sku: p.sku || '',
    provider: 'Smart Supply',
    provider_key: 'smartsupply'
  })),
  ...SOULFIX_PARTS.map(p => ({
    name: p.name || '',
    brand: p.brand || '',
    part_type: p.part_type || '',
    price_cash_ars: p.price_cash_ars || (p.price_usd ? Math.round(p.price_usd * 1545) : 0),
    price_usd: p.price_usd || 0,
    in_stock: p.in_stock !== false,
    url: p.url || '',
    sku: p.sku || '',
    provider: 'SoulFix',
    provider_key: 'soulfix'
  })),
  ...GRUPOARMAR_PARTS.map(p => ({
    name: p.name || '',
    brand: p.brand || '',
    part_type: p.part_type || '',
    price_cash_ars: p.price_cash_ars || (p.price_usd ? Math.round(p.price_usd * 1545) : 0),
    price_usd: p.price_usd || 0,
    in_stock: p.in_stock !== false,
    url: p.url || '',
    sku: p.sku || '',
    provider: 'Grupo Armar',
    provider_key: 'grupoarmar'
  }))
];

/**
 * Normaliza y extrae palabras clave para comparar de manera flexible
 */
function extractTokens(str) {
  const ignored = new Set([
    'samsung', 'motorola', 'moto', 'apple', 'iphone', 'xiaomi', 'redmi', 'lg', 'tcl', 
    'galaxy', 'smartphone', 'serie', 'celular', 'de', 'con', 'el', 'la', 'los', 'las', 'gen', 'para'
  ]);

  return (str || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\(\)\/\-_]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 0 && !ignored.has(t));
}

/**
 * Detecta qué tipo de repuesto buscar a partir del ID de falla o texto libre
 */
export function detectPartCategory(issueId, repairText = '') {
  const text = (repairText + ' ' + (issueId || '')).toLowerCase();

  if (issueId === 'screen' || /pantalla|modulo|módulo|display|vidrio táctil|touch|glass/i.test(text)) {
    return {
      category: 'screen',
      label: 'Módulo de Pantalla',
      keywords: ['MODULO', 'PANTALLA'],
      exclude: ['CONECTOR', 'FPC', 'HERRAMIENTA', 'ESTACION', 'ALCOHOL', 'PEGAMENTO', 'ADHESIVO', 'MAQUINA']
    };
  }

  if (issueId === 'battery' || /bater|pila|celda|bateria|batería/i.test(text)) {
    return {
      category: 'battery',
      label: 'Batería',
      keywords: ['BATERIA', 'BATERÍA'],
      exclude: ['CONECTOR', 'PIN DE CARGA', 'ADHESIVO', 'HERRAMIENTA']
    };
  }

  if (issueId === 'charging-port' || /carga|pin|puerto|subplaca|placa de carga|flex de carga/i.test(text)) {
    return {
      category: 'charging-port',
      label: 'Pin / Placa de Carga',
      keywords: ['PIN DE CARGA', 'PLACA DE CARGA', 'SUBPLACA', 'FLEX DE CARGA'],
      exclude: ['HERRAMIENTA', 'ESTACION']
    };
  }

  if (issueId === 'back-glass' || /tapa|carcasa|back glass|vidrio trasero|chasis/i.test(text)) {
    return {
      category: 'back-glass',
      label: 'Tapa Trasera',
      keywords: ['TAPA'],
      exclude: ['HERRAMIENTA', 'MALLA']
    };
  }

  if (issueId === 'speaker' || /parlante|altavoz|sonido|buzzer|auricular/i.test(text)) {
    return {
      category: 'speaker',
      label: 'Parlante / Altavoz',
      keywords: ['PARLANTE', 'ALTAVOZ', 'BUZZER'],
      exclude: []
    };
  }

  if (issueId === 'camera' || /camara|cámara|lente/i.test(text)) {
    return {
      category: 'camera',
      label: 'Cámara / Lente',
      keywords: ['CAMARA', 'CÁMARA', 'LENTE'],
      exclude: []
    };
  }

  // Falla general o personalizada
  return {
    category: 'generic',
    label: repairText.trim() || 'Repuesto General',
    keywords: [],
    exclude: []
  };
}

/**
 * Busca repuestos compatibles en el catálogo según modelo, marca y tipo de falla
 */
export function searchPartsForRepair(modelName, brand = '', issueId = 'screen', repairText = '') {
  if (!modelName || modelName.trim().length < 2) return [];

  const tokens = extractTokens(modelName);
  const normBrand = (brand || '').toLowerCase();
  const categoryInfo = detectPartCategory(issueId, repairText);

  if (tokens.length === 0) return [];

  const results = ALL_CATALOG_PARTS.filter(part => {
    const partName = part.name.toUpperCase();
    const partBrand = (part.brand || '').toLowerCase();

    // 1. Coincidencia de marca si aplica
    if (normBrand) {
      if (normBrand === 'apple' && partBrand !== 'apple' && !partName.includes('IPHONE') && !partName.includes('APPLE')) {
        return false;
      }
      if (normBrand !== 'apple' && partBrand && partBrand !== normBrand && !partName.toLowerCase().includes(normBrand)) {
        return false;
      }
    }

    // 2. Coincidencia de categoría de repuesto (keywords)
    if (categoryInfo.keywords.length > 0) {
      const matchesKeyword = categoryInfo.keywords.some(k => partName.includes(k));
      if (!matchesKeyword) return false;
    }

    // 3. Exclusión de accesorios o herramientas no deseadas
    if (categoryInfo.exclude.length > 0) {
      const hasExcluded = categoryInfo.exclude.some(ex => partName.includes(ex));
      if (hasExcluded) return false;
    }

    // 4. Todos los tokens del modelo deben estar presentes en el nombre de la pieza
    const partNameLower = partName.toLowerCase();
    return tokens.every(tok => {
      if (tok === '5g' || tok === '4g' || tok === 'lte') return true; // variantes de red flexibles
      const r = new RegExp('(\\b|[^a-z0-9])' + tok + '(\\b|[^a-z0-9])', 'i');
      return r.test(partNameLower);
    });
  });

  // Priorizar repuestos en stock y ordenar por precio ascendente
  return results.sort((a, b) => {
    if (a.in_stock && !b.in_stock) return -1;
    if (!a.in_stock && b.in_stock) return 1;
    return (a.price_cash_ars || 0) - (b.price_cash_ars || 0);
  });
}

/**
 * Genera enlaces de búsqueda rápida directa en proveedores y Mercado Libre
 */
export function generateQuickSupplierLinks(modelName, issueLabel = 'Módulo Pantalla') {
  const cleanModel = (modelName || '').trim();
  const searchTerm = `${issueLabel} ${cleanModel}`.trim();
  const encoded = encodeURIComponent(searchTerm);

  return [
    {
      name: 'Smart Supply',
      provider: 'Smart Supply',
      badge: 'Mayorista Gremio',
      color: '#FF5500',
      url: `https://smartsupply.com.ar/?s=${encoded}&post_type=product`
    },
    {
      name: 'CellStore MDP',
      provider: 'CellStore MDP',
      badge: 'Local Mar del Plata',
      color: '#3B82F6',
      url: `https://cellstoremdp.com.ar/?s=${encoded}&post_type=product`
    },
    {
      name: 'SoulFix',
      provider: 'SoulFix',
      badge: 'Envíos Express',
      color: '#10B981',
      url: `https://soulfix.com.ar/?s=${encoded}&post_type=product`
    },
    {
      name: 'Mercado Libre',
      provider: 'Mercado Libre',
      badge: 'Disponibilidad Inmediata',
      color: '#FACC15',
      textColor: '#000000',
      url: `https://listado.mercadolibre.com.ar/${encodeURIComponent(cleanModel + ' ' + issueLabel)}`
    }
  ];
}
