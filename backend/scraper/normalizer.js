/**
 * Módulo de Normalización Inteligente de Repuestos y Modelos para montec
 * Unifica variantes de nombres de distribuidores de Mar del Plata
 */

export function normalizeModelName(rawText) {
  if (!rawText) return { brand: 'Genérico', model: 'Modelo Desconocido' };

  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. APPLE / IPHONE
  if (lower.includes('iphone') || lower.includes('ip ') || lower.includes('apple') || /^i\s*p\b/.test(lower)) {
    const brand = 'Apple';
    
    if (lower.includes('15 pro max')) return { brand, model: 'iPhone 15 Pro Max' };
    if (lower.includes('15 pro')) return { brand, model: 'iPhone 15 Pro' };
    if (lower.includes('15 plus')) return { brand, model: 'iPhone 15 Plus' };
    if (lower.includes('15')) return { brand, model: 'iPhone 15' };

    if (lower.includes('14 pro max')) return { brand, model: 'iPhone 14 Pro Max' };
    if (lower.includes('14 pro')) return { brand, model: 'iPhone 14 Pro' };
    if (lower.includes('14 plus')) return { brand, model: 'iPhone 14 Plus' };
    if (lower.includes('14')) return { brand, model: 'iPhone 14' };

    if (lower.includes('13 pro max')) return { brand, model: 'iPhone 13 Pro Max' };
    if (lower.includes('13 pro')) return { brand, model: 'iPhone 13 Pro' };
    if (lower.includes('13 mini')) return { brand, model: 'iPhone 13 mini' };
    if (lower.includes('13')) return { brand, model: 'iPhone 13' };

    if (lower.includes('12 pro max')) return { brand, model: 'iPhone 12 Pro Max' };
    if (lower.includes('12 pro')) return { brand, model: 'iPhone 12 Pro' };
    if (lower.includes('12 mini')) return { brand, model: 'iPhone 12 mini' };
    if (lower.includes('12')) return { brand, model: 'iPhone 12' };

    if (lower.includes('11 pro max')) return { brand, model: 'iPhone 11 Pro Max' };
    if (lower.includes('11 pro')) return { brand, model: 'iPhone 11 Pro' };
    if (lower.includes('11')) return { brand, model: 'iPhone 11' };

    if (lower.includes('xs max')) return { brand, model: 'iPhone XS Max' };
    if (lower.includes('xs')) return { brand, model: 'iPhone XS' };
    if (lower.includes('xr')) return { brand, model: 'iPhone XR' };
    if (lower.includes(' x ') || lower.endsWith(' x') || lower.includes('ip x')) return { brand, model: 'iPhone X' };

    if (lower.includes('se 2022') || lower.includes('se 3')) return { brand, model: 'iPhone SE (2022)' };
    if (lower.includes('se 2020') || lower.includes('se 2')) return { brand, model: 'iPhone SE (2020)' };

    return { brand, model: 'iPhone ' + text.replace(/modulo|bateria|pin|pantalla|apple|iphone/gi, '').trim() };
  }

  // 2. SAMSUNG
  if (lower.includes('samsung') || lower.includes('galaxy') || /^sm-/i.test(text) || /\ba\d{2}\b/i.test(text)) {
    const brand = 'Samsung';
    
    // Serie S
    const sMatch = text.match(/s\s*2[0-4](\s*ultra|\s*fe|\s*plus|\s*\+)?/i);
    if (sMatch) {
      return { brand, model: `Galaxy ${sMatch[0].toUpperCase().replace(/\s+/g, ' ')}` };
    }

    // Serie A
    const aMatch = text.match(/a\s*0[1-5]|a\s*[1-7][0-5](\s*5g|\s*s)?/i);
    if (aMatch) {
      return { brand, model: `Galaxy ${aMatch[0].toUpperCase().replace(/\s+/g, '')}` };
    }

    return { brand, model: 'Samsung Galaxy ' + text.replace(/samsung|galaxy|modulo|bateria|pin/gi, '').trim() };
  }

  // 3. MOTOROLA
  if (lower.includes('motorola') || lower.includes('moto')) {
    const brand = 'Motorola';

    // Serie Edge
    const edgeMatch = text.match(/edge\s*[2-4]0(\s*pro|\s*neo|\s*ultra)?/i);
    if (edgeMatch) {
      return { brand, model: `Moto ${edgeMatch[0].toUpperCase()}` };
    }

    // Serie G
    const gMatch = text.match(/g\s*0[1-5]|g\s*[1-8][0-9](\s*5g|\s*plus|\s*power)?/i);
    if (gMatch) {
      return { brand, model: `Moto ${gMatch[0].toUpperCase().replace(/\s+/g, '')}` };
    }

    // Serie E
    const eMatch = text.match(/e\s*[1-3][0-9](\s*i)?/i);
    if (eMatch) {
      return { brand, model: `Moto ${eMatch[0].toUpperCase().replace(/\s+/g, '')}` };
    }

    return { brand, model: 'Moto ' + text.replace(/motorola|moto|modulo|bateria|pin/gi, '').trim() };
  }

  // 4. XIAOMI
  if (lower.includes('xiaomi') || lower.includes('redmi') || lower.includes('poco')) {
    const brand = 'Xiaomi';
    
    if (lower.includes('note 13')) return { brand, model: 'Redmi Note 13' };
    if (lower.includes('note 12')) return { brand, model: 'Redmi Note 12' };
    if (lower.includes('note 11')) return { brand, model: 'Redmi Note 11' };
    if (lower.includes('poco x5')) return { brand, model: 'Poco X5 Pro' };
    if (lower.includes('poco x4')) return { brand, model: 'Poco X4 Pro' };

    return { brand, model: 'Xiaomi ' + text.replace(/xiaomi|redmi|poco|modulo|bateria|pin/gi, '').trim() };
  }

  return { brand: 'Genérico', model: text };
}

/**
 * Detecta la categoría del repuesto según palabras clave
 */
export function detectCategory(rawText) {
  const lower = (rawText || '').toLowerCase();

  if (lower.includes('modulo') || lower.includes('pantalla') || lower.includes('display') || lower.includes('touch') || lower.includes('oled') || lower.includes('incell')) {
    return 'pantalla';
  }
  if (lower.includes('bateria') || lower.includes('battery') || lower.includes('pila')) {
    return 'bateria';
  }
  if (lower.includes('pin') || lower.includes('puerto de carga') || lower.includes('subplaca') || lower.includes('conector de carga')) {
    return 'pin_carga';
  }
  if (lower.includes('placa') || lower.includes('mother') || lower.includes('pmic') || lower.includes('circuito')) {
    return 'placa';
  }
  if (lower.includes('flex') || lower.includes('camara') || lower.includes('auricular') || lower.includes('parlante')) {
    return 'flex_componentes';
  }

  return 'otros';
}

/**
 * Convierte strings de precios ("$ 45.500,00" o "USD 35") a número float limpio
 */
export function parsePrice(priceStr) {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;

  // Remover símbolos y espacios
  let clean = priceStr.replace(/[^\d.,]/g, '').trim();

  // Si tiene punto de miles y coma decimal (formato AR: 45.000,00)
  if (clean.includes('.') && clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}
