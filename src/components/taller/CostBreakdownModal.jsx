import React from 'react';
import { 
  X, 
  Calculator, 
  Wrench, 
  Package, 
  ExternalLink, 
  Zap, 
  Clock, 
  ShieldCheck, 
  DollarSign, 
  Info, 
  CheckCircle2,
  TrendingUp,
  Cpu
} from 'lucide-react';

export default function CostBreakdownModal({
  isOpen,
  onClose,
  device,
  issue,
  liveEstimate,
  matchingParts = [],
  dolarRate,
  onApplyPrice,
  onOpenFullQuoter
}) {
  if (!isOpen) return null;

  // Extraer o calcular costo de repuesto y mano de obra
  let partCostArs = 0;
  let laborArs = 0;
  let finalPrice = liveEstimate?.minPrice || 0;
  let partName = '';
  let providerName = '';

  if (liveEstimate) {
    if (liveEstimate.selectedModality) {
      // iPhone pantalla / batería
      partCostArs = liveEstimate.selectedModality.partCostArs || 0;
      laborArs = liveEstimate.selectedModality.labor || (finalPrice - partCostArs);
      partName = liveEstimate.selectedModality.name || '';
    } else if (liveEstimate.partCostArs !== undefined && liveEstimate.laborArs !== undefined) {
      // Android partes (batería, placa de carga, etc.)
      partCostArs = liveEstimate.partCostArs;
      laborArs = liveEstimate.laborArs;
      partName = liveEstimate.bestOption?.raw_name || liveEstimate.qualityLabel || '';
      providerName = liveEstimate.bestOption?.provider || '';
    } else if (liveEstimate.bestOption) {
      // Módulo Android
      partCostArs = liveEstimate.bestOption.cost_ars || Math.round((liveEstimate.bestOption.cost_usd || 0) * (dolarRate || 1545));
      laborArs = Math.max(0, finalPrice - partCostArs);
      partName = liveEstimate.bestOption.raw_name || '';
      providerName = liveEstimate.bestOption.provider || '';
    } else {
      // Estimación genérica sin desglose exacto
      laborArs = Math.round(finalPrice * 0.45);
      partCostArs = Math.max(0, finalPrice - laborArs);
    }
  } else if (matchingParts.length > 0) {
    const firstPart = matchingParts[0];
    partCostArs = firstPart.price_cash_ars || 0;
    laborArs = 35000;
    finalPrice = partCostArs + laborArs;
    partName = firstPart.name;
    providerName = firstPart.provider;
  }

  const partCostUsd = dolarRate > 0 && partCostArs > 0 
    ? (partCostArs / dolarRate).toFixed(1) 
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#141416] border border-zinc-800 rounded-2xl max-w-lg w-full shadow-[0_0_50px_rgba(255,85,0,0.25)] flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs uppercase font-black tracking-wider text-white">
                Cotizador & Desglose de Costos
              </h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-xs">
                {device?.brand} {device?.model || 'Sin modelo seleccionado'} • {issue?.name || 'Falla'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
              Dólar: ${dolarRate || 1545}
            </span>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          
          {/* Tarjeta de Resumen Financiero */}
          <div className="bg-gradient-to-br from-zinc-950 via-[#1A120D] to-zinc-950 p-4 rounded-xl border border-[#FF5500]/40 shadow-inner space-y-3">
            <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Desglose Técnico & Comercial:</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Costo de Repuesto */}
              <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-400 block font-medium">
                  Costo de Repuesto (Proveedor):
                </span>
                <div className="text-sm font-bold font-mono text-zinc-200">
                  ${partCostArs.toLocaleString('es-AR')} ARS
                </div>
                {partCostUsd && (
                  <span className="text-[10px] text-zinc-500 font-mono block">
                    ≈ ${partCostUsd} USD
                  </span>
                )}
                {providerName && (
                  <span className="text-[9px] text-[#FF5500] block truncate">
                    Ref: {providerName}
                  </span>
                )}
              </div>

              {/* Mano de Obra */}
              <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-400 block font-medium">
                  Mano de Obra & Laboratorio:
                </span>
                <div className="text-sm font-bold font-mono text-emerald-400">
                  ${laborArs.toLocaleString('es-AR')} ARS
                </div>
                <span className="text-[10px] text-zinc-500 block">
                  Incluye instalación e insumos
                </span>
              </div>
            </div>

            {/* Total Sugerido al Público */}
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                  Presupuesto Total Sugerido:
                </span>
                <span className="text-lg font-black font-mono text-[#FF5500]">
                  ${finalPrice.toLocaleString('es-AR')} ARS
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (finalPrice > 0) {
                    onApplyPrice(finalPrice);
                    onClose();
                  }
                }}
                disabled={finalPrice <= 0}
                className="px-3 py-2 bg-[#FF5500] hover:bg-[#FF6600] disabled:bg-zinc-800 text-white disabled:text-zinc-600 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,85,0,0.4)] transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Aplicar a la Orden</span>
              </button>
            </div>
          </div>

          {/* Información de Garantía y Tiempos */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
              <div>
                <span className="text-[9px] text-zinc-500 uppercase font-bold block">Plazo Estimado</span>
                <span className="text-zinc-200 font-medium">
                  {liveEstimate?.duration || 'De 2 a 3 horas'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[9px] text-zinc-500 uppercase font-bold block">Garantía Escrita</span>
                <span className="text-emerald-400 font-medium">
                  {liveEstimate?.warranty || '90 días de garantía escrita'}
                </span>
              </div>
            </div>
          </div>

          {/* Detalle o Avisos Técnicos si existen */}
          {liveEstimate?.iosNotice && (
            <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 text-[11px] flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <span className="font-bold block">Aviso de Compatibilidad Apple:</span>
                <span>{liveEstimate.iosNotice}</span>
              </div>
            </div>
          )}

          {/* Lista de Repuestos Compatibles de Proveedores */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                <span>Repuestos en Proveedores Locales ({matchingParts.length}):</span>
              </span>
            </div>

            {matchingParts.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {matchingParts.slice(0, 5).map((part, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] px-1 py-0.2 rounded font-semibold font-mono bg-zinc-800 text-zinc-300">
                          {part.provider}
                        </span>
                        <span className={`text-[9px] font-semibold ${part.in_stock ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {part.in_stock ? 'En Stock' : 'Consultar'}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-300 truncate" title={part.name}>
                        {part.name}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400">
                        Costo: ${(part.price_cash_ars || 0).toLocaleString('es-AR')} ARS
                      </div>
                    </div>

                    {part.url && (
                      <a
                        href={part.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-zinc-800 hover:bg-[#FF5500] text-zinc-300 hover:text-white rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <span>Ver</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-zinc-500 italic">
                No hay repuestos indexados directos con este nombre. Se aplicaron los costos de referencia estándar de Montec.
              </p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenFullQuoter) onOpenFullQuoter();
            }}
            className="text-[11px] text-zinc-400 hover:text-[#FF5500] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Abrir Cotizador Completo</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
