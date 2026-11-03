import React, { useState, useMemo } from 'react';
import { 
  X, 
  Check, 
  Smartphone, 
  User, 
  Phone, 
  DollarSign, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Printer, 
  MessageSquare, 
  CreditCard, 
  Banknote, 
  QrCode, 
  ArrowRight, 
  ShieldCheck, 
  ShoppingBag, 
  Package, 
  Copy,
  AlertCircle,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  FileText,
  Lock
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import CommercialInvoicePOS from '../pos/CommercialInvoicePOS';
import OfficialFiscalInvoice from '../pos/OfficialFiscalInvoice';
import PartCostFinderModal from './PartCostFinderModal';

// ─── COMPONENTE TOAST ────────────────────────────────────────────────────
function Toast({ message, type = 'info', onClose }) {
  const colors = {
    success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
    error: 'bg-rose-950/90 border-rose-500/50 text-rose-200',
    warning: 'bg-amber-950/90 border-amber-500/50 text-amber-200',
    info: 'bg-sky-950/90 border-sky-500/50 text-sky-200'
  };
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    info: <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
  };

  return (
    <div className={`fixed top-6 right-6 z-[100] px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 animate-fadeIn max-w-md ${colors[type]}`}>
      {icons[type]}
      <span className="text-xs font-medium leading-tight">{message}</span>
      {onClose && (
        <button onClick={onClose} className="p-0.5 rounded hover:bg-white/10 transition-colors ml-2 shrink-0 cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default function UnifiedDeliveryModal({ order, isOpen, onClose, onDelivered }) {
  const { inventory, recordUnifiedDelivery, businessConfig, updateOrderPartCost, markOrderAsInvoiced } = useData();

  if (!isOpen || !order) return null;

  // ─── ESTADOS LOCALES & METADATA CONTABLE ───────────────────────
  const repairBudgetTotal = Number(
    order.service?.budgetTotal ?? order.budgetTotal ?? order.total ?? order.presupuesto ?? order.price ?? 0
  );
  const depositPaid = Number(
    order.service?.deposit ?? order.deposit ?? order.sena ?? order.adelanto ?? 0
  );
  // El saldo pendiente real SIEMPRE es la diferencia matemática entre presupuesto y seña:
  const saldoRealReparacion = Math.max(0, repairBudgetTotal - depositPaid);
  const rawBalanceDue = saldoRealReparacion;

  const isOrderAlreadyInvoiced = Boolean(order.isFacturada || order.service?.isFacturada);
  const existingFacturaNumero = order.facturaNumero || order.service?.facturaNumero || '';

  // Costo de repuesto & Buscador en proveedores
  const [partCost, setPartCost] = useState(order.partCost !== undefined ? Number(order.partCost) : 0);
  const [partSupplier, setPartSupplier] = useState(order.partSupplier || '');
  const [partName, setPartName] = useState(order.partName || '');
  const [isPartCostModalOpen, setIsPartCostModalOpen] = useState(false);

  // Resolución técnica al entregar: 'ready' (Reparado OK) o 'no_repair' (Sin Reparar / Devolución)
  const isInitiallyResolved = order.status === 'ready' || order.status === 'repaired' || order.status === 'no_repair';
  const initialResolution = order.status === 'no_repair' ? 'no_repair' : (order.status === 'ready' || order.status === 'repaired' ? 'ready' : null);
  const [deliveryResolution, setDeliveryResolution] = useState(initialResolution);
  const [waiveRepairBalance, setWaiveRepairBalance] = useState(order.status === 'no_repair');

  const [addedAccessories, setAddedAccessories] = useState([]);
  const [accessorySearch, setAccessorySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'transfer', 'card', 'qr'
  const [cashGiven, setCashGiven] = useState('');
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' | 'percent'
  const [discountValue, setDiscountValue] = useState(0);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isCopiedAlias, setIsCopiedAlias] = useState(false);

  // ─── ESTADOS DE FLUJO BLINDADO & FACTURACIÓN ──────────────────
  const [completedSale, setCompletedSale] = useState(null);       // Datos del cobro finalizado
  const [showInvoiceModal, setShowInvoiceModal] = useState(false); // Modal de facturación abierto
  const [showFiscalInvoiceModal, setShowFiscalInvoiceModal] = useState(false); // Factura normalizada ARCA
  const [invoiceCompleted, setInvoiceCompleted] = useState(false); // Factura emitida
  const [showZeroCostConfirm, setShowZeroCostConfirm] = useState(false); // Confirmación $0
  const [showBypassInvoiceConfirm, setShowBypassInvoiceConfirm] = useState(false); // Confirmación de entrega sin factura fiscal
  const [deliveryPayloadPending, setDeliveryPayloadPending] = useState(null); // Payload pendiente de confirmación
  
  // ─── TOAST NOTIFICATIONS ─────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info', duration = 4000) => {
    setToast({ message, type });
    if (duration > 0) {
      setTimeout(() => setToast(null), duration);
    }
  };

  // Categorías de accesorios
  const categories = ['Todos', 'Hidrogel & Templados', 'Fundas & Cases', 'Cargadores & Fuentes', 'Cables & Adaptadores', 'Audio & Auriculares'];

  // Filtrado de accesorios disponibles en stock
  const filteredInventory = useMemo(() => {
    return (inventory || []).filter(item => {
      const matchCat = selectedCategory === 'Todos' || item.category === selectedCategory;
      const matchSearch = !accessorySearch.trim() || 
        item.name.toLowerCase().includes(accessorySearch.toLowerCase()) ||
        (item.compatible && item.compatible.toLowerCase().includes(accessorySearch.toLowerCase())) ||
        (item.sku && item.sku.toLowerCase().includes(accessorySearch.toLowerCase()));
      return matchCat && matchSearch && (item.stock > 0);
    });
  }, [inventory, selectedCategory, accessorySearch]);

  // Agregar accesorio
  const handleAddAccessory = (product) => {
    setAddedAccessories(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        if (exists.quantity >= product.stock) {
          showToast(`No hay más stock disponible de ${product.name} (Stock: ${product.stock})`, 'warning');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Modificar cantidad
  const handleUpdateQuantity = (productId, delta) => {
    setAddedAccessories(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.stock) {
            showToast(`Stock máximo alcanzado (${item.stock})`, 'warning');
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Eliminar accesorio agregado
  const handleRemoveAccessory = (productId) => {
    setAddedAccessories(prev => prev.filter(item => item.id !== productId));
  };

  // ─── CÁLCULOS FINANCIEROS ─────────────────────────────────────
  const effectiveBalanceDue = waiveRepairBalance ? 0 : saldoRealReparacion;
  const accessoriesSubtotal = addedAccessories.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const grossTotal = effectiveBalanceDue + accessoriesSubtotal;

  const discountAmount = discountType === 'percent'
    ? Math.round((grossTotal * (Number(discountValue) || 0)) / 100)
    : Math.min(Number(discountValue) || 0, grossTotal);

  const grandTotal = Math.max(0, grossTotal - discountAmount);

  // Diagnóstico financiero claro de la orden según casos reales:
  // CASO A: TIENE SALDO PENDIENTE (total > 0 y saldoRealReparacion > 0)
  const hasPendingBalance = !waiveRepairBalance && saldoRealReparacion > 0;
  // CASO B: REALMENTE 100% PAGADA PREVIAMENTE (total > 0 y senaPrevia >= totalReparacion)
  const isPrepaidFull = repairBudgetTotal > 0 && depositPaid >= repairBudgetTotal;
  // CASO C: REPARACIÓN EN GARANTÍA O PRESUPUESTO $0
  const isRealZeroCost = repairBudgetTotal === 0 && accessoriesSubtotal === 0;

  // Vuelto en efectivo
  const cashNum = parseFloat(cashGiven) || 0;
  const changeDue = paymentMethod === 'cash' && cashNum > grandTotal ? cashNum - grandTotal : 0;

  // ─── MAPEO DE MÉTODO DE PAGO INTERNO → LABEL POS ─────────────
  const paymentMethodToLabel = {
    cash: 'Efectivo',
    transfer: 'Transferencia / Alias',
    card: 'Tarjeta Débito/Crédito',
    qr: 'Mercado Pago QR'
  };

  // ─── REGLA 1: ¿El botón de finalizar debe estar bloqueado? ───
  // El operador debe haber seleccionado resolución Y si hay saldo > 0, debe completar el pago
  const isPaymentInsufficient = grandTotal > 0 && paymentMethod === 'cash' && cashNum > 0 && cashNum < grandTotal;
  
  // ─── CONSTRUIR PAYLOAD DE ENTREGA ─────────────────────────────
  const buildDeliveryPayload = () => ({
    orderId: order.id,
    orderNumber: order.orderNumber,
    clientName: order.client?.name || order.customer?.name || 'Cliente',
    clientPhone: order.client?.phone || order.customer?.phone || '',
    clientDni: order.client?.dni || order.client?.docNumber || order.customer?.docNumber || order.customer?.dni || '',
    clientCuit: order.client?.cuit || order.customer?.cuit || '',
    deviceModel: `${order.device?.brand || ''} ${order.device?.model || ''}`.trim(),
    repairName: order.service?.requestedRepair || 'Reparación de Taller',
    repairBudgetTotal,
    depositPaid,
    balancePaid: effectiveBalanceDue,
    repairResolution: deliveryResolution, // 'ready' | 'no_repair'
    isRepaired: deliveryResolution === 'ready',
    isFacturada: isOrderAlreadyInvoiced,
    facturaNumero: existingFacturaNumero,
    partCost: parseFloat(partCost) || 0,
    partSupplier: partSupplier || '',
    partName: partName || '',
    accessories: addedAccessories.map(a => ({
      id: a.id,
      name: a.name,
      price: a.price,
      quantity: a.quantity,
      sku: a.sku
    })),
    accessoriesTotal: accessoriesSubtotal,
    discount: discountAmount,
    totalAmount: grandTotal,
    paymentMethod,
    cashGiven: paymentMethod === 'cash' ? cashNum : null,
    changeDue: paymentMethod === 'cash' ? changeDue : null,
    notes: deliveryNotes,
    deliveredAt: new Date().toISOString()
  });

  // ─── HANDLER PARA ENTREGA $0 REAL (GARANTÍA / SIN COSTO) ─────
  const handleConfirmZeroCostDelivery = () => {
    setShowZeroCostConfirm(false);
    
    const payload = deliveryPayloadPending || buildDeliveryPayload();
    
    // Registrar en DataContext directamente (sin facturación fiscal requerida)
    if (recordUnifiedDelivery) {
      recordUnifiedDelivery({
        ...payload,
        isFacturada: false,
        alreadyRecordedInSales: false
      });
    }

    setCompletedSale(payload);
    setInvoiceCompleted(true);
    showToast('Equipo entregado sin cargo (Garantía / Revisión sin costo).', 'success');

    if (onDelivered) {
      onDelivered(order.id, payload);
    }
  };

  // ─── HANDLER PARA ENTREGA SIN FACTURA FISCAL (EXCEPCIÓN) ──────
  const handleDeliverWithoutInvoice = () => {
    setShowBypassInvoiceConfirm(false);
    const basePayload = deliveryPayloadPending || buildDeliveryPayload();
    const payload = {
      ...basePayload,
      isFacturada: false,
      alreadyRecordedInSales: false
    };

    if (recordUnifiedDelivery) {
      recordUnifiedDelivery(payload);
    }

    setCompletedSale(payload);
    setInvoiceCompleted(true);
    showToast('Equipo entregado sin emitir factura fiscal. Movimiento asentado en caja.', 'info', 5000);

    if (onDelivered) {
      onDelivered(order.id, payload);
    }
  };

  // ─── HANDLER PARA ABRIR FACTURACIÓN AUTOMÁTICA ───────────────
  const handleOpenInvoiceModal = (payload) => {
    setDeliveryPayloadPending(payload || buildDeliveryPayload());
    setShowInvoiceModal(true);
    showToast('Abriendo ventana de Facturación Fiscal por el total del servicio...', 'info');
  };

  // ─── HANDLER DE CIERRE DE FACTURACIÓN ─────────────────────────
  const handleInvoiceClose = () => {
    if (!invoiceCompleted) {
      showToast('⚠️ La factura no fue emitida. La entrega continúa pendiente.', 'warning', 5000);
    }
    setShowInvoiceModal(false);
  };

  // ─── HANDLER POST-EMISIÓN DE FACTURA ──────────────────────────
  const handleInvoiceCompleted = (emittedSale) => {
    setInvoiceCompleted(true);
    setShowInvoiceModal(false);
    
    const invoiceNum = emittedSale?.documentNumber || emittedSale?.ticketNumber || 'FAC-' + Date.now();
    const basePayload = deliveryPayloadPending || buildDeliveryPayload();
    const payload = {
      ...basePayload,
      isFacturada: true,
      facturaNumero: invoiceNum,
      alreadyRecordedInSales: true
    };
    
    if (markOrderAsInvoiced) {
      markOrderAsInvoiced(order.id, invoiceNum);
    }

    if (recordUnifiedDelivery) {
      recordUnifiedDelivery(payload);
    }

    setCompletedSale(payload);
    showToast(`✅ Factura ${invoiceNum} emitida y cobro registrado. Orden entregada correctamente.`, 'success', 5000);

    if (onDelivered) {
      onDelivered(order.id, payload);
    }
  };

  // ─── FLUJO PRINCIPAL: FINALIZAR ENTREGA Y COBRO ───────────────
  const handleFinalize = () => {
    if (!deliveryResolution) {
      showToast('Por favor selecciona si el equipo se entrega "Reparado OK" o "Sin Reparación".', 'error');
      return;
    }

    // Bloqueo estricto por saldo pendiente / efectivo insuficiente
    if (isPaymentInsufficient) {
      showToast(`No se puede completar la entrega hasta que se procese el pago del saldo pendiente ($${grandTotal.toLocaleString('es-AR')}). Monto ingresado ($${cashNum.toLocaleString('es-AR')}) es insuficiente.`, 'error', 6000);
      return;
    }

    const payload = buildDeliveryPayload();

    // Caso 1: Reparación y entrega realmente sin costo ($0)
    if (isRealZeroCost) {
      setDeliveryPayloadPending(payload);
      setShowZeroCostConfirm(true);
      return;
    }

    // Caso 2: Orden ya facturada previamente
    if (isOrderAlreadyInvoiced) {
      if (recordUnifiedDelivery) {
        recordUnifiedDelivery({
          ...payload,
          isFacturada: true,
          facturaNumero: existingFacturaNumero,
          alreadyRecordedInSales: grandTotal === 0
        });
      }
      setCompletedSale(payload);
      setInvoiceCompleted(true);
      showToast('✅ Entrega finalizada con éxito. Orden previamente facturada.', 'success');
      if (onDelivered) {
        onDelivered(order.id, payload);
      }
      return;
    }

    // Caso 3: Orden con costo que aún no fue facturada
    handleOpenInvoiceModal(payload);
  };

  // Enviar ticket por WhatsApp
  const handleSendWhatsAppTicket = () => {
    if (!completedSale) return;
    const phone = (completedSale.clientPhone || '').replace(/\D/g, '');
    if (!phone) {
      showToast('Esta orden no tiene número de teléfono registrado', 'warning');
      return;
    }

    const formattedPhone = phone.startsWith('549') ? phone : (phone.startsWith('54') ? '549' + phone.slice(2) : '549' + phone);

    const paymentLabel = {
      cash: 'Efectivo',
      transfer: 'Transferencia Bancaria / Alias',
      card: 'Tarjeta Débito / Crédito',
      qr: 'Mercado Pago QR'
    }[completedSale.paymentMethod] || 'Efectivo';

    let msg = `*COMPROBANTE DE ENTREGA Y PAGO - ${businessConfig?.business?.fantasyName || 'MONTEC TECH LAB'}* 🛡️\n`;
    msg += `📍 ${businessConfig?.business?.address || 'Montes Carballo 943'}, ${businessConfig?.business?.city || 'Mar del Plata'}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📄 *Orden:* ${completedSale.orderNumber}\n`;
    msg += `👤 *Cliente:* ${completedSale.clientName}\n`;
    msg += `📱 *Equipo:* ${completedSale.deviceModel}\n`;
    msg += `🔧 *Servicio:* ${completedSale.repairName}\n`;
    msg += `💰 *Saldo Reparación:* $${completedSale.balancePaid.toLocaleString('es-AR')}\n`;

    if (completedSale.accessories && completedSale.accessories.length > 0) {
      msg += `\n🛍️ *Accesorios adicionales:*\n`;
      completedSale.accessories.forEach(a => {
        msg += `• ${a.quantity}x ${a.name} ($${(a.price * a.quantity).toLocaleString('es-AR')})\n`;
      });
    }

    if (completedSale.discount > 0) {
      msg += `🏷️ *Descuento aplicado:* -$${completedSale.discount.toLocaleString('es-AR')}\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*TOTAL ABONADO:* $${completedSale.totalAmount.toLocaleString('es-AR')}\n`;
    msg += `💳 *Medio de Pago:* ${paymentLabel}\n`;
    msg += `🛡️ *Garantía oficial:* 90 días en mano de obra y repuesto colocado.\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_¡Muchas gracias por confiar en montec!_\n`;
    msg += `🌐 https://montec.ar`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Copiar alias
  const handleCopyAlias = () => {
    navigator.clipboard.writeText('montec.mdp');
    setIsCopiedAlias(true);
    setTimeout(() => setIsCopiedAlias(false), 2500);
  };

  // ─── DATOS PARA PRECARGAR EN CommercialInvoicePOS ────────────
  const buildInvoiceInitialData = () => {
    const payload = deliveryPayloadPending || buildDeliveryPayload();
    const items = [];

    // Ítem de servicio de reparación por el TOTAL DEL SERVICIO (no solo el saldo restante)
    // REGLA FISCAL: La factura fiscal debe emitirse por el TOTAL de la reparación al momento de la entrega.
    const serviceAmountToBill = deliveryResolution === 'no_repair' && waiveRepairBalance ? 0 : repairBudgetTotal;

    if (serviceAmountToBill > 0) {
      items.push({
        id: `rep-${order.id || Date.now()}`,
        sku: `REP-${(order.orderNumber || '').replace(/[^0-9]/g, '') || '0000'}`,
        name: `Reparación: ${payload.repairName || 'Servicio Técnico'} (${payload.deviceModel || 'Equipo'}) - Orden ${payload.orderNumber}`,
        color: '-',
        quantity: 1,
        price: serviceAmountToBill, // MONTO TOTAL DE LA REPARACIÓN
        ivaPercent: 21,
        discountPercent: 0
      });
    }

    // Ítems de accesorios adicionales si los hubiera
    if (payload.accessories && payload.accessories.length > 0) {
      payload.accessories.forEach(a => {
        items.push({
          id: a.id,
          sku: a.sku || `ACC-${a.id}`,
          name: a.name,
          color: '-',
          quantity: a.quantity,
          price: a.price,
          ivaPercent: 21,
          discountPercent: 0
        });
      });
    }

    return {
      client: {
        name: (payload.clientName || 'CONSUMIDOR FINAL').toUpperCase(),
        docType: order.client?.docType || order.customer?.docType || 'DNI',
        docNumber: payload.clientDni || payload.clientCuit || '',
        taxCondition: order.client?.taxCondition || order.customer?.taxCondition || 'CONSUMIDOR FINAL',
        email: order.client?.email || order.customer?.email || '',
        phone: payload.clientPhone || '',
        address: order.client?.address || order.customer?.address || ''
      },
      items,
      paymentMethod: paymentMethodToLabel[payload.paymentMethod] || 'Efectivo',
      notes: `Entrega de reparación - Orden ${payload.orderNumber}.${depositPaid > 0 ? ` Seña previa imputada: $${depositPaid.toLocaleString('es-AR')}.` : ''} ${payload.notes || ''}`.trim(),
      documentType: 'FACTURA_B',
      // Imputamos la seña previa para que el POS calcule el saldo real a cobrar hoy en mostrador
      advancePayment: depositPaid,
      orderRef: payload.orderNumber
    };
  };

  // Voucher estructurado para Factura Oficial ARCA (AFIP)
  const buildVoucherFromCompletedSale = () => {
    const init = buildInvoiceInitialData();
    const totalAmount = init.items.reduce((s, it) => s + (it.price * (it.quantity || 1)), 0);
    return {
      ...init,
      customer: init.client,
      subtotal: totalAmount,
      total: totalAmount,
      documentNumber: completedSale?.facturaNumero || `00001-${(order.orderNumber || '').replace(/[^0-9]/g, '').padStart(8, '0')}`,
      createdAt: completedSale?.deliveredAt || new Date().toISOString(),
      orderRef: order.orderNumber,
      deviceModel: `${order.device?.brand || ''} ${order.device?.model || ''}`.trim(),
      deviceImei: order.device?.imei || '',
      seller: 'Laboratorio Montec'
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121212] border border-zinc-800 rounded-2xl w-full max-w-6xl h-[94vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* TOAST NOTIFICATIONS */}
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}

        {/* HEADER COMPACTO */}
        <div className="px-4 py-2 sm:py-2.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500] shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-heading font-bold text-white">
                  Entrega de Equipo & Cobro Unificado
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#FF5500]/20 text-[#FF5500] text-xs font-mono font-bold border border-[#FF5500]/30">
                  {order.orderNumber}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Cobro de saldo de taller con venta cruzada de accesorios en un solo comprobante
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* MODAL DE CONFIRMACIÓN DE ENTREGA SIN COSTO ($0)              */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {showZeroCostConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#1a1a22] border-2 border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-fadeIn">
              {/* Icono de advertencia */}
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-lg font-heading font-bold text-white">
                  ¿Entregar esta orden sin costo?
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  El valor de la reparación figura en <span className="font-bold text-amber-400">$0</span>. 
                  Confirme si se trata de una garantía, revisión sin reparación o presupuesto sin cargo.
                </p>
              </div>

              {/* Datos de la orden */}
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Orden:</span>
                  <span className="font-mono font-bold text-white">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Cliente:</span>
                  <span className="text-white">{order.client?.name || 'Cliente'}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Equipo:</span>
                  <span className="text-white">{order.device?.brand} {order.device?.model}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Resolución:</span>
                  <span className={deliveryResolution === 'ready' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {deliveryResolution === 'ready' ? '🟢 Reparado OK' : '🔴 Sin Reparar'}
                  </span>
                </div>
              </div>

              {/* Botones */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowZeroCostConfirm(false);
                    setDeliveryPayloadPending(null);
                    showToast('Volvé a la pantalla de cobro para cargar el costo de la reparación.', 'info');
                  }}
                  className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all border border-zinc-700 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>Cancelar / Volver y cargar costo</span>
                </button>
                <button
                  onClick={handleConfirmZeroCostDelivery}
                  className="px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Sí, entregar sin costo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* MODAL DE CONFIRMACIÓN DE ENTREGA SIN FACTURAR               */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {showBypassInvoiceConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#1a1a22] border-2 border-zinc-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-zinc-300" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-lg font-heading font-bold text-white">
                  ¿Entregar sin factura fiscal?
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Esta orden de <strong className="text-emerald-400 font-bold">${repairBudgetTotal.toLocaleString('es-AR')}</strong> se marcará como entregada en el taller y se asentará el cobro en la caja interna, pero <span className="text-amber-400 font-semibold">no se emitirá comprobante AFIP/fiscal</span> en este momento.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBypassInvoiceConfirm(false)}
                  className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all border border-zinc-700 cursor-pointer"
                >
                  Cancelar / Volver
                </button>
                <button
                  type="button"
                  onClick={handleDeliverWithoutInvoice}
                  className="px-4 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Sí, entregar sin factura</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* MODAL DE FACTURACIÓN AUTOMÁTICA (CommercialInvoicePOS)        */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {showInvoiceModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="bg-[#0f0f14] border border-zinc-700 rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
              {/* Header del modal de facturación */}
              <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between bg-[#121218] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Facturación Obligatoria – Orden {order.orderNumber}
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30 animate-pulse">
                        PASO OBLIGATORIO
                      </span>
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Emita el comprobante fiscal o comercial antes de finalizar la entrega. Los datos de la reparación ya están precargados.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleInvoiceCompleted}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Factura Emitida – Finalizar</span>
                  </button>
                  <button
                    onClick={handleInvoiceClose}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Cerrar sin emitir (la entrega quedará pendiente)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {/* CommercialInvoicePOS precargado */}
              <div className="flex-1 overflow-y-auto">
                <CommercialInvoicePOS
                  isModal={true}
                  initialData={buildInvoiceInitialData()}
                  onOpenDailyCash={() => {}}
                  onClose={handleInvoiceClose}
                  onEmitSuccess={handleInvoiceCompleted}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* MODAL DE COMPROBANTE FINAL (SI YA SE FINALIZÓ)               */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {completedSale ? (
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-3">
              <Check className="w-6 h-6 shrink-0 text-emerald-400" />
              <div>
                <h4 className="font-bold text-base text-white">¡Entrega, Cobro y Facturación Registrados!</h4>
                <p className="text-xs text-emerald-200/80">
                  La orden {completedSale.orderNumber} pasó a "Entregado". El saldo de reparación (${completedSale.balancePaid.toLocaleString('es-AR')}) quedó asentado en Caja Diaria y en el libro de Ventas comerciales con comprobante asignado.
                </p>
              </div>
            </div>

            {/* Ticket Térmico en Pantalla */}
            <div className="bg-white text-zinc-900 rounded-2xl p-6 font-mono text-xs shadow-2xl max-w-md mx-auto border border-zinc-300">
              <div className="text-center pb-4 border-b border-dashed border-zinc-300 space-y-1">
                <div className="font-bold text-base tracking-widest uppercase">{businessConfig?.business?.fantasyName || 'MONTEC'} REPAIR & ACCESSORIES</div>
                <div className="text-[11px] text-zinc-600">{businessConfig?.business?.legalName || 'Servicio Técnico Especializado Apple & Multimarca'}</div>
                <div className="text-[11px] text-zinc-600">{businessConfig?.business?.address || 'Montes Carballo 943'} • {businessConfig?.business?.city || 'Mar del Plata'}</div>
                <div className="text-[11px] text-zinc-500">{new Date(completedSale.deliveredAt).toLocaleString('es-AR')}</div>
              </div>

              <div className="py-3 border-b border-dashed border-zinc-300 space-y-1 text-[11px]">
                <div><span className="font-bold">ORDEN:</span> {completedSale.orderNumber}</div>
                <div><span className="font-bold">CLIENTE:</span> {completedSale.clientName}</div>
                <div><span className="font-bold">EQUIPO:</span> {completedSale.deviceModel}</div>
                <div><span className="font-bold">TRABAJO:</span> {completedSale.repairName}</div>
                <div><span className="font-bold">PAGO:</span> {completedSale.paymentMethod.toUpperCase()}</div>
              </div>

              <div className="py-3 border-b border-dashed border-zinc-300 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span>CONCEPTO</span>
                  <span>SUBTOTAL</span>
                </div>
                <div className="flex justify-between text-zinc-700">
                  <span>Saldo Reparación Taller</span>
                  <span>${completedSale.balancePaid.toLocaleString('es-AR')}</span>
                </div>
                {completedSale.accessories?.map((acc, i) => (
                  <div key={i} className="flex justify-between text-zinc-700">
                    <span>{acc.quantity}x {acc.name}</span>
                    <span>${(acc.price * acc.quantity).toLocaleString('es-AR')}</span>
                  </div>
                ))}
                {completedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Descuento aplicado</span>
                    <span>-${completedSale.discount.toLocaleString('es-AR')}</span>
                  </div>
                )}
              </div>

              <div className="py-4 text-center border-b border-dashed border-zinc-300">
                <div className="text-xs text-zinc-500 uppercase">TOTAL COBRADO</div>
                <div className="text-2xl font-bold font-heading text-zinc-950">
                  ${completedSale.totalAmount.toLocaleString('es-AR')}
                </div>
                {completedSale.paymentMethod === 'cash' && completedSale.cashGiven > 0 && (
                  <div className="text-[11px] text-zinc-600 mt-1">
                    Abonó con: ${completedSale.cashGiven.toLocaleString('es-AR')} | Vuelto: ${completedSale.changeDue.toLocaleString('es-AR')}
                  </div>
                )}
              </div>

              <div className="pt-4 text-center text-[10px] text-zinc-500 space-y-1">
                <div>Garantía escrita de 90 días en mano de obra y repuesto.</div>
                <div>Conserve este comprobante. ¡Muchas gracias!</div>
              </div>
            </div>

            {/* Acciones del Comprobante */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFiscalInvoiceModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>Factura Oficial ARCA (A4)</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-semibold transition-all border border-zinc-700 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-orange-400" />
                <span>Imprimir Ticket 80mm</span>
              </button>

              <button
                type="button"
                onClick={handleSendWhatsAppTicket}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs sm:text-sm font-bold transition-all shadow-[0_0_15px_rgba(255,85,0,0.4)] cursor-pointer"
              >
                <span>Finalizar</span>
              </button>
            </div>
          </div>
        ) : (
          /* PANTALLA PRINCIPAL DE CONFIGURACIÓN DE COBRO */
          <div className="flex-1 overflow-hidden p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
            
            {/* COLUMNA IZQUIERDA: RESUMEN DE LA ORDEN & VENTA CRUZADA (7 COLS) */}
            <div className="lg:col-span-7 flex flex-col justify-between overflow-hidden gap-2 min-h-0">
              
              {/* Tarjeta de Datos del Equipo, Saldos y Resolución */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 sm:p-3 space-y-2 shrink-0">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-[11px] font-mono font-bold text-[#FF5500]">DATOS DE LA REPARACIÓN</span>
                  <span className="text-xs text-zinc-300 font-medium">{order.client?.name || order.customer?.name || 'Cliente'}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Equipo:</span>
                    <span className="font-semibold text-white truncate block">{order.device?.brand} {order.device?.model}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Teléfono:</span>
                    <span className="font-semibold text-white truncate block">{order.client?.phone || order.customer?.phone || 'Sin registrar'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Falla / Servicio:</span>
                    <span className="text-zinc-300 truncate block" title={order.service?.requestedRepair || 'Servicio Técnico'}>
                      {order.service?.requestedRepair || 'Servicio Técnico'}
                    </span>
                  </div>
                </div>

                {/* RESUMEN ECONÓMICO TRANSPARENTE: PRESUPUESTO, SEÑA Y SALDO */}
                <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs">
                  <div>
                    <span className="text-[10px] block text-zinc-400 uppercase font-semibold">Presupuesto</span>
                    <span className="font-mono font-bold text-white">${repairBudgetTotal.toLocaleString('es-AR')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block text-zinc-400 uppercase font-semibold">Seña Previa</span>
                    <span className="font-mono font-bold text-emerald-400">${depositPaid.toLocaleString('es-AR')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block text-zinc-400 uppercase font-semibold">Saldo al Retirar</span>
                    <span className={`font-mono font-bold ${effectiveBalanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      ${effectiveBalanceDue.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                {/* BADGE DESTACADO: SI ESTÁ 100% PAGADA PREVIAMENTE (CASO B) */}
                {isPrepaidFull && (
                  <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white block text-xs">✅ Reparación 100% Pagada</span>
                        <span className="text-[10px] text-emerald-200/90">
                          Seña previa de ${depositPaid.toLocaleString('es-AR')} cubre el total. Saldo hoy: $0
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] border border-emerald-500/30">
                      SALDO $0
                    </span>
                  </div>
                )}

                {/* BADGE DESTACADO: CASO C (GARANTÍA / $0 REAL) */}
                {isRealZeroCost && (
                  <div className="p-2 rounded-lg bg-blue-500/15 border border-blue-500/40 text-blue-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-xs font-semibold text-white">Garantía técnica / Revisión sin costo ($0)</span>
                  </div>
                )}

                {/* ESTADO DE FACTURACIÓN FISCAL */}
                {isOrderAlreadyInvoiced ? (
                  <div className="py-1 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-medium text-zinc-300">Comprobante Fiscal:</span>
                      <strong className="text-white font-mono">🧾 Facturada ({existingFacturaNumero || 'OK'})</strong>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                      Facturada
                    </span>
                  </div>
                ) : repairBudgetTotal > 0 ? (
                  <div className="py-1.5 px-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate text-xs">⚠️ Reparación de <strong>${repairBudgetTotal.toLocaleString('es-AR')}</strong> aún no fue facturada.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenInvoiceModal(buildDeliveryPayload())}
                      className="bg-[#FF5500] hover:bg-[#FF6600] active:scale-95 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] shadow-sm shrink-0 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Receipt className="w-3 h-3" />
                      <span>Facturar al entregar</span>
                    </button>
                  </div>
                ) : null}

                {/* SELECTOR OBLIGATORIO DE RESOLUCIÓN */}
                <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>¿Cómo se entrega el equipo?</span>
                      <span className="text-rose-400 text-[10px]">* Requerido</span>
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      {deliveryResolution === 'ready' && <span className="text-emerald-400 font-semibold">🟢 Reparado OK</span>}
                      {deliveryResolution === 'no_repair' && <span className="text-amber-400 font-semibold">🔴 Sin Reparar</span>}
                      {!deliveryResolution && <span className="text-rose-400 animate-pulse font-medium">Requerido para entregar</span>}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryResolution('ready');
                        setWaiveRepairBalance(false);
                      }}
                      className={`py-1.5 px-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                        deliveryResolution === 'ready'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${deliveryResolution === 'ready' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                        <span>🟢 Reparado OK</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">Aplica garantía</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryResolution('no_repair');
                        setWaiveRepairBalance(true);
                      }}
                      className={`py-1.5 px-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                        deliveryResolution === 'no_repair'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <AlertTriangle className={`w-3.5 h-3.5 ${deliveryResolution === 'no_repair' ? 'text-amber-400' : 'text-zinc-500'}`} />
                        <span>🔴 Sin Reparar</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">Devolución</span>
                    </button>
                  </div>

                  {deliveryResolution === 'no_repair' && (
                    <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-xs animate-fadeIn">
                      <div className="flex items-center gap-1.5 text-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-[11px]">Equipo sin reparación:</span>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none text-zinc-300 hover:text-white">
                        <input
                          type="checkbox"
                          checked={waiveRepairBalance}
                          onChange={(e) => setWaiveRepairBalance(e.target.checked)}
                          className="rounded border-zinc-700 text-[#FF5500] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-[11px]">Bonificar saldo reparación ($0)</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* COSTO DEL REPUESTO & UTILIDAD EN LA ENTREGA (Compact Row) */}
                {(() => {
                  const costNum = parseFloat(partCost) || 0;
                  const netProfit = repairBudgetTotal - costNum;
                  const marginPercent = repairBudgetTotal > 0 ? ((netProfit / repairBudgetTotal) * 100).toFixed(0) : 0;

                  return (
                    <div className={`p-2 rounded-lg border transition-all text-xs ${
                      costNum === 0 
                        ? 'bg-amber-500/10 border-amber-500/30' 
                        : 'bg-zinc-950/70 border-zinc-800'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 whitespace-nowrap">
                            🔩 Repuesto:
                          </span>
                          {costNum === 0 ? (
                            <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                              Sin costo ($0)
                            </span>
                          ) : (
                            partSupplier && (
                              <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[100px]">
                                ({partSupplier})
                              </span>
                            )
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="relative w-20">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold">$</span>
                            <input
                              type="number"
                              value={partCost}
                              onChange={(e) => setPartCost(e.target.value)}
                              placeholder="0"
                              className="w-full pl-5 pr-1.5 py-0.5 text-xs bg-zinc-900 border border-zinc-700 rounded text-white font-mono focus:border-[#FF5500] outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsPartCostModalOpen(true)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-[#FF5500] hover:bg-[#FF6600] rounded transition-all cursor-pointer shadow-xs shrink-0"
                          >
                            <Search className="w-3 h-3" />
                            <span>Proveedores</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2 pl-2 border-l border-zinc-800 text-right shrink-0">
                          <div>
                            <span className="text-[9px] block text-zinc-400 uppercase font-semibold">Utilidad</span>
                            <span className={`text-xs font-mono font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              ${netProfit.toLocaleString('es-AR')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] block text-zinc-400 uppercase font-semibold">Margen</span>
                            <span className={`text-xs font-mono font-bold ${marginPercent >= 50 ? 'text-emerald-400' : marginPercent > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {marginPercent}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* SECCIÓN VENTA CRUZADA DE ACCESORIOS (SCROLL INTERNO ACOTADO) */}
              <div className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between overflow-hidden gap-1.5 min-h-0">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#FF5500]" />
                    <h4 className="text-xs font-heading font-bold text-white">
                      Venta Cruzada de Accesorios
                    </h4>
                  </div>
                  <span className="text-[10px] text-zinc-400">Sumar fundas, vidrios, cargadores...</span>
                </div>

                {/* Buscador & Categorías */}
                <div className="space-y-1 shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={accessorySearch}
                      onChange={(e) => setAccessorySearch(e.target.value)}
                      placeholder="Buscar accesorio..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FF5500]"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition-colors cursor-pointer ${
                          selectedCategory === cat 
                            ? 'bg-[#FF5500] text-white font-semibold' 
                            : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de Accesorios Rápidos (Scroll acotado) */}
                <div className="grid grid-cols-2 gap-1.5 max-h-24 sm:max-h-28 overflow-y-auto p-0.5 shrink-0">
                  {filteredInventory.slice(0, 6).map(prod => (
                    <div
                      key={prod.id}
                      onClick={() => handleAddAccessory(prod)}
                      className="p-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-[#FF5500]/50 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-1.5">
                        <div className="text-[11px] font-semibold text-white truncate group-hover:text-[#FF5500] transition-colors">
                          {prod.name}
                        </div>
                        <div className="text-[9px] text-zinc-400">
                          Stock: {prod.stock} • ${prod.price?.toLocaleString('es-AR')}
                        </div>
                      </div>
                      <button 
                        type="button"
                        className="p-0.5 rounded bg-[#FF5500]/10 text-[#FF5500] group-hover:bg-[#FF5500] group-hover:text-white transition-all shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Accesorios Ya Agregados (Scroll acotado) */}
                {addedAccessories.length > 0 && (
                  <div className="pt-1 border-t border-zinc-800 space-y-1 overflow-y-auto max-h-20 shrink-0">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase font-semibold block">
                      Agregados ({addedAccessories.length}):
                    </span>
                    <div className="space-y-1">
                      {addedAccessories.map(item => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-1 text-xs"
                        >
                          <div className="min-w-0 flex-1 pr-1.5">
                            <span className="font-semibold text-white block truncate text-[11px]">{item.name}</span>
                            <span className="text-[9px] text-zinc-400 font-mono">
                              ${item.price.toLocaleString('es-AR')} c/u
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5">
                              <button 
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                className="p-0.5 text-zinc-400 hover:text-white"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="font-mono text-xs px-1 text-white font-bold">{item.quantity}</span>
                              <button 
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                className="p-0.5 text-zinc-400 hover:text-white"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            <span className="font-mono font-bold text-white text-xs w-16 text-right">
                              ${(item.price * item.quantity).toLocaleString('es-AR')}
                            </span>

                            <button 
                              onClick={() => handleRemoveAccessory(item.id)}
                              className="p-0.5 text-zinc-500 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA: TOTALES, MEDIOS DE PAGO Y COBRO (5 COLS) */}
            <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between overflow-hidden gap-2 min-h-0">
              
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-mono uppercase font-bold text-zinc-400 border-b border-zinc-800 pb-1.5 flex items-center justify-between">
                  <span>Resumen de Cobro</span>
                  <span className="text-[10px] text-zinc-500 font-sans">Mostrador</span>
                </h4>

                {/* Desglose */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-zinc-300">
                    <span>Saldo Reparación Taller:</span>
                    <span className="font-mono font-semibold">${effectiveBalanceDue.toLocaleString('es-AR')}</span>
                  </div>

                  {accessoriesSubtotal > 0 && (
                    <div className="flex justify-between text-purple-300">
                      <span>Accesorios adicionales:</span>
                      <span className="font-mono font-semibold">+${accessoriesSubtotal.toLocaleString('es-AR')}</span>
                    </div>
                  )}

                  {/* Descuento Opcional */}
                  <div className="pt-1 border-t border-zinc-900 flex items-center justify-between gap-2">
                    <span className="text-zinc-400 text-[11px]">Descuento:</span>
                    <div className="flex items-center gap-1">
                      <select 
                        value={discountType} 
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-white"
                      >
                        <option value="fixed">$</option>
                        <option value="percent">%</option>
                      </select>
                      <input 
                        type="number"
                        min="0"
                        value={discountValue || ''}
                        onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-16 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-white font-mono text-right"
                      />
                    </div>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-rose-400 text-xs">
                      <span>Monto descontado:</span>
                      <span className="font-mono font-bold">-${discountAmount.toLocaleString('es-AR')}</span>
                    </div>
                  )}
                </div>

                {/* TOTAL GENERAL DESTACADO */}
                <div className={`py-2.5 px-3 rounded-xl border-2 text-center space-y-0.5 transition-all ${
                  isPrepaidFull && accessoriesSubtotal === 0
                    ? 'bg-gradient-to-br from-emerald-950/60 to-black border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    : 'bg-gradient-to-br from-zinc-900 to-black border-[#FF5500]/60 shadow-[0_0_20px_rgba(255,85,0,0.2)]'
                }`}>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                    TOTAL A COBRAR EN MOSTRADOR
                  </span>
                  <div className={`text-2xl sm:text-3xl font-heading font-extrabold ${
                    isPrepaidFull && accessoriesSubtotal === 0 ? 'text-emerald-400' : 'text-[#FF5500]'
                  }`}>
                    ${grandTotal.toLocaleString('es-AR')}
                  </div>
                  {isPrepaidFull && accessoriesSubtotal === 0 ? (
                    <div className="flex items-center justify-center gap-1 text-emerald-400 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Reparación 100% abonada previamente. Saldo: $0</span>
                    </div>
                  ) : grandTotal > 0 ? (
                    <div className="flex items-center justify-center gap-1 text-[10px] text-amber-300 font-medium">
                      <Lock className="w-2.5 h-2.5 text-amber-400" />
                      <span>Saldo pendiente a cobrar al cliente</span>
                    </div>
                  ) : (
                    <div className="text-zinc-400 text-[10px]">
                      <span>Orden sin cargo ($0)</span>
                    </div>
                  )}
                </div>

                {/* Medio de Pago */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-300 block">Medio de Pago:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'cash'
                          ? 'bg-[#FF5500]/20 border-[#FF5500] text-white shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Efectivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'transfer'
                          ? 'bg-[#FF5500]/20 border-[#FF5500] text-white shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                      <span>Transferencia</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'bg-[#FF5500]/20 border-[#FF5500] text-white shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                      <span>Tarjeta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qr')}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'qr'
                          ? 'bg-[#FF5500]/20 border-[#FF5500] text-white shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>MP QR</span>
                    </button>
                  </div>
                </div>

                {/* Opciones Específicas por Medio de Pago */}
                {paymentMethod === 'cash' && (
                  <div className="p-2 bg-zinc-900/90 rounded-lg border border-zinc-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400 text-[11px]">Paga con $:</span>
                      <input
                        type="number"
                        value={cashGiven}
                        onChange={(e) => setCashGiven(e.target.value)}
                        placeholder={grandTotal.toString()}
                        className="w-28 bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-white font-mono text-right outline-none focus:border-[#FF5500] text-xs"
                      />
                    </div>
                    {changeDue > 0 && (
                      <div className="flex items-center justify-between text-emerald-400 font-bold pt-1 border-t border-zinc-800 text-xs">
                        <span>Vuelto:</span>
                        <span className="font-mono">${changeDue.toLocaleString('es-AR')}</span>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'transfer' && (
                  <div className="p-2 bg-zinc-900/90 rounded-lg border border-zinc-800 text-xs space-y-1">
                    <div className="text-zinc-400 text-[10px]">Alias Oficial Montec:</div>
                    <div className="flex items-center justify-between bg-zinc-950 p-1.5 rounded border border-zinc-700">
                      <span className="font-mono font-bold text-white text-xs">montec.mdp</span>
                      <button
                        type="button"
                        onClick={handleCopyAlias}
                        className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-orange-400 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        {isCopiedAlias ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                        <span>{isCopiedAlias ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Notas opcionales */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 block">Notas de entrega (opcional):</label>
                  <textarea
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Detalles de garantía o entrega..."
                    rows={1}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FF5500] resize-none"
                  />
                </div>

              </div>

              {/* ALERTA PAGO INSUFICIENTE */}
              {isPaymentInsufficient && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>
                    El saldo pendiente es ${grandTotal.toLocaleString('es-AR')} (recibido: ${cashNum.toLocaleString('es-AR')}).
                  </span>
                </div>
              )}

              {/* BOTONES DE ACCIÓN PARA ENTREGA Y FACTURACIÓN */}
              <div className="pt-1">
                {!deliveryResolution ? (
                  <div className="py-2.5 px-3 rounded-xl bg-zinc-800/80 text-zinc-400 text-xs font-bold text-center border border-zinc-700 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4 text-zinc-500" />
                    <span>SELECCIONA RESOLUCIÓN (REPARADO O SIN REPARAR)</span>
                  </div>
                ) : isRealZeroCost ? (
                  /* Caso 1: Garantía o revisión verdaderamente sin costo */
                  <button
                    type="button"
                    onClick={handleFinalize}
                    className="w-full py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm bg-amber-600 hover:bg-amber-500 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>ENTREGAR SIN COSTO (REVISIÓN / GARANTÍA $0)</span>
                  </button>
                ) : !isOrderAlreadyInvoiced && repairBudgetTotal > 0 ? (
                  /* Caso 2: Orden con costo que aún NO fue facturada fiscalmente */
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenInvoiceModal(buildDeliveryPayload())}
                      disabled={isPaymentInsufficient}
                      className={`w-full py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 ${
                        !isPaymentInsufficient
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-950/40'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      }`}
                    >
                      <Receipt className="w-4 h-4" />
                      <span>🧾 FACTURAR Y ENTREGAR (${(repairBudgetTotal + accessoriesSubtotal).toLocaleString('es-AR')})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBypassInvoiceConfirm(true)}
                      disabled={isPaymentInsufficient}
                      className="w-full py-1.5 rounded-lg text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <FileText className="w-3 h-3 text-zinc-500" />
                      <span>Entregar sin facturar (Excepción)</span>
                    </button>
                  </div>
                ) : (
                  /* Caso 3: Orden ya facturada previamente */
                  <button
                    type="button"
                    onClick={handleFinalize}
                    disabled={isPaymentInsufficient}
                    className={`w-full py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                      !isPaymentInsufficient
                        ? 'bg-[#FF5500] hover:bg-[#FF6600] text-white shadow-[0_0_20px_rgba(255,85,0,0.4)]'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                    }`}
                  >
                    {grandTotal > 0 ? (
                      <>
                        <Receipt className="w-4 h-4" />
                        <span>COBRAR SALDO (${grandTotal.toLocaleString('es-AR')}) Y FINALIZAR ENTREGA</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>FINALIZAR ENTREGA (FACTURADO Y PAGADO)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>

          </div>
        )}

        {/* MODAL DE BÚSQUEDA DE REPUESTO EN PROVEEDORES */}
        {isPartCostModalOpen && (
          <PartCostFinderModal
            isOpen={isPartCostModalOpen}
            onClose={() => setIsPartCostModalOpen(false)}
            order={order}
            currentCost={partCost}
            currentSupplier={partSupplier}
            currentPartName={partName}
            customerPrice={Number(order.service?.budgetTotal || 0)}
            onSelectPart={(selectedData) => {
              setPartCost(selectedData.costPrice);
              setPartSupplier(selectedData.supplierName);
              setPartName(selectedData.partName);
              if (order?.id && updateOrderPartCost) {
                updateOrderPartCost(order.id, {
                  partCost: selectedData.costPrice,
                  partSupplier: selectedData.supplierName,
                  partName: selectedData.partName
                });
              }
              setIsPartCostModalOpen(false);
            }}
          />
        )}

        {/* MODAL DE FACTURA OFICIAL ARCA (AFIP) */}
        {showFiscalInvoiceModal && completedSale && (
          <OfficialFiscalInvoice
            voucher={buildVoucherFromCompletedSale()}
            businessConfig={businessConfig}
            onClose={() => setShowFiscalInvoiceModal(false)}
          />
        )}

      </div>
    </div>
  );
}
