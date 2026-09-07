import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Printer, 
  MessageSquare, 
  Smartphone, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  ArrowUpDown,
  Plus,
  Trash2,
  Calendar,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';

const STATUS_CONFIG = {
  received: { label: 'Recibido (En cola)', bg: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  waiting_part: { label: 'Esperando Repuesto', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  in_progress: { label: 'En Mesa de Trabajo', bg: 'bg-orange-500/20 text-[#FF5500] border-[#FF5500]/40' },
  ready: { label: 'Listo para Retirar', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  delivered: { label: 'Entregado', bg: 'bg-zinc-900 text-zinc-500 border-zinc-800 line-through' }
};

export default function OrdersListModal({ onSelectOrder, onNewOrder, onClose }) {
  const { orders, updateRepairOrderStatus, deleteRepairOrder } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filtrado reactivo de órdenes
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
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

        return num.includes(q) || 
               clientName.includes(q) || 
               clientDoc.includes(q) || 
               clientPhone.includes(q) || 
               deviceModel.includes(q) || 
               issue.includes(q);
      }

      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  const handleStatusChange = (orderId, newStatus) => {
    updateRepairOrderStatus(orderId, newStatus);
  };

  const handleDelete = (orderId, orderNum) => {
    if (window.confirm(`¿Estás seguro de eliminar la orden ${orderNum}? Esta acción no se puede deshacer.`)) {
      deleteRepairOrder(orderId);
    }
  };

  const generateWhatsAppNotification = (order) => {
    const isReady = order.status === 'ready';
    const balanceDue = order.service?.balanceDue || 0;
    const balanceStr = balanceDue > 0 ? `$${balanceDue.toLocaleString('es-AR')}` : '$0 (Abonado)';

    let text = '';
    if (isReady) {
      text = 
        `¡Hola ${order.customer?.name || 'Cliente'}! 🎉 Te avisamos de *montec* que tu equipo *${order.device?.brand} ${order.device?.model}* (Orden *${order.orderNumber}*) está *LISTO PARA RETIRAR*.%0A%0A` +
        `⚖️ *Saldo a abonar:* ${balanceStr}%0A` +
        `📍 *Dirección:* Montes Carballo 943, Mar del Plata%0A` +
        `⏱️ *Horarios:* Lun a Sáb 9:30 a 19:30 hs%0A%0A` +
        `¡Te esperamos!`;
    } else {
      text = 
        `¡Hola ${order.customer?.name || 'Cliente'}! Te contactamos de *montec* respecto a tu orden de reparación *${order.orderNumber}* (${order.device?.brand} ${order.device?.model}).`;
    }

    const cleanPhone = (order.customer?.phone || '').replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`;
    return `https://wa.me/${finalPhone}?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-fade-in">
      <div className="bg-[#141416] border border-zinc-800 rounded-2xl max-w-5xl w-full h-[88vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-zinc-900/90 border-b border-zinc-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base font-heading font-black text-white flex items-center gap-2">
              <span>📋 Órdenes de Reparación en Taller</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF5500]/20 text-[#FF5500] font-mono font-bold">
                {filteredOrders.length}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNewOrder}
              className="px-3.5 py-1.5 bg-[#FF5500] hover:bg-[#FF6600] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Orden</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="p-4 bg-zinc-900/40 border-b border-zinc-800/80 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nº de orden (#MON-XXXX), cliente, DNI, teléfono o modelo..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FF5500]"
            />
          </div>

          {/* Chips de filtro por estado */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#FF5500] text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Todos ({orders.length})
            </button>

            {Object.entries(STATUS_CONFIG).map(([stKey, stCfg]) => {
              const count = orders.filter(o => o.status === stKey).length;
              return (
                <button
                  key={stKey}
                  onClick={() => setStatusFilter(stKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    statusFilter === stKey
                      ? 'bg-zinc-800 text-white border-zinc-600'
                      : `${stCfg.bg} hover:opacity-80`
                  }`}
                >
                  {stCfg.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Órdenes (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-800">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs">
              No se encontraron órdenes con el criterio especificado.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.received;
              const balanceDue = order.service?.balanceDue || 0;

              return (
                <div
                  key={order.id}
                  className="bg-[#18181B] border border-zinc-800/90 hover:border-zinc-700 rounded-xl p-3.5 transition-all shadow-sm space-y-2"
                >
                  {/* Fila 1: Nº Orden, Fecha, Cliente y Estado */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-black text-sm text-[#FF5500]">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(order.createdAt).toLocaleDateString('es-AR')}
                      </span>
                      <span className="text-xs font-bold text-white">
                        • {order.customer?.name}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        ({order.customer?.phone})
                      </span>
                    </div>

                    {/* Selector de Estado Rápido */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${st.bg}`}
                      >
                        <option value="received">Recibido (En cola)</option>
                        <option value="waiting_part">Esperando Repuesto</option>
                        <option value="in_progress">En Mesa de Trabajo</option>
                        <option value="ready">Listo para Retirar</option>
                        <option value="delivered">Entregado</option>
                      </select>
                    </div>
                  </div>

                  {/* Fila 2: Equipo, Falla y Saldos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs pt-1 border-t border-zinc-850">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Equipo:</span>
                      <span className="font-bold text-zinc-200">
                        {order.device?.brand} {order.device?.model}
                      </span>
                      {order.device?.imei && (
                        <span className="text-[10px] text-zinc-500 font-mono block">
                          IMEI: {order.device.imei}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-500 block">Reparación Solicitada:</span>
                      <span className="text-zinc-300 font-medium line-clamp-1">
                        {order.service?.requestedRepair}
                      </span>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 text-right">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Saldo a Cobrar:</span>
                        <span className={`font-mono font-bold ${balanceDue > 0 ? 'text-[#FF5500]' : 'text-emerald-400'}`}>
                          ${balanceDue.toLocaleString('es-AR')}
                        </span>
                      </div>

                      {/* Botones de acción rápida */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onSelectOrder(order)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Ver / Imprimir Ticket"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#FF5500]" />
                        </button>

                        <a
                          href={generateWhatsAppNotification(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-zinc-800 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors cursor-pointer"
                          title="Contactar / Avisar por WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => handleDelete(order.id, order.orderNumber)}
                          className="p-1.5 bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar orden"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
