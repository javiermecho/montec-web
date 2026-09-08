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
  AlertCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function UnifiedDeliveryModal({ order, isOpen, onClose, onDelivered }) {
  const { inventory, recordUnifiedDelivery } = useData();

  if (!isOpen || !order) return null;

  // Estados locales
  const balanceDue = Number(order.service?.balanceDue || 0);
  const [addedAccessories, setAddedAccessories] = useState([]);
  const [accessorySearch, setAccessorySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'transfer', 'card', 'qr'
  const [cashGiven, setCashGiven] = useState('');
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' | 'percent'
  const [discountValue, setDiscountValue] = useState(0);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isCopiedAlias, setIsCopiedAlias] = useState(false);

  // Estado de comprobante generado post-cobro
  const [completedSale, setCompletedSale] = useState(null);

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
          alert(`No hay más stock disponible de ${product.name} (Stock: ${product.stock})`);
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
            alert(`Stock máximo alcanzado (${item.stock})`);
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

  // Cálculos financieros
  const accessoriesSubtotal = addedAccessories.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const grossTotal = balanceDue + accessoriesSubtotal;

  const discountAmount = discountType === 'percent'
    ? Math.round((grossTotal * (Number(discountValue) || 0)) / 100)
    : Math.min(Number(discountValue) || 0, grossTotal);

  const grandTotal = Math.max(0, grossTotal - discountAmount);

  // Vuelto en efectivo
  const cashNum = parseFloat(cashGiven) || 0;
  const changeDue = paymentMethod === 'cash' && cashNum > grandTotal ? cashNum - grandTotal : 0;

  // Finalizar entrega y cobro
  const handleFinalize = () => {
    if (paymentMethod === 'cash' && cashNum < grandTotal && grossTotal > 0) {
      if (!confirm(`El monto recibido ($${cashNum.toLocaleString('es-AR')}) es menor al Total a Cobrar ($${grandTotal.toLocaleString('es-AR')}). ¿Deseas continuar igual?`)) {
        return;
      }
    }

    const deliveryPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientName: order.client?.name || 'Cliente',
      clientPhone: order.client?.phone || '',
      deviceModel: `${order.device?.brand || ''} ${order.device?.model || ''}`.trim(),
      repairName: order.service?.requestedRepair || 'Reparación de Taller',
      balancePaid: balanceDue,
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
    };

    // Registrar en DataContext
    if (recordUnifiedDelivery) {
      recordUnifiedDelivery(deliveryPayload);
    }

    setCompletedSale(deliveryPayload);
    if (onDelivered) {
      onDelivered(order.id, deliveryPayload);
    }
  };

  // Enviar ticket por WhatsApp
  const handleSendWhatsAppTicket = () => {
    if (!completedSale) return;
    const phone = (completedSale.clientPhone || '').replace(/\D/g, '');
    if (!phone) {
      alert('Esta orden no tiene número de teléfono registrado');
      return;
    }

    const formattedPhone = phone.startsWith('549') ? phone : (phone.startsWith('54') ? '549' + phone.slice(2) : '549' + phone);

    const paymentLabel = {
      cash: 'Efectivo',
      transfer: 'Transferencia Bancaria / Alias',
      card: 'Tarjeta Débito / Crédito',
      qr: 'Mercado Pago QR'
    }[completedSale.paymentMethod] || 'Efectivo';

    let msg = `*COMPROBANTE DE ENTREGA Y PAGO - MONTEC TECH LAB* 🛡️\n`;
    msg += `📍 Montes Carballo 943, Mar del Plata\n`;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121212] border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-heading font-bold text-white">
                  Entrega de Equipo & Cobro Unificado
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#FF5500]/20 text-[#FF5500] text-xs font-mono font-bold border border-[#FF5500]/30">
                  {order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Cobro de saldo de taller con venta cruzada de accesorios en un solo comprobante
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL DE COMPROBANTE FINAL (SI YA SE FINALIZÓ) */}
        {completedSale ? (
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-3">
              <Check className="w-6 h-6 shrink-0 text-emerald-400" />
              <div>
                <h4 className="font-bold text-base text-white">¡Entrega y Cobro Registrados Exitosamente!</h4>
                <p className="text-xs text-emerald-200/80">
                  El estado de la orden {completedSale.orderNumber} cambió a "Entregado" y se descontó el stock de los accesorios.
                </p>
              </div>
            </div>

            {/* Ticket Térmico en Pantalla */}
            <div className="bg-white text-zinc-900 rounded-2xl p-6 font-mono text-xs shadow-2xl max-w-md mx-auto border border-zinc-300">
              <div className="text-center pb-4 border-b border-dashed border-zinc-300 space-y-1">
                <div className="font-bold text-base tracking-widest uppercase">MONTEC REPAIR & ACCESSORIES</div>
                <div className="text-[11px] text-zinc-600">Servicio Técnico Especializado Apple & Multimarca</div>
                <div className="text-[11px] text-zinc-600">Montes Carballo 943 • Mar del Plata</div>
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
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-semibold transition-all border border-zinc-700 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-orange-400" />
                <span>Imprimir Ticket</span>
              </button>

              <button
                onClick={handleSendWhatsAppTicket}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar Comprobante por WhatsApp</span>
              </button>

              <button
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs sm:text-sm font-bold transition-all shadow-[0_0_15px_rgba(255,85,0,0.4)] cursor-pointer"
              >
                <span>Finalizar</span>
              </button>
            </div>
          </div>
        ) : (
          /* PANTALLA PRINCIPAL DE CONFIGURACIÓN DE COBRO */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* COLUMNA IZQUIERDA: RESUMEN DE LA ORDEN & VENTA CRUZADA (7 COLS) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Tarjeta de Datos del Equipo */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-xs font-mono font-bold text-[#FF5500]">DATOS DE LA REPARACIÓN</span>
                  <span className="text-xs text-zinc-400">{order.client?.name || 'Cliente'}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Equipo:</span>
                    <span className="font-semibold text-white">{order.device?.brand} {order.device?.model}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Teléfono:</span>
                    <span className="font-semibold text-white">{order.client?.phone || 'Sin registrar'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500 block">Trabajo Realizado:</span>
                    <span className="text-zinc-200">{order.service?.requestedRepair || 'Servicio Técnico'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300">Saldo Pendiente de Taller:</span>
                  <span className="text-base font-mono font-bold text-orange-400">
                    ${balanceDue.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Sección Venta Cruzada de Accesorios */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#FF5500]" />
                    <h4 className="text-sm font-heading font-bold text-white">
                      Venta Cruzada de Accesorios
                    </h4>
                  </div>
                  <span className="text-xs text-zinc-400">Funda, vidrio templado, cable, etc.</span>
                </div>

                {/* Buscador & Categorías */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={accessorySearch}
                      onChange={(e) => setAccessorySearch(e.target.value)}
                      placeholder="Buscar accesorio para agregar..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FF5500]"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
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

                {/* Lista de Accesorios Rápidos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {filteredInventory.slice(0, 8).map(prod => (
                    <div
                      key={prod.id}
                      onClick={() => handleAddAccessory(prod)}
                      className="p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-[#FF5500]/50 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold text-white truncate group-hover:text-[#FF5500] transition-colors">
                          {prod.name}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          Stock: {prod.stock} • ${prod.price?.toLocaleString('es-AR')}
                        </div>
                      </div>
                      <button 
                        type="button"
                        className="p-1 rounded-lg bg-[#FF5500]/10 text-[#FF5500] group-hover:bg-[#FF5500] group-hover:text-white transition-all shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Accesorios Ya Agregados al Cobro */}
                {addedAccessories.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
                      Accesorios Agregados a la Entrega ({addedAccessories.length})
                    </span>
                    <div className="space-y-1.5">
                      {addedAccessories.map(item => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="font-semibold text-white block truncate">{item.name}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              ${item.price.toLocaleString('es-AR')} c/u
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-lg px-1 py-0.5">
                              <button 
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                className="p-0.5 text-zinc-400 hover:text-white"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono text-xs px-1 text-white font-bold">{item.quantity}</span>
                              <button 
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                className="p-0.5 text-zinc-400 hover:text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="font-mono font-bold text-white w-20 text-right">
                              ${(item.price * item.quantity).toLocaleString('es-AR')}
                            </span>

                            <button 
                              onClick={() => handleRemoveAccessory(item.id)}
                              className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
            <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-5">
              
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase font-bold text-zinc-400 border-b border-zinc-800 pb-2">
                  Resumen de Cobro de Mostrador
                </h4>

                {/* Desglose */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-300">
                    <span>Saldo Reparación Taller:</span>
                    <span className="font-mono font-semibold">${balanceDue.toLocaleString('es-AR')}</span>
                  </div>

                  {accessoriesSubtotal > 0 && (
                    <div className="flex justify-between text-purple-300">
                      <span>Accesorios adicionales:</span>
                      <span className="font-mono font-semibold">+${accessoriesSubtotal.toLocaleString('es-AR')}</span>
                    </div>
                  )}

                  {/* Descuento Opcional */}
                  <div className="pt-2 border-t border-zinc-900 flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Descuento:</span>
                    <div className="flex items-center gap-1">
                      <select 
                        value={discountType} 
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white"
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
                        className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-right"
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
                <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border-2 border-[#FF5500]/60 shadow-[0_0_25px_rgba(255,85,0,0.25)] text-center space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    TOTAL A COBRAR EN MOSTRADOR
                  </span>
                  <div className="text-3xl sm:text-4xl font-heading font-extrabold text-[#FF5500]">
                    ${grandTotal.toLocaleString('es-AR')}
                  </div>
                </div>

                {/* Medio de Pago */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 block">Medio de Pago:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'cash'
                          ? 'bg-[#FF5500]/20 border-[#FF5500] text-white shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-emerald-400" />
                      <span>Efectivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'transfer'
                          ? 'bg-[#FF5500]/20 border-[#FF5500] text-white shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-blue-400" />
                      <span>Transferencia</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'bg-[#FF5500]/20 border-[#FF5500] text-white shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-purple-400" />
                      <span>Tarjeta Déb/Créd</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qr')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'qr'
                          ? 'bg-[#FF5500]/20 border-[#FF5500] text-white shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-cyan-400" />
                      <span>Mercado Pago QR</span>
                    </button>
                  </div>
                </div>

                {/* Opciones Específicas por Medio de Pago */}
                {paymentMethod === 'cash' && (
                  <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">Paga con $:</span>
                      <input
                        type="number"
                        value={cashGiven}
                        onChange={(e) => setCashGiven(e.target.value)}
                        placeholder={grandTotal.toString()}
                        className="w-32 bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-white font-mono text-right outline-none focus:border-[#FF5500]"
                      />
                    </div>
                    {changeDue > 0 && (
                      <div className="flex items-center justify-between text-emerald-400 font-bold pt-1 border-t border-zinc-800">
                        <span>Vuelto a entregar:</span>
                        <span className="font-mono text-sm">${changeDue.toLocaleString('es-AR')}</span>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'transfer' && (
                  <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs space-y-1.5">
                    <div className="text-zinc-400 text-[11px]">Alias Oficial Montec:</div>
                    <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-zinc-700">
                      <span className="font-mono font-bold text-white">montec.mdp</span>
                      <button
                        type="button"
                        onClick={handleCopyAlias}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-orange-400 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        {isCopiedAlias ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopiedAlias ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* BOTÓN FINALIZAR ENTREGA */}
              <button
                onClick={handleFinalize}
                className="w-full py-3.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white font-heading font-bold text-sm shadow-[0_0_25px_rgba(255,85,0,0.4)] hover:shadow-[0_0_35px_rgba(255,85,0,0.6)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5" />
                <span>FINALIZAR ENTREGA Y COBRAR</span>
              </button>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
