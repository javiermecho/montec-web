import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  X, 
  ExternalLink, 
  Check, 
  Package, 
  TrendingUp, 
  DollarSign, 
  Filter, 
  Sparkles, 
  AlertCircle,
  Building2,
  CheckCircle2,
  ArrowRight,
  Zap
} from 'lucide-react';
import { 
  searchCatalogPartsFlexible, 
  detectPartCategory, 
  generateQuickSupplierLinks 
} from '../../services/partsSearchService';
import { parsePartDetails } from '../admin/PartsSearchTab';

export default function PartCostFinderModal({
  isOpen,
  onClose,
  modelName = '',
  issueText = '',
  issueId = '',
  currentCost = 0,
  clientPrice = 0,
  onSelectCost,
  orderNumber = ''
}) {
  if (!isOpen) return null;

  // Detectar término inicial sugerido (ej: "iPhone 13 modulo", "Moto G22 pantalla")
  const initialSearch = useMemo(() => {
    const cleanModel = (modelName || '').trim();
    const cat = detectPartCategory(issueId, issueText);
    let term = '';
    
    if (cat.keywords && cat.keywords.length > 0) {
      term = `${cleanModel} ${cat.keywords[0].toLowerCase()}`.trim();
    } else if (issueText) {
      term = `${cleanModel} ${issueText}`.trim();
    } else {
      term = cleanModel;
    }
    return term;
  }, [modelName, issueText, issueId]);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [onlyInStock, setOnlyInStock] = useState(true);
  const [manualCostInput, setManualCostInput] = useState(currentCost ? String(currentCost) : '');
  const [manualSupplierInput, setManualSupplierInput] = useState('');

  // Actualizar búsqueda si cambia el modelo
  useEffect(() => {
    setSearchTerm(initialSearch);
    setManualCostInput(currentCost ? String(currentCost) : '');
  }, [initialSearch, currentCost]);

  // Resultados de búsqueda
  const results = useMemo(() => {
    return searchCatalogPartsFlexible({
      query: searchTerm,
      providerKey: selectedProvider,
      onlyInStock: onlyInStock,
      sortBy: 'price_asc'
    });
  }, [searchTerm, selectedProvider, onlyInStock]);

  const quickLinks = useMemo(() => {
    const cat = detectPartCategory(issueId, issueText);
    return generateQuickSupplierLinks(modelName, cat.label);
  }, [modelName, issueId, issueText]);

  // Manejar selección de una pieza del catálogo
  const handleSelectPart = (part) => {
    const costArs = Number(part.price_cash_ars || 0);
    const parsed = parsePartDetails ? parsePartDetails(part) : null;
    const quality = parsed?.parsedQuality || '';

    if (onSelectCost) {
      onSelectCost({
        costArs,
        supplier: part.provider || 'Proveedor Mayorista',
        partName: part.name,
        quality: quality,
        url: part.url || '',
        sku: part.sku || ''
      });
    }
    onClose();
  };

  // Manejar aplicación de costo manual libre
  const handleApplyManualCost = (e) => {
    e?.preventDefault();
    const costNum = parseFloat(manualCostInput) || 0;
    if (costNum < 0) return;

    if (onSelectCost) {
      onSelectCost({
        costArs: costNum,
        supplier: manualSupplierInput.trim() || 'Costo Manual',
        partName: `Repuesto ${modelName || ''} (${issueText || 'Reparación'})`,
        quality: 'Personalizado',
        url: '',
        sku: ''
      });
    }
    onClose();
  };

  // Cálculo de margen y utilidad previo al seleccionar
  const priceNum = Number(clientPrice) || 0;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-3xl bg-[#141416] border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-zinc-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-900 via-zinc-900 to-[#1c130d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-[#FF5500] flex items-center justify-center shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>Buscador de Repuestos en Proveedores</span>
                </h3>
                {orderNumber && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                    {orderNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cotización de costo mayorista en Mar del Plata (Smart Supply, CellStore, SoulFix, Grupo Armar).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/60 space-y-3">
          {/* Input de Búsqueda Rápida */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#FF5500] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por modelo y repuesto (ej: iPhone 11 modulo, Moto G22 pantalla, A32 bateria)..."
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtros de Proveedor y Stock */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1 mr-1">
                <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Proveedor:</span>
              </span>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'smartsupply', label: 'Smart Supply' },
                { id: 'cellstore', label: 'CellStore MDP' },
                { id: 'soulfix', label: 'SoulFix' },
                { id: 'grupoarmar', label: 'Grupo Armar' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProvider(p.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedProvider === p.id
                      ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="accent-[#FF5500] w-3.5 h-3.5 rounded"
              />
              <span className="text-[11px] text-zinc-300 font-medium">Solo con stock inmediato</span>
            </label>
          </div>
        </div>

        {/* Cuerpo de Resultados con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[220px]">
          {results.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-1">
                <span>{results.length} repuestos encontrados (ordenados por menor precio de costo)</span>
                {priceNum > 0 && (
                  <span className="text-[#FF5500] font-semibold">
                    Precio cobrado: ${priceNum.toLocaleString('es-AR')} ARS
                  </span>
                )}
              </div>

              {results.map((part, index) => {
                const costArs = Number(part.price_cash_ars || 0);
                const utility = priceNum > 0 ? priceNum - costArs : 0;
                const marginPercent = priceNum > 0 ? Math.round((utility / priceNum) * 100) : 0;
                const parsed = parsePartDetails ? parsePartDetails(part) : null;

                const providerColor = 
                  part.provider_key === 'smartsupply' ? 'text-[#FF5500] bg-orange-500/10 border-orange-500/30' :
                  part.provider_key === 'cellstore' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' :
                  part.provider_key === 'soulfix' ? 'text-purple-400 bg-purple-500/10 border-purple-500/30' :
                  'text-sky-400 bg-sky-500/10 border-sky-500/30';

                return (
                  <div
                    key={index}
                    className="p-3 bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      {/* Fila Superior: Proveedor, Stock y Badges de Calidad */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${providerColor}`}>
                          {part.provider}
                        </span>

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                          part.in_stock 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}>
                          {part.in_stock ? '🟢 En Stock' : '⚪ Consultar Stock'}
                        </span>

                        {parsed?.qualityBadges && parsed.qualityBadges.map((badge, bi) => (
                          <span key={bi} className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.color}`}>
                            {badge.text}
                          </span>
                        ))}
                      </div>

                      {/* Título del Repuesto */}
                      <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-white line-clamp-2 leading-relaxed">
                        {part.name}
                      </h4>

                      {/* Datos de Margen y Enlace */}
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-zinc-400">
                        {priceNum > 0 && (
                          <span className={`font-medium ${utility >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            Utilidad estimada: <strong>${utility.toLocaleString('es-AR')}</strong> ({marginPercent}%)
                          </span>
                        )}

                        {part.url && (
                          <a
                            href={part.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-[#FF5500] inline-flex items-center gap-1 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>Ver en proveedor</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Precio de Costo y Botón de Aplicar */}
                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block">Costo Mayorista</span>
                        <span className="text-base font-black font-mono text-emerald-400">
                          ${costArs.toLocaleString('es-AR')}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectPart(part)}
                        className="px-3.5 py-2 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] active:scale-95 text-white text-xs font-bold shadow-md shadow-[#FF5500]/20 flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Usar este costo</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <Package className="w-10 h-10 text-zinc-600 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-zinc-300">
                  No se encontraron repuestos catalogados exactos
                </p>
                <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                  Intenta simplificar la búsqueda (ej: solo el modelo &ldquo;{modelName}&rdquo;) o utiliza los enlaces de búsqueda rápida directa en las tiendas a continuación:
                </p>
              </div>

              {/* Enlaces Rápidos Directos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-lg mx-auto pt-2">
                {quickLinks.map((ql, idx) => (
                  <a
                    key={idx}
                    href={ql.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white flex items-center justify-between group transition-colors"
                  >
                    <span className="truncate text-[11px] font-semibold">{ql.name}</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-[#FF5500]" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pie: Ingreso de Costo Manual Libre */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleApplyManualCost} className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-zinc-400 font-semibold whitespace-nowrap">
              ¿Compraste a otro precio o proveedor?
            </span>
            <div className="relative w-32">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-mono">$</span>
              <input
                type="number"
                value={manualCostInput}
                onChange={(e) => setManualCostInput(e.target.value)}
                placeholder="Costo ($)"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-6 pr-2 py-1.5 text-xs text-white font-mono font-bold outline-none focus:border-[#FF5500]"
              />
            </div>
            <input
              type="text"
              value={manualSupplierInput}
              onChange={(e) => setManualSupplierInput(e.target.value)}
              placeholder="Proveedor / Local..."
              className="w-36 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#FF5500]"
            />
            <button
              type="submit"
              disabled={!manualCostInput || parseFloat(manualCostInput) < 0}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer disabled:opacity-40 transition-colors"
            >
              Cargar Costo Manual
            </button>
          </form>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer w-full sm:w-auto text-center"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
