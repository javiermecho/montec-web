import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  ArrowLeft,
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
  RotateCcw,
  Sun,
  Moon
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
    badgeClass: 'bg-zinc-800 text-zinc-100 border-zinc-600',
    lightBadgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    dotClass: 'bg-zinc-400',
    icon: Clock
  },
  waiting_auth: {
    label: 'Espera Autorización',
    shortLabel: 'Presupuesto Pendiente',
    color: 'purple',
    badgeClass: 'bg-purple-950/60 text-purple-200 border-purple-500/40',
    lightBadgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    dotClass: 'bg-purple-400',
    icon: HelpCircle
  },
  waiting_part: {
    label: 'Espera de Repuesto',
    shortLabel: 'Faltante de Stock',
    color: 'amber',
    badgeClass: 'bg-amber-950/60 text-amber-200 border-amber-500/40',
    lightBadgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
    dotClass: 'bg-amber-400',
    icon: Package
  },
  in_progress: {
    label: 'En Mesa de Trabajo',
    shortLabel: 'En Reparación',
    color: 'sky',
    badgeClass: 'bg-sky-950/60 text-sky-200 border-sky-500/40',
    lightBadgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    dotClass: 'bg-sky-400',
    icon: Wrench
  },
  ready: {
    label: 'Listo para Retirar',
    shortLabel: 'Reparado OK',
    color: 'emerald',
    badgeClass: 'bg-emerald-950/60 text-emerald-200 border-emerald-500/40',
    lightBadgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-400',
    icon: CheckCircle2
  },
  no_repair: {
    label: 'Sin Reparación',
    shortLabel: 'Devolución',
    color: 'rose',
    badgeClass: 'bg-rose-950/60 text-rose-200 border-rose-500/40',
    lightBadgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-400',
    icon: AlertTriangle
  },
  delivered: {
    label: 'Entregado (Cerrado)',
    shortLabel: 'Entregado',
    color: 'slate',
    badgeClass: 'bg-zinc-800/80 text-zinc-300 border-zinc-700 line-through',
    lightBadgeClass: 'bg-slate-100 text-slate-600 border-slate-300 line-through',
    dotClass: 'bg-zinc-500',
    icon: Shield
  }
};

