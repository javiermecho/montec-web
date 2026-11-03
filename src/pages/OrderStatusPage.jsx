import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  Smartphone,
  MapPin,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
  Package,
  Layers,
  Sparkles,
  Phone,
  HelpCircle,
  FileText
} from 'lucide-react';
import MontecLogo from '../components/MontecLogo';
import { useData } from '../context/DataContext';
import { queryOrderTracking, getOrderTrackingUrl } from '../services/orderTrackingService';

/**
 * 5 Etapas Oficiales del Stepper Visual para Clientes
 */
const TRACKING_STEPS = [
  {
    step: 1,
    id: 'received',
    label: 'Ingresado',
    sublabel: 'En Recepción',
    icon: Package,
    description: 'Tu equipo ha ingresado a nuestro taller. Se registraron los datos del dispositivo, fallas declaradas y se generó el comprobante oficial.',
    activeNote: 'Equipo recibido en recepción y catalogado en sistema.'
  },
  {
    step: 2,
    id: 'diagnosing',
    label: 'En Diagnóstico',
    sublabel: 'Laboratorio',
    icon: Search,
    description: 'Nuestros técnicos especializados evalúan el equipo en mesa con instrumental de precisión para diagnosticar y confirmar la solución.',
    activeNote: 'En evaluación de laboratorio e instrumental.'
  },
  {
    step: 3,
    id: 'in_progress',
    label: 'En Reparación',
    sublabel: 'Mesa de Trabajo',
    icon: Wrench,
    description: 'El técnico asignado está realizando el desarme, colocación de componentes premium o microelectrónica en mesa de trabajo.',
    activeNote: 'En proceso activo de reparación y recambio de piezas.'
  },
  {
    step: 4,
    id: 'ready',
    label: 'Reparado OK',
    sublabel: 'Listo para Retirar',
    icon: CheckCircle2,
    description: '¡Excelente noticia! Tu equipo fue reparado exitosamente, testeado exhaustivamente y ya está disponible para retirar en nuestro local.',
    activeNote: '¡Equipo terminado y probado! Podés pasar a retirarlo hoy mismo.'
  },
  {
    step: 5,
    id: 'delivered',
    label: 'Entregado',
    sublabel: 'Garantía Activa',
    icon: ShieldCheck,
    description: 'Equipo retirado por el titular. La garantía formal escrita de Montec se encuentra 100% activa. ¡Gracias por confiar en nosotros!',
    activeNote: 'Equipo entregado con conformidad y garantía activa.'
  }
];

/**
 * Determina el índice de paso activo (1 a 5) según el estado de la orden
 */
function getStepIndexForStatus(status) {
  switch (status) {
    case 'received':
    case 'pending':
      return 1;
    case 'diagnosing':
    case 'waiting_auth':
      return 2;
    case 'in_progress':
    case 'waiting_part':
    case 'approved':
      return 3;
    case 'ready':
    case 'repaired':
      return 4;
    case 'delivered':
      return 5;
    case 'no_repair':
      return 4; // Tratamiento especial para retiro sin solución
    default:
      return 1;
  }
}

