import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  X, 
  Printer, 
  MessageSquare, 
  Smartphone, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Filter, 
  ArrowUpDown,
  Plus,
  Trash2,
  Calendar,
  ExternalLink,
  ChevronRight,
  Eye,
  EyeOff,
  Copy,
  Check,
  DollarSign,
  Send,
  FileText,
  User,
  Shield,
  HelpCircle,
  Wrench,
  Package,
  Layers,
  Sparkles,
  History,
  Lock,
  ArrowRight,
  RefreshCw,
  Phone,
  Mail,
  CreditCard,
  Banknote,
  RotateCcw
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PatternThumbnail } from './PatternLockInput';
import OrderTicketModal from './OrderTicketModal';

// CONFIGURACIÓN DE ESTADOS TÉCNICOS (ESTILO SISTROFIX PROFESIONAL)
export const STATUS_CONFIG = {
  received: {
    label: 'Recibido (En Cola)',
    shortLabel: 'Recibido',
    color: 'zinc',
    badgeClass: 'bg-zinc-800/90 text-zinc-200 border-zinc-700',
    dotClass: 'bg-zinc-400',
    icon: Clock
  },
  waiting_auth: {
    label: 'Espera Autorización',
    shortLabel: 'Presupuesto Pendiente',
    color: 'purple',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    dotClass: 'bg-purple-400',
    icon: HelpCircle
  },
  waiting_part: {
    label: 'Espera de Repuesto',
    shortLabel: 'Faltante de Stock',
    color: 'amber',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotClass: 'bg-amber-400',
    icon: Package
  },
  in_progress: {
    label: 'En Mesa de Trabajo',
    shortLabel: 'En Reparación',
    color: 'sky',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dotClass: 'bg-sky-400',
    icon: Wrench
  },
  ready: {
    label: 'Listo para Retirar',
    shortLabel: 'Reparado OK',
    color: 'emerald',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
    icon: CheckCircle2
  },
  no_repair: {
    label: 'Sin Reparación',
    shortLabel: 'Devolución',
    color: 'rose',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dotClass: 'bg-rose-400',
    icon: AlertTriangle
  },
  delivered: {
    label: 'Entregado (Cerrado)',
    shortLabel: 'Entregado',
    color: 'slate',
    badgeClass: 'bg-zinc-900/90 text-zinc-500 border-zinc-800 line-through',
    dotClass: 'bg-zinc-600',
    icon: Shield
  }
};