export default function RepairOrdersManager({ onSelectOrder, onNewOrder, onClose, isEmbedded = false }) {
  const { 
    orders, 
    updateRepairOrder,
    updateRepairOrderStatus, 
    addOrderInternalNote,
    recordOrderPayment,
    deleteRepairOrder,
    panelTheme,
    togglePanelTheme
  } = useData();

  const isLight = panelTheme === 'light';

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
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
          lightBadgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold'
        };
      } else if (diffHours <= 6) {
        deliveryAlert = {
          type: 'urgent',
          text: diffHours === 0 ? 'Vence en menos de 1 h' : `Vence en ${diffHours} hs`,
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          lightBadgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold'
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
          badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700',
          lightBadgeClass: 'bg-slate-100 text-slate-600 border-slate-300'
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

  const mainToolbarAndTable = (
    <div className="space-y-4 flex-1 flex flex-col">
      {/* 2. BARRA DE HERRAMIENTAS: BÚSQUEDA Y FILTROS POR ESTADO */}
      <div className={`p-4 rounded-2xl border flex flex-col gap-3 transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#121214] border-zinc-800/80'
      }`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 justify-between">
          
          {/* Buscador Universal */}
          <div className="relative flex-1 max-w-xl">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-zinc-400'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por # Orden, Cliente, DNI, Teléfono, IMEI o Modelo..."
              className={`w-full border rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm outline-none focus:border-[#FF5500] transition-colors font-sans ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  : 'bg-zinc-900 border-zinc-700/80 text-zinc-200 placeholder-zinc-500'
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded cursor-pointer ${
                  isLight ? 'text-slate-400 hover:text-slate-800' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Contador de pendientes */}
          <div className="flex items-center gap-1.5 text-xs self-end sm:self-auto">
            <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Pendientes taller: <strong className={isLight ? 'text-amber-600 font-bold' : 'text-amber-400 font-bold'}>{orders.filter(o => o.status !== 'delivered' && o.status !== 'no_repair').length}</strong>
            </span>
          </div>
        </div>

        {/* Pastillas / Tabs de Estados con contadores */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
              statusFilter === 'all'
                ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-[0_0_12px_rgba(255,85,0,0.35)]'
                : (isLight 
                    ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900' 
                    : 'bg-zinc-900/80 text-zinc-300 border-zinc-700/80 hover:text-white hover:bg-zinc-800')
            }`}
          >
            <span>Todos</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              statusFilter === 'all'
                ? 'bg-black/25 text-white font-bold'
                : (isLight ? 'bg-slate-100 text-slate-700 font-semibold' : 'bg-zinc-800 text-zinc-200 font-semibold')
            }`}>
              {statusCounts.all}
            </span>
          </button>

          {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
            const isSelected = statusFilter === statusKey;
            return (
              <button
                key={statusKey}
                type="button"
                onClick={() => setStatusFilter(statusKey)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                  isSelected 
                    ? (isLight 
                        ? `${config.lightBadgeClass || config.badgeClass} ring-2 ring-[#FF5500]/50 font-bold shadow-xs` 
                        : `${config.badgeClass} ring-2 ring-[#FF5500]/60 font-bold shadow`)
                    : (isLight 
                        ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900' 
                        : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:text-white hover:bg-zinc-800')
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
      <div className={`border rounded-2xl overflow-hidden shadow-xs transition-colors flex-1 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#121214] border-zinc-800/80'
      }`}>
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 text-zinc-500">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 border ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-zinc-900 border-zinc-800'
            }`}>
              <Search className="w-8 h-8 text-zinc-500" />
            </div>
            <p className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>No se encontraron órdenes registradas</p>
            <p className={`text-xs mt-1 max-w-sm ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
              Probá cambiando los términos de búsqueda o quitando los filtros de estado aplicados.
            </p>
            {onNewOrder && (
              <button
                onClick={onNewOrder}
                className="mt-4 px-4 py-2 bg-[#FF5500] hover:bg-[#FF6600] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Crear primera orden de servicio
              </button>
            )}
          </div>
        ) : (
          <div className={isEmbedded ? "overflow-x-auto max-h-[600px]" : "overflow-x-auto h-full"}>
            <table className="w-full text-left border-collapse text-xs">
              <thead className={`uppercase text-[11px] font-mono tracking-wider sticky top-0 z-10 border-b ${
                isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
              }`}>
                <tr>
                  <th className="py-3 px-4 min-w-[130px]"># Orden</th>
                  <th className="py-3 px-4 min-w-[180px]">Cliente</th>
                  <th className="py-3 px-4 min-w-[200px]">Equipo & Falla</th>
                  <th className="py-3 px-4 min-w-[160px]">Estado Técnico</th>
                  <th className="py-3 px-4 min-w-[130px] text-right">Saldo / Cobro</th>
                  <th className="py-3 px-4 min-w-[160px]">Fecha Pactada</th>
                  <th className="py-3 px-4 min-w-[120px] text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-sans ${isLight ? 'divide-slate-200' : 'divide-zinc-800/60'}`}>
                {filteredOrders.map((order) => {
                  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.received;
                  const { deliveryAlert, inactiveAlert } = getTimingAlert(order);
                  const balance = order.service?.balanceDue ?? 0;
                  const totalBudget = order.service?.budgetTotal ?? 0;

                  return (
                    <tr 
                      key={order.id || order.orderNumber}
                      onClick={() => setSelectedOrder(order)}
                      className={`transition-colors cursor-pointer group ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/40'
                      }`}
                    >
                      {/* 1. # Orden & Ingreso */}
                      <td className="py-3 px-4 align-middle">
                        <div className={`font-mono font-bold text-sm group-hover:text-[#FF5500] transition-colors flex items-center gap-1.5 ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          <span>{order.orderNumber}</span>
                        </div>
                        <div className={`text-[10px] flex items-center gap-1 mt-0.5 ${
                          isLight ? 'text-slate-500' : 'text-zinc-400'
                        }`}>
                          <Clock className={`w-3 h-3 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
                          <span>{formatRelativeTime(order.createdAt)}</span>
                        </div>
                      </td>

                      {/* 2. Cliente */}
                      <td className="py-3 px-4 align-middle">
                        <div className={`font-bold line-clamp-1 ${
                          isLight ? 'text-slate-900' : 'text-zinc-100'
                        }`}>
                          {order.customer?.name || 'Cliente sin nombre'}
                        </div>
                        <div className="text-[11px] flex items-center gap-2 mt-0.5">
                          {order.customer?.phone && (
                            <a 
                              href={`https://wa.me/549${order.customer.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={`flex items-center gap-1 font-mono font-semibold ${
                                isLight ? 'text-emerald-600 hover:text-emerald-700' : 'text-emerald-400 hover:text-emerald-300'
                              }`}
                              title="Abrir WhatsApp directo"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{order.customer.phone}</span>
                            </a>
                          )}
                          {order.customer?.docNumber && (
                            <span className={`text-[10px] font-mono ${
                              isLight ? 'text-slate-500' : 'text-zinc-500'
                            }`}>
                              DNI: {order.customer.docNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Equipo & Falla */}
                      <td className="py-3 px-4 align-middle">
                        <div className={`font-bold flex items-center gap-1.5 ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          <Smartphone className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                          <span className="line-clamp-1">{order.device?.brand} {order.device?.model}</span>
                        </div>
                        <div className={`text-[11px] line-clamp-1 mt-0.5 ${
                          isLight ? 'text-slate-500' : 'text-zinc-400'
                        }`}>
                          {order.service?.requestedRepair || order.service?.preliminaryDiagnosis || 'Revisión técnica'}
                        </div>
                      </td>

                      {/* 4. Estado Técnico */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          isLight ? (status.lightBadgeClass || status.badgeClass) : status.badgeClass
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${status.dotClass}`} />
                          <span>{status.label}</span>
                        </span>

                        {inactiveAlert && (
                          <div className="mt-1">
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                              isLight ? (inactiveAlert.lightBadgeClass || inactiveAlert.badgeClass) : inactiveAlert.badgeClass
                            }`}>
                              {inactiveAlert.text}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 5. Saldo / Cobro */}
                      <td className="py-3 px-4 align-middle text-right whitespace-nowrap">
                        <div className={`font-mono font-bold text-sm ${
                          balance > 0 
                            ? (isLight ? 'text-amber-600' : 'text-amber-400') 
                            : (isLight ? 'text-emerald-600' : 'text-emerald-400')
                        }`}>
                          {balance > 0 ? `$${balance.toLocaleString('es-AR')}` : 'Abonado OK'}
                        </div>
                        <div className={`text-[10px] ${isLight ? 'text-slate-500 font-medium' : 'text-zinc-500'}`}>
                          Total: ${Number(totalBudget).toLocaleString('es-AR')}
                        </div>
                      </td>

                      {/* 6. Fecha Pactada */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <div className={`font-medium ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                          {formatPactada(order.service?.estimatedDeliveryDate)}
                        </div>
                        {deliveryAlert && (
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border mt-0.5 ${
                            isLight ? (deliveryAlert.lightBadgeClass || deliveryAlert.badgeClass) : deliveryAlert.badgeClass
                          }`}>
                            {deliveryAlert.text}
                          </span>
                        )}
                      </td>

                      {/* 7. Acciones */}
                      <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                            }`}
                            title="Ver ficha técnica completa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setTicketModalOrder(order)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                            }`}
                            title="Imprimir Ticket de Recepción"
                          >
                            <Printer className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-700" />
                          </button>

                          {order.customer?.phone && (
                            <a
                              href={generateStatusWhatsAppUrl(order, order.status, '')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
                              }`}
                              title="Enviar WhatsApp de estado actual"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(order.id, order.orderNumber)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isLight ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                            }`}
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
        )}
      </div>
    </div>
  );

  const renderOrderDetailView = () => {
    if (!selectedOrder) return null;

    return (
      <div className="w-full space-y-5 animate-fade-in font-sans">
        {/* BARRA SUPERIOR DE NAVEGACIÓN Y ACCIONES */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <button
            type="button"
            onClick={() => setSelectedOrder(null)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border shadow-xs ${
              isLight 
                ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' 
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-[#FF5500]" />
            <span>Volver al listado de órdenes</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsRescheduling(!isRescheduling)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
              }`}
              title="Reprogramar fecha de entrega"
            >
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>Reprogramar</span>
            </button>

            <button
              type="button"
              onClick={() => setTicketModalOrder(selectedOrder)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
              }`}
            >
              <Printer className="w-4 h-4 text-[#FF5500]" />
              <span>Imprimir Ticket</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span>Registrar Pago</span>
            </button>

            {selectedOrder.customer?.phone && (
              <a
                href={generateStatusWhatsAppUrl(selectedOrder, selectedOrder.status, '')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        {/* TARJETA PRINCIPAL DEL ENCABEZADO DE LA ORDEN */}
        <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#18181c] border-zinc-800'
        }`}>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className={`text-2xl sm:text-3xl font-heading font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {selectedOrder.orderNumber}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                STATUS_CONFIG[selectedOrder.status]?.badgeClass || 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}>
                {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold border ${
                isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}>
                {selectedOrder.device?.type || 'Equipo'}
              </span>
            </div>

            <div className={`flex items-center gap-4 mt-2 text-xs flex-wrap ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-[#FF5500]" />
                <span>Ingresó: <strong>{new Date(selectedOrder.createdAt).toLocaleString('es-AR')}</strong> ({formatRelativeTime(selectedOrder.createdAt)})</span>
              </span>
              {selectedOrder.service?.estimatedDeliveryDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>Entrega pactada: <strong>{formatPactada(selectedOrder.service.estimatedDeliveryDate)}</strong></span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`text-right px-4 py-2 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900 border-zinc-800'
            }`}>
              <span className={`block text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Saldo Pendiente</span>
              <span className={`text-lg sm:text-xl font-mono font-black ${
                (selectedOrder.service?.balanceDue ?? 0) > 0 
                  ? (isLight ? 'text-amber-600' : 'text-amber-400')
                  : (isLight ? 'text-emerald-600' : 'text-emerald-400')
              }`}>
                ${Number(selectedOrder.service?.balanceDue || 0).toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </div>

        {/* SELECTOR DE REPROGRAMACIÓN DESPLEGABLE */}
        {isRescheduling && (
          <div className={`p-4 border rounded-2xl flex items-center justify-between gap-3 flex-wrap ${
            isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              <Calendar className="w-5 h-5 text-amber-500 shrink-0" />
              <span className={`text-xs sm:text-sm font-bold ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
                Reprogramar Nueva Fecha de Entrega:
              </span>
              <input
                type="datetime-local"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className={`border rounded-xl px-3 py-1.5 text-xs sm:text-sm outline-none focus:border-amber-400 ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRescheduling(false)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
                  isLight ? 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200' : 'text-zinc-400 hover:text-white bg-zinc-900'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveReschedule}
                disabled={!rescheduleDate}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                Guardar Nueva Fecha
              </button>
            </div>
          </div>
        )}

        {/* TABS DE SECCIONES INTERNAS */}
        <div className={`flex items-center gap-2 p-1.5 border rounded-2xl text-xs sm:text-sm shrink-0 overflow-x-auto ${
          isLight ? 'border-slate-200 bg-slate-100' : 'border-zinc-800/80 bg-zinc-900/60'
        }`}>
          {[
            { id: 'summary', icon: FileText, label: 'Resumen & Datos' },
            { id: 'technician', icon: Wrench, label: 'Procesar Estado' },
            { id: 'notes', icon: MessageSquare, label: `Notas Internas (${selectedOrder.internalNotesList?.length || 0})` },
            { id: 'history', icon: History, label: `Auditoría & Logs (${selectedOrder.logs?.length || 0})` }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  active
                    ? 'bg-[#FF5500] text-white shadow-md shadow-[#FF5500]/25'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* CONTENIDO EXPANDIDO DE CADA TAB */}
        <div className="space-y-5">
          {/* TAB 1: RESUMEN Y BLOQUES DE DATOS */}
          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* COLUMNA IZQUIERDA: CLIENTE Y EQUIPO */}
              <div className="space-y-5">
                {/* BLOQUE 1: DATOS DEL CLIENTE */}
                <div className={`border rounded-2xl p-5 shadow-xs transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#18181c] border-zinc-800'
                }`}>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-700/30">
                    <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                      <User className="w-4 h-4 text-[#FF5500]" />
                      Datos del Cliente
                    </span>
                    {selectedOrder.customer?.docNumber && (
                      <button
                        type="button"
                        onClick={() => {
                          setClientHistoryFilter(selectedOrder.customer.docNumber);
                          setSelectedOrder(null);
                        }}
                        className="text-xs text-[#FF5500] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Ver historial del cliente</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div>
                      <span className={`block text-[11px] mb-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Nombre Completo</span>
                      <span className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {selectedOrder.customer?.name || 'Consumidor Final'}
                      </span>
                    </div>

                    <div>
                      <span className={`block text-[11px] mb-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Documento / DNI</span>
                      <span className={`font-mono font-bold text-sm sm:text-base ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                        {selectedOrder.customer?.docNumber || 'No especificado'}
                      </span>
                    </div>

                    <div>
                      <span className={`block text-[11px] mb-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Teléfono WhatsApp</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                          {selectedOrder.customer?.phone || 'Sin teléfono'}
                        </span>
                        {selectedOrder.customer?.phone && (
                          <a
                            href={`https://wa.me/549${selectedOrder.customer.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Chat</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className={`block text-[11px] mb-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Email</span>
                      <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                        {selectedOrder.customer?.email || 'No registrado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BLOQUE 2: EQUIPO Y SEGURIDAD */}
                <div className={`border rounded-2xl p-5 shadow-xs transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#18181c] border-zinc-800'
                }`}>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-700/30">
                    <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                      <Smartphone className="w-4 h-4 text-[#FF5500]" />
                      Equipo & Desbloqueo
                    </span>
                    <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                      isLight ? 'bg-slate-100 text-slate-600' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {selectedOrder.device?.brand} • {selectedOrder.device?.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div>
                      <span className={`block text-[11px] mb-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Modelo Exacto</span>
                      <span className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {selectedOrder.device?.brand} {selectedOrder.device?.model}
                      </span>
                    </div>

                    <div>
                      <span className={`block text-[11px] mb-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>IMEI / Serial</span>
                      <div className={`flex items-center gap-2 font-mono font-medium mt-0.5 ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                        <span className="text-sm">{selectedOrder.device?.imei || 'No registrado'}</span>
                        {selectedOrder.device?.imei && (
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedOrder.device.imei, 'imei')}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-1 rounded hover:bg-zinc-700/30 cursor-pointer"
                            title="Copiar IMEI"
                          >
                            {copiedField === 'imei' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className={`block text-[11px] mb-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Color y Estética</span>
                      <span className={isLight ? 'text-slate-800' : 'text-zinc-300'}>
                        {selectedOrder.device?.color ? `Color: ${selectedOrder.device.color}` : 'Color estándar'}
                        {selectedOrder.device?.aestheticCondition && ` (${selectedOrder.device.aestheticCondition})`}
                      </span>
                    </div>

                    {/* CLAVE / SEGURIDAD */}
                    <div>
                      <span className={`block text-[11px] mb-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Seguridad de Pantalla</span>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedOrder.device?.security?.type === 'pattern' ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-bold">
                              Patrón 3x3
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowPatternModal(true)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                                isLight ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' : 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5 text-[#FF5500]" />
                              <span>Ver Dibujo</span>
                            </button>
                          </div>
                        ) : selectedOrder.device?.security?.type === 'none' ? (
                          <span className="text-zinc-500 italic text-xs">Sin clave</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {showPin 
                                ? (selectedOrder.device?.security?.pin || 'Sin PIN') 
                                : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowPin(!showPin)}
                              className={`p-1.5 rounded hover:bg-zinc-700/30 cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-zinc-400 hover:text-white'}`}
                              title={showPin ? "Ocultar PIN" : "Mostrar PIN"}
                            >
                              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            {selectedOrder.device?.security?.pin && (
                              <button
                                type="button"
                                onClick={() => handleCopy(selectedOrder.device.security.pin, 'pin')}
                                className={`p-1.5 rounded hover:bg-zinc-700/30 cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-zinc-400 hover:text-white'}`}
                                title="Copiar PIN"
                              >
                                {copiedField === 'pin' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: COBRO Y CHECKLIST */}
              <div className="space-y-5">
                {/* BLOQUE 3: PRESUPUESTO, SEÑA Y SALDO */}
                <div className={`border rounded-2xl p-5 shadow-xs transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#18181c] border-zinc-800'
                }`}>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-700/30">
                    <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      Presupuesto y Cobro
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Registrar Pago</span>
                    </button>
                  </div>

                  <div className={`grid grid-cols-3 gap-3 p-4 rounded-xl mb-4 text-center border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950 border-zinc-800/80'
                  }`}>
                    <div>
                      <span className={`text-[10px] sm:text-xs block uppercase font-bold ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Total Acordado</span>
                      <span className={`text-base sm:text-xl font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        ${Number(selectedOrder.service?.budgetTotal || 0).toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div className={`border-x ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
                      <span className={`text-[10px] sm:text-xs block uppercase font-bold ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Seña / Abonado</span>
                      <span className={`text-base sm:text-xl font-bold font-mono ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                        ${Number(selectedOrder.service?.deposit || 0).toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div>
                      <span className={`text-[10px] sm:text-xs block uppercase font-bold ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Saldo al Retirar</span>
                      <span className={`text-base sm:text-xl font-black font-mono ${
                        (selectedOrder.service?.balanceDue ?? 0) > 0 
                          ? (isLight ? 'text-amber-600' : 'text-amber-400')
                          : (isLight ? 'text-emerald-600' : 'text-emerald-400')
                      }`}>
                        ${Number(selectedOrder.service?.balanceDue || 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className={isLight ? 'text-slate-600' : 'text-zinc-400'}>
                      <strong className={isLight ? 'text-slate-900' : 'text-zinc-300'}>Trabajo solicitado:</strong> {selectedOrder.service?.requestedRepair || 'Diagnóstico general'}
                    </div>
                    {selectedOrder.service?.preliminaryDiagnosis && (
                      <div className={isLight ? 'text-slate-600' : 'text-zinc-400'}>
                        <strong className={isLight ? 'text-slate-900' : 'text-zinc-300'}>Diagnóstico inicial:</strong> {selectedOrder.service.preliminaryDiagnosis}
                      </div>
                    )}
                    <div className={isLight ? 'text-slate-600' : 'text-zinc-400'}>
                      <strong className={isLight ? 'text-slate-900' : 'text-zinc-300'}>Garantía acordada:</strong> {selectedOrder.service?.warranty || '90 días'}
                    </div>
                  </div>

                  {/* Pagos registrados */}
                  {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                    <div className={`mt-4 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-zinc-800/80'}`}>
                      <span className={`text-xs font-bold block mb-2 ${isLight ? 'text-slate-700' : 'text-zinc-400'}`}>Historial de Cobros:</span>
                      <div className="space-y-1.5">
                        {selectedOrder.payments.map((p, pi) => (
                          <div key={p.id || pi} className={`flex items-center justify-between text-xs py-1.5 px-3 rounded-lg border font-mono ${
                            isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900 border-zinc-800'
                          }`}>
                            <span className={isLight ? 'text-slate-600' : 'text-zinc-400'}>{new Date(p.timestamp).toLocaleDateString('es-AR')} - {p.method}:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">+${Number(p.amount).toLocaleString('es-AR')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* BLOQUE 4: CHECKLIST INICIAL DE INGRESO */}
                {selectedOrder.service?.checklist && (
                  <div className={`border rounded-2xl p-5 shadow-xs transition-colors ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#18181c] border-zinc-800'
                  }`}>
                    <span className={`text-xs font-bold uppercase tracking-wider block mb-3 pb-2 border-b border-zinc-700/30 ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                      Checklist al Ingresar
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
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
                          <div key={key} className={`flex items-center gap-2 p-2 rounded-xl border ${
                            isLight ? 'bg-slate-50 border-slate-200 text-slate-800 font-medium' : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                          }`}>
                            {ok ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            )}
                            <span className="truncate">{labels[key] || key}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PROCESADOR DE ESTADO TÉCNICO */}
          {activeTab === 'technician' && (
            <div className="space-y-5">
              <div className={`border rounded-2xl p-6 shadow-xs transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#18181c] border-zinc-800'
              }`}>
                <h4 className={`text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                  <Wrench className="w-5 h-5 text-[#FF5500]" />
                  Transición Técnica de Estado
                </h4>
                <p className={`text-xs sm:text-sm mb-4 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Seleccioná la acción técnica para cambiar el estado de la orden y notificar al cliente:
                </p>

                {/* BOTONES DE ESTADOS TÉCNICOS EN GRID AMPLIO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* 1. Declarar Reparado */}
                  <button
                    type="button"
                    onClick={() => setTargetStatus('ready')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      targetStatus === 'ready'
                        ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/40 text-emerald-950 dark:text-white font-bold shadow-md'
                        : isLight 
                          ? 'bg-slate-50 border-slate-200 hover:bg-emerald-50/60 text-slate-800 shadow-xs' 
                          : 'bg-zinc-900/80 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Declarar Reparado</div>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Listo para retirar en el local</div>
                    </div>
                  </button>

                  {/* 2. Espera de Autorización */}
                  <button
                    type="button"
                    onClick={() => setTargetStatus('waiting_auth')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      targetStatus === 'waiting_auth'
                        ? 'bg-purple-500/20 border-purple-500 ring-2 ring-purple-500/40 text-purple-950 dark:text-white font-bold shadow-md'
                        : isLight 
                          ? 'bg-slate-50 border-slate-200 hover:bg-purple-50/60 text-slate-800 shadow-xs' 
                          : 'bg-zinc-900/80 border-purple-500/30 hover:bg-purple-500/10 text-purple-300'
                    }`}
                  >
                    <HelpCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <div className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Espera de Autorización</div>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Presupuesto pendiente de aprobación</div>
                    </div>
                  </button>

                  {/* 3. Espera de Repuesto */}
                  <button
                    type="button"
                    onClick={() => setTargetStatus('waiting_part')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      targetStatus === 'waiting_part'
                        ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40 text-amber-950 dark:text-white font-bold shadow-md'
                        : isLight 
                          ? 'bg-slate-50 border-slate-200 hover:bg-amber-50/60 text-slate-800 shadow-xs' 
                          : 'bg-zinc-900/80 border-amber-500/30 hover:bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    <Package className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Espera de Repuesto</div>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Faltante de stock / pedido a proveedor</div>
                    </div>
                  </button>

                  {/* 4. En Mesa de Trabajo */}
                  <button
                    type="button"
                    onClick={() => setTargetStatus('in_progress')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      targetStatus === 'in_progress'
                        ? 'bg-sky-500/20 border-sky-500 ring-2 ring-sky-500/40 text-sky-950 dark:text-white font-bold shadow-md'
                        : isLight 
                          ? 'bg-slate-50 border-slate-200 hover:bg-sky-50/60 text-slate-800 shadow-xs' 
                          : 'bg-zinc-900/80 border-sky-500/30 hover:bg-sky-500/10 text-sky-300'
                    }`}
                  >
                    <Wrench className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      <div className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>En Mesa de Trabajo</div>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Técnico trabajando / en pruebas</div>
                    </div>
                  </button>

                  {/* 5. Sin Reparación */}
                  <button
                    type="button"
                    onClick={() => setTargetStatus('no_repair')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      targetStatus === 'no_repair'
                        ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/40 text-rose-950 dark:text-white font-bold shadow-md'
                        : isLight 
                          ? 'bg-slate-50 border-slate-200 hover:bg-rose-50/60 text-slate-800 shadow-xs' 
                          : 'bg-zinc-900/80 border-rose-500/30 hover:bg-rose-500/10 text-rose-300'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <div className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Sin Reparación</div>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Devolución sin costo / no viable</div>
                    </div>
                  </button>

                  {/* 6. Declarar Entregado */}
                  <button
                    type="button"
                    onClick={() => setTargetStatus('delivered')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      targetStatus === 'delivered'
                        ? 'bg-slate-300 dark:bg-zinc-700 border-slate-500 dark:border-zinc-400 ring-2 ring-slate-400 text-slate-900 dark:text-white font-bold shadow-md'
                        : isLight 
                          ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800 shadow-xs' 
                          : 'bg-zinc-900/80 border-zinc-700 hover:bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Shield className="w-5 h-5 text-slate-600 dark:text-zinc-300 shrink-0 mt-0.5" />
                    <div>
                      <div className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Declarar Entregado</div>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Cierre de orden / retiro en local</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* FORMULARIO DE CONFIRMACIÓN DE TRANSICIÓN */}
              {targetStatus && (
                <div className={`border rounded-2xl p-6 space-y-4 animate-fade-in shadow-xl ${
                  isLight ? 'bg-white border-slate-300' : 'bg-[#18181c] border-zinc-700'
                }`}>
                  <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
                    <span className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      <span>Confirmar cambio de estado a:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        isLight ? (STATUS_CONFIG[targetStatus]?.lightBadgeClass || 'bg-slate-100 text-slate-700') : STATUS_CONFIG[targetStatus]?.badgeClass
                      }`}>
                        {STATUS_CONFIG[targetStatus]?.label}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setTargetStatus(null)}
                      className={`text-xs font-semibold cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-zinc-500 hover:text-white'}`}
                    >
                      ✕ Cancelar
                    </button>
                  </div>

                  {/* Informe Técnico */}
                  <div>
                    <label className={`block text-xs sm:text-sm font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                      Informe Técnico (Qué se le hizo o qué se detectó):
                    </label>
                    <textarea
                      rows={3}
                      value={techReport}
                      onChange={(e) => setTechReport(e.target.value)}
                      placeholder="Ej: Se reemplazó módulo original, se calibró TrueTone, pruebas de carga y táctil superadas 100%..."
                      className={`w-full border rounded-xl p-3 text-xs sm:text-sm outline-none focus:border-[#FF5500] font-sans ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-500'
                      }`}
                    />
                  </div>

                  {/* Checklist de salida si es Reparado o Entregado */}
                  {(targetStatus === 'ready' || targetStatus === 'delivered') && (
                    <div className={`p-4 border rounded-xl ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/90 border-zinc-800'}`}>
                      <span className={`text-xs sm:text-sm font-bold block mb-2.5 ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                        Checklist de Control de Calidad de Salida:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                        {[
                          ['turnsOn', 'Enciende OK'],
                          ['touchOk', 'Táctil / Pantalla OK'],
                          ['camerasOk', 'Cámaras OK'],
                          ['chargingOk', 'Carga OK'],
                          ['audioOk', 'Audio OK']
                        ].map(([key, label]) => (
                          <label key={key} className={`flex items-center gap-2 cursor-pointer ${isLight ? 'text-slate-800 font-medium' : 'text-zinc-300'}`}>
                            <input
                              type="checkbox"
                              checked={exitChecklist[key]}
                              onChange={(e) => setExitChecklist({ ...exitChecklist, [key]: e.target.checked })}
                              className="w-4 h-4 rounded text-[#FF5500] border-slate-300 dark:border-zinc-700"
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nota interna opcional */}
                  <div>
                    <label className={`block text-xs sm:text-sm font-semibold mb-1 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                      Nota interna adicional (Solo visible para el equipo, opcional):
                    </label>
                    <input
                      type="text"
                      value={techInternalNote}
                      onChange={(e) => setTechInternalNote(e.target.value)}
                      placeholder="Ej: Repuesto SmartSupply JK colocado en orden..."
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-[#FF5500] ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-500'
                      }`}
                    />
                  </div>

                  {/* Notificación al Cliente */}
                  <div className={`pt-3 border-t flex flex-col gap-2.5 ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
                    <span className={`text-xs sm:text-sm font-bold ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                      Notificación Automática al Cliente:
                    </span>
                    
                    <div className="flex items-center gap-6 text-xs sm:text-sm">
                      <label className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={sendWhatsAppOnProcess}
                          onChange={(e) => setSendWhatsAppOnProcess(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-500 border-slate-300 dark:border-zinc-700"
                        />
                        <span>Enviar Notificación por WhatsApp</span>
                      </label>

                      <label className={`flex items-center gap-2 cursor-pointer ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                        <input
                          type="checkbox"
                          checked={sendEmailOnProcess}
                          onChange={(e) => setSendEmailOnProcess(e.target.checked)}
                          className="w-4 h-4 rounded text-[#FF5500] border-slate-300 dark:border-zinc-700"
                        />
                        <span>Enviar Email</span>
                      </label>
                    </div>
                  </div>

                  {/* Botón de Procesar */}
                  <button
                    type="button"
                    onClick={handleProcessOrder}
                    className="w-full py-3.5 bg-[#FF5500] hover:bg-[#FF6600] text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-[#FF5500]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Check className="w-5 h-5" />
                    <span>PROCESAR ORDEN Y APLICAR ESTADO</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MURO DE NOTAS INTERNAS */}
          {activeTab === 'notes' && (
            <div className="space-y-5">
              {/* Formulario de agregar nota */}
              <form onSubmit={handleAddNote} className={`border rounded-2xl p-5 shadow-xs transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#18181c] border-zinc-800'
              }`}>
                <label className={`block text-xs sm:text-sm font-bold uppercase tracking-wider mb-2.5 flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                  <MessageSquare className="w-4 h-4 text-[#FF5500]" />
                  Agregar Nota Interna de Taller
                </label>
                <div className="flex gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Escribí una observación para el equipo (ej: Cliente llamó para consultar estado)..."
                    className={`flex-1 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-[#FF5500] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="px-5 py-2.5 bg-[#FF5500] hover:bg-[#FF6600] text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-95"
                  >
                    Publicar
                  </button>
                </div>
              </form>

              {/* Listado de Notas */}
              <div className="space-y-3">
                {(!selectedOrder.internalNotesList || selectedOrder.internalNotesList.length === 0) ? (
                  <div className={`text-center p-8 text-xs sm:text-sm italic rounded-2xl border ${
                    isLight ? 'bg-white text-slate-500 border-slate-200' : 'bg-zinc-900/40 text-zinc-500 border-zinc-800/60'
                  }`}>
                    No hay notas internas registradas aún para esta orden.
                  </div>
                ) : (
                  selectedOrder.internalNotesList.map((note) => (
                    <div key={note.id} className={`p-4 border rounded-2xl space-y-1.5 shadow-xs transition-colors ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#18181c] border-zinc-800'
                    }`}>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>{note.author || 'Técnico Montec'}</span>
                        <span className={isLight ? 'text-slate-500' : 'text-zinc-500'}>{new Date(note.timestamp).toLocaleString('es-AR')}</span>
                      </div>
                      <p className={`text-xs sm:text-sm ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>{note.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AUDITORÍA Y REGISTRO DE EVENTOS */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className={`border rounded-2xl p-6 shadow-xs transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#18181c] border-zinc-800'
              }`}>
                <span className={`text-xs sm:text-sm font-bold uppercase tracking-wider block mb-4 flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                  <History className="w-4 h-4 text-[#FF5500]" />
                  Línea de Tiempo de Auditoría Técnica
                </span>

                <div className="space-y-3">
                  {selectedOrder.logs?.map((log, li) => (
                    <div key={li} className={`flex items-start gap-3 text-xs sm:text-sm py-2.5 border-b last:border-none ${
                      isLight ? 'border-slate-100' : 'border-zinc-800/60'
                    }`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500] mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className={`font-medium ${isLight ? 'text-slate-900' : 'text-zinc-200'}`}>{log.action}</p>
                        <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
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

        {/* PIE DE PÁGINA CON BOTÓN DE REGRESO Y ACCIONES */}
        <div className={`p-4 border rounded-2xl flex items-center justify-between gap-3 flex-wrap shadow-xs transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#18181c] border-zinc-800'
        }`}>
          <button
            type="button"
            onClick={() => setSelectedOrder(null)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer border ${
              isLight 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-[#FF5500]" />
            <span>Volver a la lista de órdenes</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setTicketModalOrder(selectedOrder)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Reimprimir Ticket</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/30"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Cobrar Saldo</span>
            </button>

            {selectedOrder.customer?.phone && (
              <a
                href={generateStatusWhatsAppUrl(selectedOrder, selectedOrder.status, '')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPatternModal = () => {
    if (!showPatternModal || !selectedOrder) return null;

    return createPortal(
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in font-sans">
        <div className={`border rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161619] border-zinc-800 text-white'
        }`}>
          <button
            type="button"
            onClick={() => setShowPatternModal(false)}
            className={`absolute top-4 right-4 p-1 rounded-lg cursor-pointer transition-colors ${
              isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          <h4 className={`text-base font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Patrón de Desbloqueo 3x3
          </h4>
          <p className={`text-xs mb-4 font-mono ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
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
            className={`mt-4 w-full py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200' : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            Cerrar Vista de Patrón
          </button>
        </div>
      </div>,
      document.body
    );
  };

  const renderPaymentModal = () => {
    if (!isPaymentModalOpen || !selectedOrder) return null;

    return createPortal(
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in font-sans">
        <div className={`border rounded-2xl p-6 max-w-md w-full shadow-2xl relative ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161619] border-zinc-800 text-white'
        }`}>
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(false)}
            className={`absolute top-4 right-4 p-1 rounded-lg cursor-pointer transition-colors ${
              isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          <h4 className={`text-base font-bold mb-1 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Registrar Cobro / Abono
          </h4>
          <p className={`text-xs mb-4 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
            Orden {selectedOrder.orderNumber} • Saldo pendiente: <strong className={isLight ? 'text-amber-600 font-bold' : 'text-amber-400'}>${Number(selectedOrder.service?.balanceDue || 0).toLocaleString('es-AR')}</strong>
          </p>

          <form onSubmit={handleRecordPaymentSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>Monto a Cobrar ($):</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-zinc-400">$</span>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Monto..."
                  autoFocus
                  className={`w-full border rounded-xl pl-8 pr-3 py-2 font-mono font-bold text-sm outline-none focus:border-emerald-500 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-950 border-zinc-700 text-white'
                  }`}
                />
              </div>
              {Number(selectedOrder.service?.balanceDue) > 0 && (
                <button
                  type="button"
                  onClick={() => setPaymentAmount(String(selectedOrder.service?.balanceDue || 0))}
                  className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Cobrar saldo total pendiente (${Number(selectedOrder.service.balanceDue).toLocaleString('es-AR')})
                </button>
              )}
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>Método de Pago:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 outline-none focus:border-emerald-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-950 border-zinc-700 text-white'
                }`}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Mercado Pago">Mercado Pago / QR</option>
                <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
              </select>
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>Observación o Comprobante (opcional):</label>
              <input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Ej: Cobro en mostrador / Seña de módulo"
                className={`w-full border rounded-xl px-3 py-2 outline-none focus:border-slate-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-950 border-zinc-700 text-white'
                }`}
              />
            </div>

            <div className={`flex items-center justify-end gap-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className={`px-3 py-1.5 cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-zinc-400 hover:text-white'}`}
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
      </div>,
      document.body
    );
  };

  if (isEmbedded) {
    return (
      <div className="space-y-6 font-sans">
        {selectedOrder ? (
          renderOrderDetailView()
        ) : (
          <>
            {/* 1. ENCABEZADO DE SECCIÓN NATIVO DE ADMIN */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className={`text-xl sm:text-2xl font-heading font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Gestión Integral de Órdenes de Taller
                  </h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${
                    isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}>
                    {filteredOrders.length} {filteredOrders.length === 1 ? 'orden' : 'órdenes'}
                  </span>
                  {clientHistoryFilter && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FF5500]/20 text-[#FF5500] font-bold border border-[#FF5500]/40 flex items-center gap-1.5">
                      <span>Cliente: {clientHistoryFilter}</span>
                      <button onClick={() => setClientHistoryFilter(null)} className="hover:text-white cursor-pointer">✕</button>
                    </span>
                  )}
                </div>
                <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Flujo operativo, transiciones técnicas y avisos automáticos por WhatsApp
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onNewOrder && (
                  <button
                    type="button"
                    onClick={onNewOrder}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(255,85,0,0.35)] transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nueva Orden</span>
                  </button>
                )}
              </div>
            </div>

            {mainToolbarAndTable}
          </>
        )}

        {/* MODALES AUXILIARES */}
        {renderPatternModal()}
        {renderPaymentModal()}
        {ticketModalOrder && (
          <OrderTicketModal
            order={ticketModalOrder}
            onClose={() => setTicketModalOrder(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-fade-in font-sans">
      
      {/* CONTENEDOR PRINCIPAL CUANDO ES MODAL */}
      <div className={`border rounded-2xl sm:rounded-3xl max-w-7xl w-full h-[92vh] shadow-2xl flex flex-col overflow-hidden relative transition-colors ${
        isLight ? 'montec-panel-light bg-white border-slate-200' : 'bg-[#121214] border-zinc-800 text-zinc-200'
      }`}>

        {/* 1. BARRA SUPERIOR DE GESTIÓN (MODAL STANDALONE) */}
        <header className="panel-top-header border-b px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 gap-3 bg-[#09090b] border-zinc-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 flex items-center justify-center font-bold shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-heading font-black flex items-center gap-2 leading-tight text-white">
                <span>Gestión Integral de Taller</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border bg-zinc-800 text-zinc-300 border-zinc-700">
                  {filteredOrders.length} {filteredOrders.length === 1 ? 'orden' : 'órdenes'}
                </span>
                {clientHistoryFilter && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF5500]/20 text-[#FF5500] font-bold border border-[#FF5500]/40 flex items-center gap-1">
                    <span>Filtro cliente: {clientHistoryFilter}</span>
                    <button onClick={() => setClientHistoryFilter(null)} className="hover:text-white cursor-pointer">✕</button>
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Flujo operativo, transiciones técnicas y avisos automáticos por WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Minimalista de Tema Claro / Oscuro */}
            <button
              type="button"
              onClick={togglePanelTheme}
              className="p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700"
              title={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            >
              {isLight ? (
                <>
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="hidden sm:inline">Oscuro</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Claro</span>
                </>
              )}
            </button>

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

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl border transition-colors cursor-pointer text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 border-zinc-700 shadow-xs"
                title="Cerrar panel de órdenes"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* CONTENIDO INTERNO CUANDO ES MODAL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {selectedOrder ? renderOrderDetailView() : mainToolbarAndTable}
        </div>
      </div>

      {/* MODALES AUXILIARES */}
      {renderPatternModal()}
      {renderPaymentModal()}
      {ticketModalOrder && (
        <OrderTicketModal
          order={ticketModalOrder}
          onClose={() => setTicketModalOrder(null)}
        />
      )}

    </div>
  );
}