export default function OrderStatusPage({ onNavigateHome }) {
  const { orders = [], businessConfig } = useData();

  // Estados del buscador y formulario
  const [orderQueryInput, setOrderQueryInput] = useState('');
  const [dniQueryInput, setDniQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [copiedOrder, setCopiedOrder] = useState(false);

  // Extraer parámetro de orden de la URL al montar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    let urlOrder = params.get('orden') || params.get('order') || params.get('id');

    // Si no está en query params, revisar si la ruta es /estado/:orderNumber o /seguimiento/:orderNumber
    if (!urlOrder) {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2 && (pathParts[0] === 'estado' || pathParts[0] === 'seguimiento' || pathParts[0] === 'reparacion')) {
        urlOrder = pathParts[1];
      }
    }

    if (urlOrder) {
      const clean = decodeURIComponent(urlOrder).trim();
      setOrderQueryInput(clean);
      performSearch(clean, '');
    }
  }, []);

  const performSearch = async (orderNum, dniNum) => {
    if (!orderNum || !orderNum.trim()) {
      setError('Por favor, ingresá el número de orden.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await queryOrderTracking({
        orderNumber: orderNum.trim(),
        dniOrPhone: dniNum ? dniNum.trim() : '',
        localOrders: orders
      });

      if (res.success && res.order) {
        setCurrentOrder(res.order);
        setError(null);
      } else {
        setCurrentOrder(null);
        setError(res.error || 'No encontramos una reparación con los datos ingresados.');
      }
    } catch (err) {
      console.error('Error buscando orden:', err);
      setCurrentOrder(null);
      setError('Ocurrió un error al buscar la orden. Por favor, intentá nuevamente o consultanos por WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    performSearch(orderQueryInput, dniQueryInput);
  };

  const handleCopyOrderNumber = () => {
    if (!currentOrder) return;
    navigator.clipboard?.writeText(currentOrder.orderNumber);
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 2000);
  };

  const localAddress = businessConfig?.business?.address || 'Montes Carballo 943';
  const localCity = businessConfig?.business?.city || 'Mar del Plata';
  const mapsUrl = businessConfig?.business?.googleMapsUrl || 'https://maps.app.goo.gl/83JQkwGBdY3tLGtd7';
  const rawSupportPhone = businessConfig?.contact?.supportPhone || businessConfig?.contact?.quotationWhatsapp || '5492235444991';
  const cleanPhone = rawSupportPhone.replace(/[^0-9]/g, '') || '5492235444991';

  // Mensaje precargado de WhatsApp con el número de orden del cliente
  const whatsappConsultUrl = useMemo(() => {
    if (!currentOrder) {
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent('¡Hola Montec! Quisiera hacer una consulta sobre una orden de reparación.')}`;
    }
    const orderNum = currentOrder.orderNumber;
    const deviceName = `${currentOrder.device.brand} ${currentOrder.device.model}`.trim();
    const text = `¡Hola Montec! 👋 Tengo una consulta sobre mi orden de reparación *${orderNum}* (${deviceName}).`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }, [currentOrder, cleanPhone]);

  const activeStepIndex = currentOrder ? getStepIndexForStatus(currentOrder.status) : 1;
  const isNoRepair = currentOrder?.status === 'no_repair';
  const isReady = currentOrder?.status === 'ready' || currentOrder?.status === 'repaired';
  const isDelivered = currentOrder?.status === 'delivered';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col selection:bg-[#FF5500] selection:text-white">
      {/* Barra de Navegación Superior */}
      <header className="sticky top-0 z-30 bg-[#121212]/90 backdrop-blur-md border-b border-[#27272A] py-3.5 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
                else window.location.href = '/';
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer group"
              title="Volver a la página principal"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-xs font-medium hidden sm:inline">Volver</span>
            </button>
            <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
            <button
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
                else window.location.href = '/';
              }}
              className="focus:outline-none"
            >
              <MontecLogo size="md" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Seguimiento en Vivo
            </span>
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Cabecera de la Sección */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 mb-3">
            <Clock className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>Portal Oficial de Clientes • Estado de Taller en Tiempo Real</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-heading text-white">
            Seguimiento de tu Reparación
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400">
            Consultá el avance de tu equipo en laboratorio, informe técnico y saldo pendiente con total transparencia.
          </p>
        </div>

        {/* Buscador de Órdenes */}
        <div className="max-w-2xl mx-auto mb-8">
          <form
            onSubmit={handleFormSubmit}
            className="p-4 sm:p-5 rounded-2xl bg-[#121212] border border-[#27272A] shadow-xl space-y-3.5"
          >
            <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-[#FF5500]" />
              <span>Consultar por Número de Orden y Titular</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  N° de Orden <span className="text-[#FF5500]">*</span>
                </label>
                <input
                  type="text"
                  value={orderQueryInput}
                  onChange={(e) => setOrderQueryInput(e.target.value)}
                  placeholder="Ej: 1042 o #MON-1042"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-sm font-mono focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  DNI o Teléfono del Titular <span className="text-zinc-500 font-normal">(Opcional en link directo)</span>
                </label>
                <input
                  type="text"
                  value={dniQueryInput}
                  onChange={(e) => setDniQueryInput(e.target.value)}
                  placeholder="Ej: 38492019 o 2235123456"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-sm font-mono focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,85,0,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Buscando orden en tiempo real...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Consultar Estado del Equipo</span>
                </>
              )}
            </button>
          </form>

          {/* Mensaje de Error */}
          {error && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`¡Hola Montec! No pude encontrar mi orden ${orderQueryInput}. ¿Podrían ayudarme?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 self-start sm:self-center"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Escribinos por WhatsApp</span>
              </a>
            </div>
          )}
        </div>

        {/* Ficha Principal de la Orden (Si fue encontrada) */}
        {currentOrder && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            
            {/* Banner de Aviso Especial cuando el equipo está Listo o Sin Reparación */}
            {isReady && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">¡Tu equipo está terminado y listo para retirar!</h3>
                    <p className="text-xs text-emerald-300/90 mt-0.5">
                      Podés pasar por nuestro local hoy mismo dentro del horario comercial. Traé tu DNI o número de orden.
                    </p>
                  </div>
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Cómo llegar al local</span>
                </a>
              </div>
            )}

            {isNoRepair && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-white">Equipo disponible para devolución / retiro</h3>
                  <p className="text-xs text-amber-300/90 mt-0.5">
                    {currentOrder.service.technicalReport || 'El equipo se encuentra listo para retirar en mostrador.'}
                  </p>
                </div>
              </div>
            )}

            {isDelivered && (
              <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-white">Reparación Finalizada y Entregada</h3>
                  <p className="text-xs text-blue-300/90 mt-0.5">
                    Tu garantía escrita de <strong>{currentOrder.service.warranty}</strong> está activa. ¡Gracias por confiar en Montec!
                  </p>
                </div>
              </div>
            )}

            {/* Tarjeta de Encabezado de la Orden */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#121212] border border-[#27272A] shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                    Comprobante Digital Oficial
                  </span>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                      {currentOrder.orderNumber}
                    </h2>
                    <button
                      onClick={handleCopyOrderNumber}
                      className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer"
                      title="Copiar número de orden"
                    >
                      {copiedOrder ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[11px] text-emerald-400">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Fecha de Recepción</span>
                    <span className="text-xs sm:text-sm font-semibold text-zinc-300">
                      {new Date(currentOrder.createdAt).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-zinc-800 hidden sm:block" />
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Cliente</span>
                    <span className="text-xs sm:text-sm font-semibold text-white">
                      {currentOrder.client.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Datos del Equipo y Falla */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[#FF5500] shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                      Equipo Ingresado
                    </span>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {currentOrder.device.brand} {currentOrder.device.model}
                    </p>
                    {currentOrder.device.color && (
                      <span className="text-[11px] text-zinc-400">Color: {currentOrder.device.color}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[#FF5500] shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                      Falla / Trabajo Solicitado
                    </span>
                    <p className="text-sm font-medium text-zinc-200 mt-0.5">
                      {currentOrder.service.requestedRepair}
                    </p>
                    {currentOrder.service.preliminaryDiagnosis && (
                      <p className="text-[11px] text-zinc-400 italic mt-0.5">
                        {currentOrder.service.preliminaryDiagnosis}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                      Garantía Escrita
                    </span>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">
                      {currentOrder.service.warranty}
                    </p>
                    <span className="text-[11px] text-zinc-400">Plazo pactado: {currentOrder.service.estimatedDeliveryDate || '24 a 48 hs'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper Visual de Progreso en Tiempo Real */}
            <div className="p-5 sm:p-8 rounded-3xl bg-[#121212] border border-[#27272A] shadow-xl">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5500] block mb-1">
                    Línea de Tiempo del Taller
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Progreso de la Reparación
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30">
                  Etapa {activeStepIndex} de 5
                </span>
              </div>

              {/* Stepper Gráfico */}
              <div className="relative">
                {/* Barra de progreso de fondo */}
                <div className="absolute top-5 left-6 right-6 h-1 bg-zinc-800 -translate-y-1/2 hidden md:block" />
                
                {/* Barra de progreso activa */}
                <div
                  className="absolute top-5 left-6 h-1 bg-gradient-to-r from-[#FF5500] to-emerald-400 -translate-y-1/2 transition-all duration-700 hidden md:block"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((activeStepIndex - 1) / (TRACKING_STEPS.length - 1)) * 100))}%`
                  }}
                />

                {/* Grid de Pasos */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-2 relative z-10">
                  {TRACKING_STEPS.map((step) => {
                    const isCompleted = activeStepIndex > step.step;
                    const isCurrent = activeStepIndex === step.step;
                    const isUpcoming = activeStepIndex < step.step;
                    const StepIcon = step.icon;

                    return (
                      <div
                        key={step.step}
                        className={`flex md:flex-col items-center md:items-center text-left md:text-center gap-3.5 md:gap-2 p-3 rounded-2xl md:p-1 transition-all ${
                          isCurrent
                            ? 'bg-[#FF5500]/10 md:bg-transparent border border-[#FF5500]/30 md:border-transparent'
                            : ''
                        }`}
                      >
                        {/* Ícono de Estado */}
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 text-zinc-950 font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                              : isCurrent
                              ? 'bg-[#FF5500] text-white font-bold shadow-[0_0_20px_rgba(255,85,0,0.6)] ring-4 ring-[#FF5500]/25 animate-pulse'
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-600'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <StepIcon className="w-5 h-5" />
                          )}
                        </div>

                        {/* Textos del Paso */}
                        <div className="flex-1 md:flex-initial">
                          <div className="flex items-center md:justify-center gap-1.5">
                            <span
                              className={`text-xs sm:text-sm font-bold ${
                                isCompleted
                                  ? 'text-emerald-400'
                                  : isCurrent
                                  ? 'text-[#FF5500]'
                                  : 'text-zinc-500'
                              }`}
                            >
                              {step.label}
                            </span>
                            {isCurrent && (
                              <span className="md:hidden text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#FF5500] text-white">
                                Actual
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 block font-medium">
                            {step.sublabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mensaje Informativo del Estado Actual */}
              {(() => {
                const currentStepData = TRACKING_STEPS.find(s => s.step === activeStepIndex) || TRACKING_STEPS[0];
                return (
                  <div className="mt-6 p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[#FF5500] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Estado Actual: {currentStepData.label} ({currentStepData.sublabel})
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed">
                        {currentOrder.service.technicalReport || currentStepData.description}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Resumen Económico Transparente */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#121212] border border-[#27272A] shadow-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-3">
                Resumen de Cuenta y Facturación
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Total Presupuestado */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-semibold block">Presupuesto Total Acordado</span>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
                    ${(currentOrder.service.budgetTotal || 0).toLocaleString('es-AR')}
                  </div>
                  <span className="text-[10px] text-zinc-500 block mt-1">Repuesto + Mano de obra de precisión</span>
                </div>

                {/* Seña Abonada */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-semibold block">Seña / Pago a Cuenta</span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
                    ${(currentOrder.service.deposit || 0).toLocaleString('es-AR')}
                  </div>
                  <span className="text-[10px] text-zinc-500 block mt-1">
                    {currentOrder.service.deposit > 0 ? 'Registrada en mostrador' : 'Sin seña previa requerida'}
                  </span>
                </div>

                {/* Saldo Pendiente al Retirar (Destacado) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FF5500]/20 to-[#FF5500]/5 border-2 border-[#FF5500] shadow-[0_0_25px_rgba(255,85,0,0.2)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#FF5500] font-black uppercase tracking-wider">
                      Saldo al Retirar
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FF5500] text-white font-bold">
                      Abonás al retirar
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                    ${(currentOrder.service.balanceDue || 0).toLocaleString('es-AR')}
                  </div>
                  <span className="text-[10px] text-zinc-300 block mt-1">
                    Efectivo, Transferencia Bancaria o Tarjeta
                  </span>
                </div>
              </div>
            </div>

            {/* Datos Útiles del Local y Botones de Contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Tarjeta de Localización y Horarios */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#121212] border border-[#27272A] shadow-xl space-y-4">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-5 h-5 text-[#FF5500]" />
                  <h3 className="text-base font-bold text-white">Retiro en Local y Horarios</h3>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-zinc-300">
                  <p className="font-semibold text-white">
                    📍 {localAddress}, {localCity}
                  </p>
                  <p className="text-zinc-400 text-xs">
                    Zona Constitución • A metros de ex Sobremonte • <strong className="text-emerald-400">🚗 Estacionamiento libre en la puerta</strong>
                  </p>
                  
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1 mt-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Lunes a Viernes:</span>
                      <strong className="text-white">9:30 a 19:00 hs</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Sábados:</span>
                      <strong className="text-white">10:00 a 14:00 hs</strong>
                    </div>
                  </div>
                </div>

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <MapPin className="w-4 h-4 text-[#FF5500]" />
                  <span>Abrir ubicación en Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>
              </div>

              {/* Tarjeta de Asistencia y WhatsApp */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#121212] border border-[#27272A] shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">¿Tenés dudas sobre tu reparación?</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed">
                    Comunicate directamente con nuestro equipo técnico de mostrador. Te responderemos a la brevedad con el historial de tu equipo en mano.
                  </p>
                </div>

                <a
                  href={whatsappConsultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Consultar por WhatsApp (Orden #{currentOrder.orderNumber})</span>
                </a>
              </div>
            </div>

            {/* Historial de Eventos Públicos (Timeline) */}
            {currentOrder.logs && currentOrder.logs.length > 0 && (
              <div className="p-5 sm:p-6 rounded-3xl bg-[#121212] border border-[#27272A] shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-[#FF5500]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Historial de Actualizaciones de la Orden
                  </h4>
                </div>

                <div className="space-y-3">
                  {currentOrder.logs.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#FF5500] mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-zinc-200 font-medium">{log.action}</p>
                        {log.timestamp && (
                          <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                            {new Date(log.timestamp).toLocaleString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer Mínimo */}
      <footer className="border-t border-[#27272A] py-6 px-4 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} Montec • Servicio Técnico Especializado en Celulares y PC • Montes Carballo 943, Mar del Plata</p>
      </footer>
    </div>
  );
}