export default function RepairOrdersManager({ onSelectOrder, onNewOrder, onClose }) {
  const { 
    orders, 
    updateRepairOrder,
    updateRepairOrderStatus, 
    addOrderInternalNote,
    recordOrderPayment,
    deleteRepairOrder 
  } = useData();

  // Estados de vista y filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ticketModalOrder, setTicketModalOrder] = useState(null);

  // Estados del Drawer / Detalle de Orden
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'technician', 'notes', 'history'
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [clientHistoryFilter, setClientHistoryFilter] = useState(null);

  // Reprogramar fecha de entrega
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');

  // Registrar cobro
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paymentNote, setPaymentNote] = useState('');

  // Nueva nota interna rápida
  const [newNoteText, setNewNoteText] = useState('');

  // Procesador de estado técnico
  const [targetStatus, setTargetStatus] = useState(null); // Estado al que se quiere cambiar
  const [techReport, setTechReport] = useState('');
  const [techInternalNote, setTechInternalNote] = useState('');
  const [exitChecklist, setExitChecklist] = useState({
    turnsOn: true,
    touchOk: true,
    camerasOk: true,
    chargingOk: true,
    audioOk: true
  });
  const [sendWhatsAppOnProcess, setSendWhatsAppOnProcess] = useState(true);
  const [sendEmailOnProcess, setSendEmailOnProcess] = useState(false);

  // Mantener selectedOrder actualizado reactivamente si se actualiza en el DataContext
  useEffect(() => {
    if (selectedOrder) {
      const fresh = orders.find(o => o.id === selectedOrder.id || o.orderNumber === selectedOrder.orderNumber);
      if (fresh) {
        setSelectedOrder(fresh);
      }
    }
  }, [orders]);

  // Contadores por estado
  const statusCounts = useMemo(() => {
    const counts = { all: orders.length };
    Object.keys(STATUS_CONFIG).forEach(k => counts[k] = 0);
    orders.forEach(o => {
      const s = o.status || 'received';
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [orders]);

  // Filtrado reactivo de órdenes
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filtro especial si estamos viendo el historial de un cliente específico
      if (clientHistoryFilter) {
        const c = order.customer || {};
        const match = (c.docNumber && c.docNumber === clientHistoryFilter) ||
                      (c.phone && c.phone === clientHistoryFilter) ||
                      (c.name && c.name.toLowerCase() === clientHistoryFilter.toLowerCase());
        if (!match) return false;
      }

      // Filtro de estado
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // Filtro de texto de búsqueda
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase().trim();
        const num = (order.orderNumber || '').toLowerCase();
        const clientName = (order.customer?.name || '').toLowerCase();
        const clientDoc = (order.customer?.docNumber || '').toLowerCase();
        const clientPhone = (order.customer?.phone || '').toLowerCase();
        const deviceModel = `${order.device?.brand || ''} ${order.device?.model || ''}`.toLowerCase();
        const issue = (order.service?.requestedRepair || '').toLowerCase();
        const imei = (order.device?.imei || '').toLowerCase();

        return num.includes(q) || 
               clientName.includes(q) || 
               clientDoc.includes(q) || 
               clientPhone.includes(q) || 
               deviceModel.includes(q) || 
               issue.includes(q) ||
               imei.includes(q);
      }

      return true;
    });
  }, [orders, statusFilter, searchTerm, clientHistoryFilter]);

  // Utilidad para copiar texto con feedback
  const handleCopy = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Cálculo de tiempos relativos y alertas
  const getTimingAlert = (order) => {
    const isClosed = order.status === 'delivered' || order.status === 'no_repair' || order.status === 'ready';
    const now = Date.now();

    // 1. Alerta de entrega estimada
    let deliveryAlert = null;
    if (order.service?.estimatedDeliveryDate && !isClosed) {
      const deliveryTime = new Date(order.service.estimatedDeliveryDate).getTime();
      const diffMs = deliveryTime - now;
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));

      if (diffMs < 0) {
        const overdueHours = Math.abs(diffHours);
        deliveryAlert = {
          type: 'overdue',
          text: overdueHours > 24 ? `¡Vencida hace ${Math.floor(overdueHours / 24)} días!` : `¡Vencida hace ${overdueHours} hs!`,
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
        };
      } else if (diffHours <= 6) {
        deliveryAlert = {
          type: 'urgent',
          text: diffHours === 0 ? 'Vence en menos de 1 h' : `Vence en ${diffHours} hs`,
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        };
      }
    }

    // 2. Alerta de inactividad (+48 hs sin cambios)
    let inactiveAlert = null;
    if (!isClosed) {
      const lastUpdate = new Date(order.updatedAt || order.createdAt).getTime();
      const inactiveHours = Math.round((now - lastUpdate) / (1000 * 60 * 60));
      if (inactiveHours >= 48) {
        inactiveAlert = {
          type: 'inactive',
          text: `+${Math.floor(inactiveHours / 24)} días sin cambios`,
          badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700'
        };
      }
    }

    return { deliveryAlert, inactiveAlert };
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Desconocido';
    const diff = Math.round((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'Hace instantes';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} hs`;
    return `Hace ${Math.floor(diff / 86400)} días`;
  };

  const formatPactada = (isoString) => {
    if (!isoString) return 'Sin pactar';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Hoy a las ${timeStr} hs`;
    }
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' hs';
  };

  // Generador dinámico de mensaje de WhatsApp según el estado
  const generateStatusWhatsAppUrl = (order, status, reportText) => {
    const customerName = order.customer?.name || 'Cliente';
    const deviceName = `${order.device?.brand || ''} ${order.device?.model || ''}`.trim();
    const orderNum = order.orderNumber || '';
    const balanceStr = order.service?.balanceDue > 0 
      ? `$${order.service.balanceDue.toLocaleString('es-AR')}` 
      : '$0 (Totalmente abonado)';
    const budgetStr = `$${(order.service?.budgetTotal || 0).toLocaleString('es-AR')}`;

    let msg = '';
    switch (status) {
      case 'ready':
        msg = `¡Hola ${customerName}! 🎉 Te informamos desde *montec* que tu equipo *${deviceName}* (Orden *${orderNum}*) ya está *REPARADO* y listo para retirar en nuestro local de Montes Carballo 943.%0A%0A` +
              `⚖️ *Saldo restante a abonar:* ${balanceStr}%0A` +
              `📍 *Dirección:* Montes Carballo 943, Mar del Plata%0A` +
              `⏱️ *Horarios:* Lun a Sáb 9:30 a 19:30 hs%0A%0A` +
              `¡Te esperamos para entregártelo probado y con su garantía escrita!`;
        break;

      case 'waiting_auth':
        msg = `¡Hola ${customerName}! 👋 Te contactamos de *montec* por tu equipo *${deviceName}* (Orden *${orderNum}*).%0A%0A` +
              `🔬 *Diagnóstico técnico realizado:* ${reportText || 'Requiere autorización técnica para avanzar'}.%0A` +
              `💰 *Presupuesto total estimado:* ${budgetStr}%0A%0A` +
              `¿Nos confirmás si estás de acuerdo para comenzar la reparación?`;
        break;

      case 'waiting_part':
        msg = `¡Hola ${customerName}! Te avisamos desde *montec* que tu equipo *${deviceName}* (Orden *${orderNum}*) se encuentra a la espera del ingreso del repuesto correspondiente desde el distribuidor para continuar con la reparación.%0A%0A` +
              `Apenas ingrese la pieza a mesa de trabajo te mantendremos informado. ¡Muchas gracias por tu paciencia!`;
        break;

      case 'in_progress':
        msg = `¡Hola ${customerName}! Te avisamos de *montec* que tu equipo *${deviceName}* (Orden *${orderNum}*) ha ingresado a *mesa de trabajo* y nuestro técnico ya está trabajando en su reparación. Te notificaremos apenas esté listo.`;
        break;

      case 'no_repair':
        msg = `¡Hola ${customerName}! Te contactamos de *montec* respecto a tu equipo *${deviceName}* (Orden *${orderNum}*).%0A%0A` +
              `Te informamos que el equipo ya está disponible para retirar en nuestro local de Montes Carballo 943.%0A` +
              `📋 *Informe:* ${reportText || 'Equipo listo para devolución'}.%0A` +
              `📍 *Retiro:* Montes Carballo 943 (Lun a Sáb 9:30 a 19:30 hs).`;
        break;

      case 'delivered':
        msg = `¡Hola ${customerName}! Te agradecemos por confiar en *montec* para la reparación de tu *${deviceName}* (Orden *${orderNum}*).%0A%0A` +
              `🛡️ *Garantía escrita activa:* ${order.service?.warranty || '90 días'}.%0A` +
              `Cualquier consulta estamos a tu entera disposición. ¡Que disfrutes tu equipo!`;
        break;

      default:
        msg = `¡Hola ${customerName}! Te contactamos de *montec* respecto a tu orden de reparación *${orderNum}* (${deviceName}).`;
    }

    const cleanPhone = (order.customer?.phone || '').replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`;
    return `https://wa.me/${finalPhone}?text=${msg}`;
  };

  // Procesar cambio de estado formal con informe técnico y checklist
  const handleProcessOrder = () => {
    if (!selectedOrder || !targetStatus) return;

    const statusObj = STATUS_CONFIG[targetStatus] || { label: targetStatus };
    const note = techReport 
      ? `Estado cambiado a ${statusObj.label}. Informe: ${techReport}`
      : `Estado cambiado a ${statusObj.label}`;

    // Si además escribió una nota interna adicional
    if (techInternalNote.trim()) {
      addOrderInternalNote(selectedOrder.id, techInternalNote.trim(), 'Taller Montec');
    }

    // Datos adicionales a guardar en la orden
    const extraData = {
      technicalReport: techReport,
      lastStatusTransitionDate: new Date().toISOString(),
      exitChecklist: {
        ...(selectedOrder.exitChecklist || {}),
        ...exitChecklist
      }
    };

    updateRepairOrderStatus(selectedOrder.id, targetStatus, note, extraData);

    // Disparar WhatsApp si está seleccionado
    if (sendWhatsAppOnProcess) {
      const waUrl = generateStatusWhatsAppUrl(selectedOrder, targetStatus, techReport);
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }

    // Resetear formulario técnico
    setTargetStatus(null);
    setTechReport('');
    setTechInternalNote('');
  };

  // Guardar reprogramación de fecha
  const handleSaveReschedule = () => {
    if (!selectedOrder || !rescheduleDate) return;
    updateRepairOrder(selectedOrder.id, {
      service: {
        ...selectedOrder.service,
        estimatedDeliveryDate: rescheduleDate
      },
      logs: [
        ...(selectedOrder.logs || []),
        {
          timestamp: new Date().toISOString(),
          action: `Entrega reprogramada para: ${new Date(rescheduleDate).toLocaleString('es-AR')}`,
          status: selectedOrder.status
        }
      ]
    });
    setIsRescheduling(false);
    setRescheduleDate('');
  };

  // Agregar nota interna
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!selectedOrder || !newNoteText.trim()) return;
    addOrderInternalNote(selectedOrder.id, newNoteText.trim(), 'Taller Montec');
    setNewNoteText('');
  };

  // Registrar cobro
  const handleRecordPaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedOrder || !paymentAmount || Number(paymentAmount) <= 0) return;
    recordOrderPayment(selectedOrder.id, Number(paymentAmount), paymentMethod, paymentNote);
    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    setPaymentNote('');
  };

  // Eliminar orden
  const handleDelete = (orderId, orderNum) => {
    if (window.confirm(`¿Estás seguro de eliminar permanentemente la orden ${orderNum}? Esta acción no se puede deshacer.`)) {
      deleteRepairOrder(orderId);
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.orderNumber === orderId)) {
        setSelectedOrder(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-fade-in font-sans">
      
      {/* CONTENEDOR PRINCIPAL */}
      <div className="bg-[#121214] border border-zinc-800 rounded-2xl sm:rounded-3xl max-w-7xl w-full h-[92vh] shadow-2xl flex flex-col overflow-hidden relative">

        {/* 1. BARRA SUPERIOR DE GESTIÓN */}
        <header className="bg-zinc-950 border-b border-zinc-800/80 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 flex items-center justify-center font-bold shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-heading font-black text-white flex items-center gap-2 leading-tight">
                <span>Gestión Integral de Taller</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono font-bold border border-zinc-700">
                  {filteredOrders.length} {filteredOrders.length === 1 ? 'orden' : 'órdenes'}
                </span>
                {clientHistoryFilter && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF5500]/20 text-[#FF5500] font-bold border border-[#FF5500]/40 flex items-center gap-1">
                    <span>Filtro cliente: {clientHistoryFilter}</span>
                    <button onClick={() => setClientHistoryFilter(null)} className="hover:text-white">✕</button>
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Flujo operativo, transiciones técnicas y avisos automáticos por WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNewOrder && (
              <button
                type="button"
                onClick={onNewOrder}
                className="px-3.5 py-1.5 bg-[#FF5500] hover:bg-[#FF6600] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#FF5500]/20 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva Orden</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer border border-zinc-800"
              title="Cerrar panel de órdenes"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 2. BARRA DE HERRAMIENTAS: BÚSQUEDA Y FILTROS POR ESTADO */}
        <div className="bg-[#161619] border-b border-zinc-800/80 px-4 sm:px-6 py-2.5 flex flex-col gap-2 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 justify-between">
            
            {/* Buscador Universal */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por # Orden, Cliente, DNI, Teléfono, IMEI o Modelo..."
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-[#FF5500] transition-colors font-sans"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Selector de atajos rápidos o exportación */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 self-end sm:self-auto">
              <span className="text-[11px] font-mono">
                Pendientes taller: <strong className="text-amber-400">{orders.filter(o => o.status !== 'delivered' && o.status !== 'no_repair').length}</strong>
              </span>
            </div>
          </div>

          {/* Pastillas / Tabs de Estados con contadores */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-zinc-200 text-zinc-900 shadow'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <span>Todos</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'all' ? 'bg-zinc-300 text-zinc-900' : 'bg-zinc-700 text-zinc-300'}`}>
                {statusCounts.all}
              </span>
            </button>

            {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
              const Icon = config.icon;
              const isSelected = statusFilter === statusKey;
              return (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => setStatusFilter(statusKey)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                    isSelected 
                      ? `${config.badgeClass} ring-1 ring-[#FF5500]/50 font-bold`
                      : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
                  <span>{config.shortLabel}</span>
                  <span className="text-[10px] font-mono opacity-80">
                    ({statusCounts[statusKey] || 0})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. CONTENIDO PRINCIPAL: TABLA DE ÓRDENES */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                <Search className="w-8 h-8 text-zinc-600" />
              </div>
              <p className="text-sm font-semibold text-zinc-300">No se encontraron órdenes registradas</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                Probá cambiando los términos de búsqueda o quitando los filtros de estado aplicados.
              </p>
              {onNewOrder && (
                <button
                  onClick={onNewOrder}
                  className="mt-4 px-4 py-2 bg-[#FF5500] hover:bg-[#FF6600] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Crear primera orden de servicio
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#161619] shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                      <th className="py-3 px-4 min-w-[140px]"># Orden</th>
                      <th className="py-3 px-4 min-w-[180px]">Cliente</th>
                      <th className="py-3 px-4 min-w-[200px]">Equipo & Falla</th>
                      <th className="py-3 px-4 min-w-[160px]">Estado Técnico</th>
                      <th className="py-3 px-4 min-w-[130px] text-right">Saldo / Cobro</th>
                      <th className="py-3 px-4 min-w-[160px]">Fecha Pactada</th>
                      <th className="py-3 px-4 min-w-[120px] text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-sans">
                    {filteredOrders.map((order) => {
                      const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.received;
                      const { deliveryAlert, inactiveAlert } = getTimingAlert(order);
                      const balance = order.service?.balanceDue ?? 0;
                      const totalBudget = order.service?.budgetTotal ?? 0;

                      return (
                        <tr 
                          key={order.id || order.orderNumber}
                          onClick={() => setSelectedOrder(order)}
                          className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                        >
                          {/* 1. # Orden & Ingreso */}
                          <td className="py-3 px-4 align-middle">
                            <div className="font-mono font-bold text-white text-sm group-hover:text-[#FF5500] transition-colors flex items-center gap-1.5">
                              <span>{order.orderNumber}</span>
                            </div>
                            <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-zinc-500" />
                              <span>{formatRelativeTime(order.createdAt)}</span>
                            </div>
                          </td>

                          {/* 2. Cliente */}
                          <td className="py-3 px-4 align-middle">
                            <div className="font-bold text-zinc-100 line-clamp-1">
                              {order.customer?.name || 'Cliente sin nombre'}
                            </div>
                            <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                              {order.customer?.phone && (
                                <a 
                                  href={`https://wa.me/549${order.customer.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
                                  title="Abrir WhatsApp directo"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{order.customer.phone}</span>
                                </a>
                              )}
                              {order.customer?.docNumber && (
                                <span className="text-zinc-500 text-[10px] font-mono">
                                  DNI: {order.customer.docNumber}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Equipo & Falla */}
                          <td className="py-3 px-4 align-middle">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <Smartphone className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                              <span className="line-clamp-1">{order.device?.brand} {order.device?.model}</span>
                            </div>
                            <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                              {order.service?.requestedRepair || order.service?.preliminaryDiagnosis || 'Revisión técnica'}
                            </div>
                          </td>

                          {/* 4. Estado Técnico */}
                          <td className="py-3 px-4 align-middle whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${status.badgeClass}`}>
                              <span className={`w-2 h-2 rounded-full ${status.dotClass}`} />
                              <span>{status.label}</span>
                            </span>

                            {/* Alerta de inactividad si aplica */}
                            {inactiveAlert && (
                              <div className="mt-1">
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                  {inactiveAlert.text}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* 5. Saldo / Cobro */}
                          <td className="py-3 px-4 align-middle text-right whitespace-nowrap">
                            <div className={`font-mono font-bold text-sm ${balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {balance > 0 ? `$${balance.toLocaleString('es-AR')}` : 'Abonado OK'}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              Total: ${Number(totalBudget).toLocaleString('es-AR')}
                            </div>
                          </td>

                          {/* 6. Fecha Pactada */}
                          <td className="py-3 px-4 align-middle whitespace-nowrap">
                            <div className="text-zinc-300 font-medium">
                              {formatPactada(order.service?.estimatedDeliveryDate)}
                            </div>
                            {deliveryAlert && (
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border mt-0.5 ${deliveryAlert.badgeClass}`}>
                                {deliveryAlert.text}
                              </span>
                            )}
                          </td>

                          {/* 7. Acciones */}
                          <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {/* Ver Detalle */}
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                title="Ver ficha técnica completa"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Imprimir Ticket */}
                              <button
                                type="button"
                                onClick={() => setTicketModalOrder(order)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                title="Imprimir Ticket de Recepción"
                              >
                                <Printer className="w-3.5 h-3.5 text-zinc-300" />
                              </button>

                              {/* WhatsApp Rápido */}
                              {order.customer?.phone && (
                                <a
                                  href={generateStatusWhatsAppUrl(order, order.status, '')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
                                  title="Enviar WhatsApp de estado actual"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {/* Eliminar */}
                              <button
                                type="button"
                                onClick={() => handleDelete(order.id, order.orderNumber)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                                title="Eliminar orden"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. DRAWER / MODAL COMPLETO DE DETALLE DE LA ORDEN (FICHA TÉCNICA)          */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141417] border-l border-zinc-800 w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-slide-left text-zinc-200">

            {/* Cabecera del Drawer */}
            <div className="bg-zinc-950 border-b border-zinc-800 px-5 py-4 flex items-start justify-between shrink-0 gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-heading font-black text-white">
                    {selectedOrder.orderNumber}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_CONFIG[selectedOrder.status]?.badgeClass || 'bg-zinc-800 text-zinc-300'}`}>
                    {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-medium">
                    {selectedOrder.device?.type || 'Equipo'}
                  </span>
                </div>
                
                {/* Tiempo en taller & Fecha pactada */}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#FF5500]" />
                    <span>Ingresó: {new Date(selectedOrder.createdAt).toLocaleString('es-AR')} ({formatRelativeTime(selectedOrder.createdAt)})</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRescheduling(!isRescheduling)}
                  className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-1 transition-colors cursor-pointer border border-zinc-700"
                  title="Reprogramar fecha de entrega"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Reprogramar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Selector de Reprogramación desplegable */}
            {isRescheduling && (
              <div className="p-3 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-1">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-amber-300">Nueva Entrega:</span>
                  <input
                    type="datetime-local"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsRescheduling(false)}
                    className="px-2 py-1 text-xs text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveReschedule}
                    disabled={!rescheduleDate}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Guardar Fecha
                  </button>
                </div>
              </div>
            )}

            {/* TABS DE SECCIONES INTERNAS */}
            <div className="flex items-center gap-2 px-5 py-2 border-b border-zinc-800/80 bg-zinc-900/60 text-xs shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'summary' 
                    ? 'bg-[#FF5500] text-white shadow' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Resumen & Datos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('technician')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'technician' 
                    ? 'bg-[#FF5500] text-white shadow' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Procesar Estado</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'notes' 
                    ? 'bg-[#FF5500] text-white shadow' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Notas Internas ({selectedOrder.internalNotesList?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'history' 
                    ? 'bg-[#FF5500] text-white shadow' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Auditoría & Logs ({selectedOrder.logs?.length || 0})</span>
              </button>
            </div>

            {/* CUERPO DEL DRAWER CON SCROLL */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* ================================================================= */}
              {/* TAB 1: RESUMEN Y BLOQUES DE DATOS                                 */}
              {/* ================================================================= */}
              {activeTab === 'summary' && (
                <div className="space-y-4">

                  {/* BLOQUE 1: DATOS DEL CLIENTE */}
                  <div className="bg-[#18181c] border border-zinc-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#FF5500]" />
                        Datos del Cliente
                      </span>
                      {selectedOrder.customer?.docNumber && (
                        <button
                          type="button"
                          onClick={() => {
                            setClientHistoryFilter(selectedOrder.customer.docNumber);
                            setSelectedOrder(null);
                          }}
                          className="text-[11px] text-[#FF5500] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <History className="w-3 h-3" />
                          <span>Ver historial del cliente</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Nombre Completo</span>
                        <span className="font-bold text-white text-sm">{selectedOrder.customer?.name || 'Consumidor Final'}</span>
                      </div>

                      <div>
                        <span className="text-zinc-500 block text-[10px]">Documento / DNI</span>
                        <span className="font-mono text-zinc-200">{selectedOrder.customer?.docNumber || 'No especificado'}</span>
                      </div>

                      <div>
                        <span className="text-zinc-500 block text-[10px]">Teléfono WhatsApp</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-emerald-400">{selectedOrder.customer?.phone || 'Sin teléfono'}</span>
                          {selectedOrder.customer?.phone && (
                            <a
                              href={`https://wa.me/549${selectedOrder.customer.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              Chat
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-zinc-500 block text-[10px]">Email</span>
                        <span className="text-zinc-300">{selectedOrder.customer?.email || 'No registrado'}</span>
                      </div>
                    </div>
                  </div>

                  {/* BLOQUE 2: EQUIPO Y SEGURIDAD */}
                  <div className="bg-[#18181c] border border-zinc-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-[#FF5500]" />
                        Equipo & Desbloqueo
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {selectedOrder.device?.brand} • {selectedOrder.device?.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Modelo Exacto</span>
                        <span className="font-bold text-white text-sm">{selectedOrder.device?.brand} {selectedOrder.device?.model}</span>
                      </div>

                      <div>
                        <span className="text-zinc-500 block text-[10px]">IMEI / Serial</span>
                        <div className="flex items-center gap-1 font-mono text-zinc-300">
                          <span>{selectedOrder.device?.imei || 'No registrado'}</span>
                          {selectedOrder.device?.imei && (
                            <button
                              type="button"
                              onClick={() => handleCopy(selectedOrder.device.imei, 'imei')}
                              className="text-zinc-500 hover:text-white p-0.5 cursor-pointer"
                              title="Copiar IMEI"
                            >
                              {copiedField === 'imei' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-zinc-500 block text-[10px]">Color y Estética</span>
                        <span className="text-zinc-300">
                          {selectedOrder.device?.color ? `Color: ${selectedOrder.device.color}` : 'Color estándar'}
                          {selectedOrder.device?.aestheticCondition && ` (${selectedOrder.device.aestheticCondition})`}
                        </span>
                      </div>

                      {/* CLAVE / SEGURIDAD */}
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Seguridad de Pantalla</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {selectedOrder.device?.security?.type === 'pattern' ? (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                                Patrón 3x3
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowPatternModal(true)}
                                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-zinc-700"
                              >
                                <Eye className="w-3 h-3 text-[#FF5500]" />
                                Ver Dibujo
                              </button>
                            </div>
                          ) : selectedOrder.device?.security?.type === 'none' ? (
                            <span className="text-zinc-500 italic text-xs">Sin clave</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white text-sm">
                                {showPin 
                                  ? (selectedOrder.device?.security?.pin || 'Sin PIN') 
                                  : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowPin(!showPin)}
                                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
                                title={showPin ? "Ocultar PIN" : "Mostrar PIN"}
                              >
                                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              {selectedOrder.device?.security?.pin && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(selectedOrder.device.security.pin, 'pin')}
                                  className="text-zinc-400 hover:text-white p-1 cursor-pointer"
                                  title="Copiar PIN"
                                >
                                  {copiedField === 'pin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BLOQUE 3: PRESUPUESTO, SEÑA Y SALDO RESTANTE */}
                  <div className="bg-[#18181c] border border-zinc-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        Presupuesto y Cobro
                      </span>

                      <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <DollarSign className="w-3 h-3" />
                        Registrar Pago
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 mb-3 text-center">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase">Total Acordado</span>
                        <span className="text-sm sm:text-base font-bold text-white font-mono">
                          ${Number(selectedOrder.service?.budgetTotal || 0).toLocaleString('es-AR')}
                        </span>
                      </div>

                      <div className="border-x border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block uppercase">Seña / Abonado</span>
                        <span className="text-sm sm:text-base font-bold text-zinc-300 font-mono">
                          ${Number(selectedOrder.service?.deposit || 0).toLocaleString('es-AR')}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase">Saldo al Retirar</span>
                        <span className={`text-sm sm:text-base font-black font-mono ${
                          (selectedOrder.service?.balanceDue ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          ${Number(selectedOrder.service?.balanceDue || 0).toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="text-zinc-400">
                        <strong className="text-zinc-300">Trabajo solicitado:</strong> {selectedOrder.service?.requestedRepair || 'Diagnóstico general'}
                      </div>
                      {selectedOrder.service?.preliminaryDiagnosis && (
                        <div className="text-zinc-400">
                          <strong className="text-zinc-300">Diagnóstico inicial:</strong> {selectedOrder.service.preliminaryDiagnosis}
                        </div>
                      )}
                      <div className="text-zinc-400">
                        <strong className="text-zinc-300">Garantía acordada:</strong> {selectedOrder.service?.warranty || '90 días'}
                      </div>
                    </div>

                    {/* Pagos registrados */}
                    {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/80">
                        <span className="text-[11px] font-bold text-zinc-400 block mb-1.5">Historial de Cobros:</span>
                        <div className="space-y-1">
                          {selectedOrder.payments.map((p, pi) => (
                            <div key={p.id || pi} className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-zinc-900 border border-zinc-800 font-mono">
                              <span className="text-zinc-400">{new Date(p.timestamp).toLocaleDateString('es-AR')} - {p.method}:</span>
                              <span className="font-bold text-emerald-400">+${Number(p.amount).toLocaleString('es-AR')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BLOQUE 4: CHECKLIST INICIAL DE INGRESO */}
                  {selectedOrder.service?.checklist && (
                    <div className="bg-[#18181c] border border-zinc-800 rounded-2xl p-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2.5">
                        Checklist al Ingresar
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                        {Object.entries(selectedOrder.service.checklist).map(([key, ok]) => {
                          const labels = {
                            turnsOn: 'Enciende',
                            touchOk: 'Táctil / Pantalla',
                            camerasOk: 'Cámaras',
                            audioOk: 'Audio / Parlante',
                            chargingOk: 'Pin de Carga',
                            biometricsOk: 'FaceID / Huella',
                            simTrayPresent: 'Bandeja SIM'
                          };
                          return (
                            <div key={key} className="flex items-center gap-1.5 text-zinc-300">
                              {ok ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              )}
                              <span>{labels[key] || key}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ================================================================= */}
              {/* TAB 2: PROCESADOR DE ESTADO TÉCNICO (TRANSICIONES SISTROFIX)      */}
              {/* ================================================================= */}
              {activeTab === 'technician' && (
                <div className="space-y-5">
                  <div className="bg-[#18181c] border border-zinc-800 rounded-2xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-[#FF5500]" />
                      Transición Técnica de Estado
                    </h4>
                    <p className="text-xs text-zinc-400 mb-3">
                      Elegí la acción técnica a declarar para esta orden:
                    </p>

                    {/* BOTONES DE ESTADOS TÉCNICOS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* 1. Declarar Reparado */}
                      <button
                        type="button"
                        onClick={() => setTargetStatus('ready')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                          targetStatus === 'ready'
                            ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-500/40 text-white'
                            : 'bg-zinc-900/80 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs text-white">Declarar Reparado</div>
                          <div className="text-[10px] text-zinc-400">Listo para retirar en el local</div>
                        </div>
                      </button>

                      {/* 2. Espera de Autorización */}
                      <button
                        type="button"
                        onClick={() => setTargetStatus('waiting_auth')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                          targetStatus === 'waiting_auth'
                            ? 'bg-purple-500/20 border-purple-400 ring-2 ring-purple-500/40 text-white'
                            : 'bg-zinc-900/80 border-purple-500/30 hover:bg-purple-500/10 text-purple-300'
                        }`}
                      >
                        <HelpCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs text-white">Espera de Autorización</div>
                          <div className="text-[10px] text-zinc-400">Presupuesto pendiente de aprobación</div>
                        </div>
                      </button>

                      {/* 3. Espera de Repuesto */}
                      <button
                        type="button"
                        onClick={() => setTargetStatus('waiting_part')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                          targetStatus === 'waiting_part'
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-500/40 text-white'
                            : 'bg-zinc-900/80 border-amber-500/30 hover:bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        <Package className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs text-white">Espera de Repuesto</div>
                          <div className="text-[10px] text-zinc-400">Faltante de stock / pedido a proveedor</div>
                        </div>
                      </button>

                      {/* 4. En Mesa de Trabajo */}
                      <button
                        type="button"
                        onClick={() => setTargetStatus('in_progress')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                          targetStatus === 'in_progress'
                            ? 'bg-sky-500/20 border-sky-400 ring-2 ring-sky-500/40 text-white'
                            : 'bg-zinc-900/80 border-sky-500/30 hover:bg-sky-500/10 text-sky-300'
                        }`}
                      >
                        <Wrench className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs text-white">En Mesa de Trabajo</div>
                          <div className="text-[10px] text-zinc-400">Técnico trabajando / en pruebas</div>
                        </div>
                      </button>

                      {/* 5. Sin Reparación */}
                      <button
                        type="button"
                        onClick={() => setTargetStatus('no_repair')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                          targetStatus === 'no_repair'
                            ? 'bg-rose-500/20 border-rose-400 ring-2 ring-rose-500/40 text-white'
                            : 'bg-zinc-900/80 border-rose-500/30 hover:bg-rose-500/10 text-rose-300'
                        }`}
                      >
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs text-white">Sin Reparación</div>
                          <div className="text-[10px] text-zinc-400">Devolución sin costo / no viable</div>
                        </div>
                      </button>

                      {/* 6. Declarar Entregado */}
                      <button
                        type="button"
                        onClick={() => setTargetStatus('delivered')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                          targetStatus === 'delivered'
                            ? 'bg-zinc-700 border-zinc-400 ring-2 ring-zinc-500 text-white'
                            : 'bg-zinc-900/80 border-zinc-700 hover:bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        <Shield className="w-5 h-5 text-zinc-300 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs text-white">Declarar Entregado</div>
                          <div className="text-[10px] text-zinc-400">Cierre de orden / retiro en local</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* FORMULARIO DE CONFIRMACIÓN DE TRANSICIÓN */}
                  {targetStatus && (
                    <div className="bg-[#18181c] border border-zinc-700 rounded-2xl p-4 space-y-4 animate-fade-in shadow-xl">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span>Confirmar paso a:</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${STATUS_CONFIG[targetStatus]?.badgeClass}`}>
                            {STATUS_CONFIG[targetStatus]?.label}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setTargetStatus(null)}
                          className="text-xs text-zinc-500 hover:text-white"
                        >
                          Cancelar
                        </button>
                      </div>

                      {/* Informe Técnico */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Informe Técnico (Qué se le hizo o qué se detectó):
                        </label>
                        <textarea
                          rows={3}
                          value={techReport}
                          onChange={(e) => setTechReport(e.target.value)}
                          placeholder="Ej: Se reemplazó módulo original, se calibró TrueTone, pruebas de carga y táctil superadas 100%..."
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-[#FF5500] font-sans"
                        />
                      </div>

                      {/* Checklist de salida si es Reparado o Entregado */}
                      {(targetStatus === 'ready' || targetStatus === 'delivered') && (
                        <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl">
                          <span className="text-xs font-bold text-zinc-300 block mb-2">
                            Checklist de Control de Calidad de Salida:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {[
                              ['turnsOn', 'Enciende OK'],
                              ['touchOk', 'Táctil / Pantalla OK'],
                              ['camerasOk', 'Cámaras OK'],
                              ['chargingOk', 'Carga OK'],
                              ['audioOk', 'Audio OK']
                            ].map(([key, label]) => (
                              <label key={key} className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={exitChecklist[key]}
                                  onChange={(e) => setExitChecklist({ ...exitChecklist, [key]: e.target.checked })}
                                  className="w-4 h-4 rounded text-[#FF5500] bg-zinc-950 border-zinc-700"
                                />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Nota interna opcional */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">
                          Nota interna adicional (Solo para empleados, opcional):
                        </label>
                        <input
                          type="text"
                          value={techInternalNote}
                          onChange={(e) => setTechInternalNote(e.target.value)}
                          placeholder="Ej: Repuesto SmartSupply JK colocado en orden..."
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-zinc-500"
                        />
                      </div>

                      {/* Notificación al Cliente */}
                      <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
                        <span className="text-xs font-bold text-zinc-300">
                          Notificación Automática al Cliente:
                        </span>
                        
                        <div className="flex items-center gap-4 text-xs">
                          <label className="flex items-center gap-2 text-emerald-400 cursor-pointer font-bold">
                            <input
                              type="checkbox"
                              checked={sendWhatsAppOnProcess}
                              onChange={(e) => setSendWhatsAppOnProcess(e.target.checked)}
                              className="w-4 h-4 rounded text-emerald-500 bg-zinc-950 border-zinc-700"
                            />
                            <span>Enviar Notificación por WhatsApp</span>
                          </label>

                          <label className="flex items-center gap-2 text-zinc-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sendEmailOnProcess}
                              onChange={(e) => setSendEmailOnProcess(e.target.checked)}
                              className="w-4 h-4 rounded text-[#FF5500] bg-zinc-950 border-zinc-700"
                            />
                            <span>Enviar Email</span>
                          </label>
                        </div>
                      </div>

                      {/* Botón de Procesar */}
                      <button
                        type="button"
                        onClick={handleProcessOrder}
                        className="w-full py-3 bg-[#FF5500] hover:bg-[#FF6600] text-white font-bold rounded-xl text-xs shadow-lg shadow-[#FF5500]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>PROCESAR ORDEN Y APLICAR ESTADO</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ================================================================= */}
              {/* TAB 3: MURO DE NOTAS INTERNAS                                     */}
              {/* ================================================================= */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {/* Formulario de agregar nota */}
                  <form onSubmit={handleAddNote} className="bg-[#18181c] border border-zinc-800 rounded-2xl p-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#FF5500]" />
                      Agregar Nota Interna de Taller
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Escribí una observación para el equipo (ej: Cliente llamó para consultar estado)..."
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FF5500]"
                      />
                      <button
                        type="submit"
                        disabled={!newNoteText.trim()}
                        className="px-4 py-2 bg-[#FF5500] hover:bg-[#FF6600] text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Publicar
                      </button>
                    </div>
                  </form>

                  {/* Listado de Notas */}
                  <div className="space-y-2.5">
                    {(!selectedOrder.internalNotesList || selectedOrder.internalNotesList.length === 0) ? (
                      <div className="text-center p-6 text-zinc-500 text-xs italic bg-zinc-900/40 rounded-xl border border-zinc-800/60">
                        No hay notas internas registradas aún.
                      </div>
                    ) : (
                      selectedOrder.internalNotesList.map((note) => (
                        <div key={note.id} className="p-3 bg-[#18181c] border border-zinc-800 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500">
                            <span className="font-bold text-zinc-400">{note.author || 'Técnico Montec'}</span>
                            <span>{new Date(note.timestamp).toLocaleString('es-AR')}</span>
                          </div>
                          <p className="text-xs text-zinc-200">{note.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* TAB 4: AUDITORÍA Y REGISTRO DE EVENTOS (LOGS)                     */}
              {/* ================================================================= */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  <div className="bg-[#18181c] border border-zinc-800 rounded-2xl p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-3 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-[#FF5500]" />
                      Línea de Tiempo de Auditoría Técnica
                    </span>

                    <div className="space-y-2">
                      {selectedOrder.logs?.map((log, li) => (
                        <div key={li} className="flex items-start gap-2.5 text-xs py-1.5 border-b border-zinc-800/60 last:border-none">
                          <span className="w-2 h-2 rounded-full bg-[#FF5500] mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-zinc-200">{log.action}</p>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {new Date(log.timestamp).toLocaleString('es-AR')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* PIE DE ACCIONES DE LA ORDEN SELECCIONADA */}
            <div className="bg-zinc-950 border-t border-zinc-800 px-5 py-3 flex items-center justify-between gap-2 shrink-0 flex-wrap">
              <div className="flex items-center gap-2">
                {/* Reimprimir Comprobante */}
                <button
                  type="button"
                  onClick={() => setTicketModalOrder(selectedOrder)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Reimprimir Ticket</span>
                </button>

                {/* Cobrar Saldo */}
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/30"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Cobrar Saldo</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Abrir WhatsApp */}
                {selectedOrder.customer?.phone && (
                  <a
                    href={generateStatusWhatsAppUrl(selectedOrder, selectedOrder.status, '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold cursor-pointer"
                >
                  Volver a lista
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-MODAL: PATRÓN DE DESBLOQUEO VECTORIAL EN TAMAÑO COMPLETO           */}
      {/* ========================================================================= */}
      {showPatternModal && selectedOrder && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#161619] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowPatternModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="text-base font-bold text-white mb-1">
              Patrón de Desbloqueo 3x3
            </h4>
            <p className="text-xs text-zinc-400 mb-4 font-mono">
              Orden {selectedOrder.orderNumber} • {selectedOrder.device?.brand} {selectedOrder.device?.model}
            </p>

            <div className="flex justify-center my-3">
              <PatternThumbnail 
                sequence={selectedOrder.device?.security?.patternSequence || []} 
                size={180} 
              />
            </div>

            <button
              type="button"
              onClick={() => setShowPatternModal(false)}
              className="mt-4 w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cerrar Vista de Patrón
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SUB-MODAL: REGISTRAR COBRO / PAGO ADICIONAL                           */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#161619] border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Registrar Cobro / Abono
            </h4>
            <p className="text-xs text-zinc-400 mb-4">
              Orden {selectedOrder.orderNumber} • Saldo pendiente: <strong className="text-amber-400">${Number(selectedOrder.service?.balanceDue || 0).toLocaleString('es-AR')}</strong>
            </p>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Monto a Cobrar ($):</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-zinc-500">$</span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Monto..."
                    autoFocus
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono font-bold text-sm outline-none focus:border-emerald-400"
                  />
                </div>
                {Number(selectedOrder.service?.balanceDue) > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(String(selectedOrder.service?.balanceDue || 0))}
                    className="mt-1 text-[11px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    Cobrar saldo total pendiente (${Number(selectedOrder.service.balanceDue).toLocaleString('es-AR')})
                  </button>
                )}
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Método de Pago:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-400"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Mercado Pago">Mercado Pago / QR</option>
                  <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Observación o Comprobante (opcional):</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Ej: Cobro en mostrador / Seña de módulo"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white outline-none focus:border-zinc-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!paymentAmount || Number(paymentAmount) <= 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Registrar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SUB-MODAL: TICKET DE IMPRESIÓN Y COMPROBANTE OFICIAL                   */}
      {/* ========================================================================= */}
      {ticketModalOrder && (
        <OrderTicketModal
          order={ticketModalOrder}
          onClose={() => setTicketModalOrder(null)}
        />
      )}

    </div>
  );
}
