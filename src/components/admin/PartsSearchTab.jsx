import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Package, 
  Layers, 
  ExternalLink, 
  Copy, 
  Check, 
  Filter, 
  ArrowUpDown, 
  RefreshCw, 
  DollarSign, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  XCircle,
  Tag,
  Share2,
  TrendingUp
} from 'lucide-react';
import { SMARTSUPPLY_PARTS, SMARTSUPPLY_PARTS_INFO } from '../../data/smartsupplyParts';

// Estilos y badges por proveedor
const PROVIDERS_CONFIG = {
  all: { name: 'Todos los Proveedores', badgeColor: 'bg-zinc-800 text-zinc-300' },
  smartsupply: { 
    name: 'Smart Supply', 
    badgeColor: 'bg-orange-500/15 text-[#FF5500] border-orange-500/30',
    website: 'https://smartsupply.com.ar',
    total: SMARTSUPPLY_PARTS.length,
    lastUpdate: SMARTSUPPLY_PARTS_INFO?.extracted_at
  },
  supplier_2: { 
    name: 'Proveedor 2 (Próximamente)', 
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    website: '#',
    total: 0
  },
  supplier_3: { 
    name: 'Proveedor 3 (Próximamente)', 
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    website: '#',
    total: 0
  },
  supplier_4: { 
    name: 'Proveedor 4 (Próximamente)', 
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    website: '#',
    total: 0
  }
};

// Formateador de moneda argentina
function formatArs(amount) {
  if (!amount || isNaN(amount)) return '$0';
  return `$${Math.round(amount).toLocaleString('es-AR')}`;
}

