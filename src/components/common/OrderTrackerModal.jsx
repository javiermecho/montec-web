import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  Wrench, 
  ExternalLink, 
  MessageCircle, 
  ShieldCheck,
  ArrowRight,
  Package
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { queryOrderTracking, getOrderTrackingUrl } from '../../services/orderTrackingService';

export default function OrderTrackerModal({ isOpen, onClose, onNavigateToStatusPage }) {
  const { orders = [], businessConfig } = useData();

  const [orderQuery, setOrderQuery] = useState('');
  const [dniQuery, setDniQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [foundOrder, setFoundOrder] = useState(null);

  if (!isOpen) return null;

  const rawSupportPhone = businessConfig?.contact?.supportPhone || businessConfig?.contact?.quotationWhatsapp || '5492235444991';
  const cleanPhone = rawSupportPhone.replace(/[^0-9]/g, '') || '5492235444991';

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!orderQuery.trim()) {
      setError('Por favor, ingresá el número de orden.');
      return;
    }

    setLoading(true);
    setError(null);
    setFoundOrder(null);

    try {
      const res = await queryOrderTracking({
        orderNumber: orderQuery.trim(),
        dniOrPhone: dniQuery.trim(),
        localOrders: orders
      });

      if (res.success && res.order) {
        setFoundOrder(res.order);
        setError(null);
      } else {
        setFoundOrder(null);
        setError(res.error || 'No encontramos una reparación con ese número de orden y DNI. Verificá los datos o escribinos por WhatsApp.');
      }
    } catch (err) {
      console.error('Error buscando orden en modal:', err);
      setError('Ocurrió un error al buscar la orden. Por favor, intentá nuevamente o consultanos por WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToFullPage = () => {
    if (!foundOrder) return;
    const targetUrl = getOrderTrackingUrl(foundOrder.orderNumber);
    if (onNavigateToStatusPage) {
      onNavigateToStatusPage(foundOrder.orderNumber);
    } else {
      window.location.href = targetUrl;
    }
    onClose();
  };

  // Mapeo simple de estado para la tarjeta de previsualización
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready':
      case 'repaired':
        return {
          label: 'Reparado OK • Listo para Retirar',
          color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        };
      case 'in_progress':
      case 'waiting_part':
      case 'approved':
        return {
          label: 'En Reparación • Mesa de Trabajo',
          color: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        };
      case 'diagnosing':
      case 'waiting_auth':
        return {
          label: 'En Diagnóstico • Laboratorio',
          color: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
        };
      case 'delivered':
        return {
          label: 'Entregado • Garantía Activa',
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        };
      case 'no_repair':
        return {
          label: 'Disponible para Retiro',
          color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
        };
      case 'received':
      default:
        return {
          label: 'Ingresado • En Recepción',
          color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-[#121212] border border-[#27272A] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF5500]/15 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500]">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Estado de Reparación en Vivo
              </h2>
              <span className="text-[11px] text-zinc-400">
                Consultá el avance de tu equipo en tiempo real
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido / Formulario */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <form onSubmit={handleSearch} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                1. N° de Orden de Reparación <span className="text-[#FF5500]">*</span>
              </label>
              <input
                type="text"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="Ej: 1042 o ORD-1042 o #MON-1042"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-sm font-mono focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] outline-none transition-all"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                2. DNI o Teléfono del Titular <span className="text-[#FF5500]">*</span>
              </label>
              <input
                type="text"
                value={dniQuery}
                onChange={(e) => setDniQuery(e.target.value)}
                placeholder="Ej: 38492019 o 2235123456"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-sm font-mono focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] outline-none transition-all"
                required
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Por seguridad, validamos que el DNI o teléfono coincida con el registrado al ingresar el equipo.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,85,0,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verificando orden...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Consultar Estado</span>
                </>
              )}
            </button>
          </form>

          {/* Mensaje de Error Amigable */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm space-y-2.5 animate-fadeIn">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              <div className="pt-2 border-t border-rose-500/20 flex justify-end">
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`¡Hola Montec! No pude consultar mi orden ${orderQuery}. ¿Podrían verificarla por favor?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Consultar por WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {/* Resultado Encontrado */}
          {foundOrder && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Orden Oficial</span>
                  <span className="text-base font-black font-mono text-white">{foundOrder.orderNumber}</span>
                </div>
                {(() => {
                  const badge = getStatusBadge(foundOrder.status);
                  return (
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-800/80">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Equipo:</span>
                  <span className="font-semibold text-white">
                    {foundOrder.device.brand} {foundOrder.device.model}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Cliente:</span>
                  <span className="font-semibold text-white">{foundOrder.client.name}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-500 block text-[10px]">Falla declarada:</span>
                  <span className="text-zinc-300">{foundOrder.service.requestedRepair}</span>
                </div>
              </div>

              {/* Saldo pendiente */}
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-300 font-medium">Saldo pendiente al retirar:</span>
                <span className="text-sm font-black text-[#FF5500] font-mono">
                  ${(foundOrder.service.balanceDue || 0).toLocaleString('es-AR')}
                </span>
              </div>

              <button
                onClick={handleGoToFullPage}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Ver Ficha Completa con Stepper en Vivo</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF5500]" />
              </button>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800/80 text-center">
          <p className="text-[10px] text-zinc-500">
            Laboratorio Montec • Montes Carballo 943, Mar del Plata • Atención Lun a Sáb
          </p>
        </div>
      </div>
    </div>
  );
}