export default function PartsSearchTab({ dolarRate = 1545, pricingRules }) {
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance', 'price_asc', 'price_desc', 'name_asc'
  
  // Estado para copiar al portapapeles
  const [copiedSku, setCopiedSku] = useState(null);

  // Margen estimado para cálculo de precio sugerido al cliente (PVP)
  const minLabor = pricingRules?.minLaborArs || 30000;
  const markupMultiplier = pricingRules?.markupMultiplier || 1.8;

  // Lista unificada de repuestos (SmartSupply + futuros proveedores)
  const allParts = useMemo(() => {
    const smartSupplyFormatted = SMARTSUPPLY_PARTS.map(p => ({
      ...p,
      providerId: 'smartsupply',
      providerName: 'Smart Supply'
    }));

    return smartSupplyFormatted;
  }, []);

  // Extraer marcas únicas
  const availableBrands = useMemo(() => {
    const brands = new Set(allParts.map(p => p.brand).filter(Boolean));
    return ['all', ...Array.from(brands).sort()];
  }, [allParts]);

  // Extraer tipos/categorías únicas
  const availableCategories = useMemo(() => {
    const cats = new Set(allParts.map(p => p.part_type).filter(Boolean));
    return ['all', ...Array.from(cats).sort()];
  }, [allParts]);

  // Filtrado y ordenamiento de resultados
  const filteredParts = useMemo(() => {
    let result = allParts.filter(part => {
      // Filtro por proveedor
      if (selectedProvider !== 'all' && part.providerId !== selectedProvider) {
        return false;
      }

      // Filtro por marca
      if (selectedBrand !== 'all' && part.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }

      // Filtro por categoría
      if (selectedCategory !== 'all' && part.part_type !== selectedCategory) {
        return false;
      }

      // Filtro por stock
      if (onlyInStock && !part.in_stock) {
        return false;
      }

      // Filtro de búsqueda por texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const searchPool = `${part.name} ${part.brand} ${part.sku || ''} ${part.part_type || ''}`.toLowerCase();
        
        // Permite buscar múltiples palabras clave (ej: "11 oled", "a54 modulo", "g52 bateria")
        const tokens = query.split(/\s+/);
        const matchesAll = tokens.every(token => searchPool.includes(token));
        if (!matchesAll) return false;
      }

      return true;
    });

    // Ordenamiento
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price_cash_ars - b.price_cash_ars);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price_cash_ars - a.price_cash_ars);
    } else if (sortBy === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [allParts, selectedProvider, selectedBrand, selectedCategory, onlyInStock, searchTerm, sortBy]);

  // Copiar presupuesto o detalle del repuesto
  const handleCopyQuote = (part) => {
    const pvp = Math.round(Math.max(part.price_cash_ars * markupMultiplier, part.price_cash_ars + minLabor));
    const text = `🛠️ *Cotización de Repuesto - Montec*\n📱 *Pieza:* ${part.name}\n🏷️ *Marca:* ${part.brand}\n📦 *Estado:* ${part.in_stock ? 'En Stock' : 'A confirmar disponibilidad'}\n💵 *Costo Gremio:* ${formatArs(part.price_cash_ars)}\n⭐ *PVP Sugerido Cliente:* ${formatArs(pvp)}`;
    
    navigator.clipboard.writeText(text);
    setCopiedSku(part.sku || part.name);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Etiquetas de calidad detectadas en el nombre
  const getQualityBadges = (name) => {
    const badges = [];
    const upper = name.toUpperCase();

    if (upper.includes('ORIGINAL') || upper.includes('SERVICE PACK') || upper.includes('ORI')) {
      badges.push({ text: 'ORIGINAL', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' });
    }
    if (upper.includes('SOFT OLED')) {
      badges.push({ text: 'SOFT OLED', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' });
    } else if (upper.includes('HARD OLED')) {
      badges.push({ text: 'HARD OLED', color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' });
    } else if (upper.includes('OLED')) {
      badges.push({ text: 'OLED', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' });
    }
    if (upper.includes('INCELL')) {
      badges.push({ text: 'INCELL', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' });
    }
    if (upper.includes('CON MARCO')) {
      badges.push({ text: 'CON MARCO', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' });
    }
    if (upper.includes('APTO TRASPLANTE') || upper.includes('IC REMOVIBLE')) {
      badges.push({ text: 'APTO TRASPLANTE IC', color: 'bg-pink-500/15 text-pink-300 border-pink-500/30' });
    }
    if (upper.includes('ZANI') || upper.includes('CORE ZANI')) {
      badges.push({ text: 'CORE ZANI', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' });
    }
    if (upper.includes('FLEX PROGRAMADO')) {
      badges.push({ text: 'FLEX PROGRAMADO', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' });
    }

    return badges;
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Estadísticas Rápidas */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#18181b]/80 border border-zinc-800/80 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FF5500]/15 text-[#FF5500] border border-orange-500/30">
              Gremio & Mayoristas
            </span>
            <span className="text-xs text-zinc-400">
              Multi-proveedor habilitado
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-white flex items-center gap-2">
            Buscador de Repuestos
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Consultá costos de repuestos, disponibilidad y calidades en tiempo real para cotizar al instante.
          </p>
        </div>

        {/* Badges de Proveedores Activos */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-zinc-300">
            <Building2 className="w-3.5 h-3.5 text-[#FF5500]" />
            <span className="font-semibold text-white">Smart Supply:</span>
            <span className="text-[#FF5500] font-bold">{SMARTSUPPLY_PARTS.length} repuestos</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-zinc-500">
            <Building2 className="w-3.5 h-3.5 text-zinc-600" />
            <span>+3 Proveedores disponibles</span>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-[#18181b]/90 border border-zinc-800/80 p-4 sm:p-5 rounded-2xl space-y-4 shadow-xl">
        {/* Input Principal de Búsqueda */}
        <div className="relative">
          <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por modelo, pieza o código (ej: 'iPhone 13 oled', 'Samsung A54 con marco', 'Moto G52 bateria', 'Zani')..."
            className="w-full bg-[#121214] border border-zinc-700/80 focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 rounded-xl pl-12 pr-10 py-3.5 text-sm text-white placeholder-zinc-500 outline-none transition-all shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs px-2 py-1 rounded bg-zinc-800"
            >
              Borrar
            </button>
          )}
        </div>

        {/* Fila de Filtros Selectores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* Proveedor */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Proveedor
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full bg-[#121214] border border-zinc-700/70 rounded-xl px-3 py-2 text-xs font-medium text-white focus:border-[#FF5500] outline-none"
            >
              <option value="all">Todos los Proveedores</option>
              <option value="smartsupply">Smart Supply ({SMARTSUPPLY_PARTS.length})</option>
              <option value="supplier_2" disabled>Proveedor 2 (Próximamente)</option>
              <option value="supplier_3" disabled>Proveedor 3 (Próximamente)</option>
              <option value="supplier_4" disabled>Proveedor 4 (Próximamente)</option>
            </select>
          </div>

          {/* Marca */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Marca
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-[#121214] border border-zinc-700/70 rounded-xl px-3 py-2 text-xs font-medium text-white focus:border-[#FF5500] outline-none"
            >
              <option value="all">Todas las Marcas</option>
              {availableBrands.filter(b => b !== 'all').map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Repuesto */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Tipo de Pieza
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#121214] border border-zinc-700/70 rounded-xl px-3 py-2 text-xs font-medium text-white focus:border-[#FF5500] outline-none capitalize"
            >
              <option value="all">Todas las Piezas</option>
              {availableCategories.filter(c => c !== 'all').map(c => (
                <option key={c} value={c} className="capitalize">{c.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Ordenar Por */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Ordenar Por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[#121214] border border-zinc-700/70 rounded-xl px-3 py-2 text-xs font-medium text-white focus:border-[#FF5500] outline-none"
            >
              <option value="relevance">Relevancia</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="price_desc">Precio: Mayor a Menor</option>
              <option value="name_asc">Nombre: A a Z</option>
            </select>
          </div>

          {/* Switch de Solo en Stock */}
          <div className="flex flex-col justify-end">
            <button
              onClick={() => setOnlyInStock(!onlyInStock)}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                onlyInStock 
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-[#121214] border-zinc-700/70 text-zinc-400 hover:text-white'
              }`}
            >
              {onlyInStock ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Package className="w-3.5 h-3.5" />}
              <span>Solo en Stock</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Contador de Resultados */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <div>
          Mostrando <span className="font-bold text-white">{filteredParts.length}</span> repuestos encontrados
          {searchTerm && <span> para "{searchTerm}"</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            Precios Gremio Efectivo / Transferencia
          </span>
        </div>
      </div>

      {/* Listado de Repuestos */}
      {filteredParts.length === 0 ? (
        <div className="text-center py-16 bg-[#18181b]/50 border border-zinc-800/80 rounded-2xl p-6">
          <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-white mb-1">No se encontraron repuestos</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Probá buscando con términos más generales como "12 pro max", "s21", "a04" o quitá los filtros aplicados.
          </p>
          {(searchTerm || selectedBrand !== 'all' || selectedCategory !== 'all' || onlyInStock) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedBrand('all');
                setSelectedCategory('all');
                setOnlyInStock(false);
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParts.slice(0, 90).map((part, idx) => {
            const qualityBadges = getQualityBadges(part.name);
            const isCopied = copiedSku === (part.sku || part.name);
            const pvpEstimado = Math.round(Math.max(part.price_cash_ars * markupMultiplier, part.price_cash_ars + minLabor));

            return (
              <div 
                key={`${part.providerId}-${part.sku || idx}`}
                className="bg-[#18181b]/90 hover:bg-[#1f1f23] border border-zinc-800/90 hover:border-zinc-700/80 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 shadow-md group relative"
              >
                {/* Cabecera de la tarjeta: Proveedor + Stock */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-[#FF5500] border border-orange-500/30">
                      {part.providerName}
                    </span>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      part.in_stock 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {part.in_stock ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>En Stock</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Agotado</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Título y Marca */}
                  <h4 className="text-sm font-semibold text-white leading-snug group-hover:text-[#FF5500] transition-colors mb-2 line-clamp-2">
                    {part.name}
                  </h4>

                  {/* Badges de Calidad */}
                  {qualityBadges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {qualityBadges.map((b, bi) => (
                        <span key={bi} className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${b.color}`}>
                          {b.text}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* SKU / Código */}
                  {part.sku && (
                    <div className="text-[11px] text-zinc-500 font-mono mb-3">
                      SKU: {part.sku}
                    </div>
                  )}
                </div>

                {/* Bloque Inferior: Precios y Acciones */}
                <div className="pt-3 border-t border-zinc-800/80 mt-2 space-y-3">
                  {/* Comparación de Precios */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        Costo Gremio (Contado)
                      </div>
                      <div className="text-lg font-bold text-emerald-400">
                        {formatArs(part.price_cash_ars)}
                      </div>
                      {part.price_lista_ars > 0 && (
                        <div className="text-[11px] text-zinc-500">
                          Lista: {formatArs(part.price_lista_ars)}
                        </div>
                      )}
                    </div>

                    {/* PVP Sugerido con margen Montec */}
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3 text-[#FF5500]" />
                        <span>PVP Sugerido</span>
                      </div>
                      <div className="text-base font-bold text-white">
                        {formatArs(pvpEstimado)}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Ganancia: {formatArs(pvpEstimado - part.price_cash_ars)}
                      </div>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleCopyQuote(part)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-all active:scale-95"
                      title="Copiar cotización para WhatsApp"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Copiar Datos</span>
                        </>
                      )}
                    </button>

                    {part.url && (
                      <a
                        href={part.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#FF5500]/10 hover:bg-[#FF5500]/20 text-[#FF5500] border border-orange-500/30 transition-all flex items-center gap-1"
                        title="Ver repuesto en la web del proveedor"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ver Web</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Nota si hay muchos resultados */}
      {filteredParts.length > 90 && (
        <div className="text-center py-3 text-xs text-zinc-500 bg-[#121214] border border-zinc-800/80 rounded-xl">
          Mostrando los primeros 90 resultados de {filteredParts.length}. Utilizá el buscador o los filtros para refinar la búsqueda.
        </div>
      )}
    </div>
  );
}
