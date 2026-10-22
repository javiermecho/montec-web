import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  Plus, 
  Minus, 
  MessageCircle, 
  Sparkles, 
  CreditCard, 
  Banknote, 
  ArrowRight,
  MapPin,
  Truck,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function CartDrawer({
  isOpen,
  onClose,
  cart = [],
  currency = 'ARS',
  dolarRate = 1250,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}) {
  const { businessConfig } = useData();

  // Datos del cliente para el pedido
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentPreference, setPaymentPreference] = useState('Transferencia Bancaria (10% OFF)');
  const [deliveryMethod, setDeliveryMethod] = useState('Retiro en Local (Montes Carballo 943)');
  const [notes, setNotes] = useState('');
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);

  // Escuchar tecla escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const rawWhatsapp = businessConfig?.contact?.quotationWhatsapp || businessConfig?.contact?.supportPhone || '5492235444991';
  const targetWhatsapp = rawWhatsapp.replace(/[^0-9]/g, '') || '5492235444991';
  const rate = Number(dolarRate) > 0 ? Number(dolarRate) : 1250;

  // Cálculos financieros
  const subtotalArs = cart.reduce((acc, item) => acc + (Number(item.price) * (item.cartQuantity || 1)), 0);
  const isTransferOrCash = paymentPreference.includes('10% OFF');
  const discountAmountArs = isTransferOrCash ? Math.round(subtotalArs * 0.10) : 0;
  const totalArs = Math.max(0, subtotalArs - discountAmountArs);

  const subtotalUsd = Math.round(subtotalArs / rate);
  const totalUsd = Math.round(totalArs / rate);

  // Checkout por WhatsApp
  const handleCheckoutWhatsApp = () => {
    if (cart.length === 0) {
      setShowEmptyWarning(true);
      return;
    }

    if (!clientName.trim()) {
      alert('Por favor ingresá tu nombre para preparar el pedido.');
      return;
    }

    let msg = `*PEDIDO NUEVO - MONTEC STORE* 🛒🛡️\n`;
    msg += `📍 *Retiro / Envío:* ${deliveryMethod}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*PRODUCTOS SOLICITADOS:*\n`;

    cart.forEach((item, index) => {
      const qty = item.cartQuantity || 1;
      const variantsText = [
        item.selectedColor ? `Color: ${item.selectedColor}` : null,
        item.selectedStorage ? `${item.selectedStorage}` : null,
        item.selectedSize ? `${item.selectedSize}` : null,
        item.selectedFinish ? `${item.selectedFinish}` : null
      ].filter(Boolean).join(' - ');

      const itemTotal = (Number(item.price) * qty).toLocaleString('es-AR');
      msg += `• *${qty}x ${item.name}*`;
      if (variantsText) msg += ` (${variantsText})`;
      msg += ` — $${itemTotal}\n`;
    });

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *Subtotal:* $${subtotalArs.toLocaleString('es-AR')} (~ U$D ${subtotalUsd})\n`;
    
    if (discountAmountArs > 0) {
      msg += `🏷️ *Descuento aplicado (10% OFF):* -$${discountAmountArs.toLocaleString('es-AR')}\n`;
    }

    msg += `💳 *TOTAL ESTIMADO:* $${totalArs.toLocaleString('es-AR')} (~ U$D ${totalUsd})\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 *Cliente:* ${clientName.trim()}\n`;
    if (clientPhone.trim()) {
      msg += `📱 *Teléfono de contacto:* ${clientPhone.trim()}\n`;
    }
    msg += `💵 *Forma de pago:* ${paymentPreference}\n`;
    if (notes.trim()) {
      msg += `📝 *Aclaraciones:* ${notes.trim()}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_Enviado desde tienda.montec.ar_`;

    const url = `https://wa.me/${targetWhatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0F0F16] border-l border-zinc-800 text-white flex flex-col shadow-2xl">
          
          {/* Header del Carrito */}
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#12121B] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-white flex items-center gap-2">
                  Tu Carrito
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-mono font-bold">
                    {cart.reduce((a, b) => a + (b.cartQuantity || 1), 0)} ítems
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Montec Store • Montes Carballo 943
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={onClearCart}
                  className="p-2 text-zinc-500 hover:text-rose-400 text-xs transition-colors cursor-pointer"
                  title="Vaciar carrito"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lista de Productos del Carrito */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            
            {cart.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-base">Tu carrito está vacío</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Explora nuestra tienda de iPhones, Apple Watch, AirPods y accesorios certificados.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs font-bold transition-all shadow-lg cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Explorar Productos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, idx) => {
                  const qty = item.cartQuantity || 1;
                  const itemTotal = Number(item.price) * qty;

                  const variantsBadge = [
                    item.selectedColor,
                    item.selectedStorage,
                    item.selectedSize,
                    item.selectedFinish
                  ].filter(Boolean).join(' • ');

                  return (
                    <div 
                      key={`${item.id}-${idx}`}
                      className="p-3.5 rounded-2xl bg-[#14141E] border border-zinc-800/90 flex items-center gap-3.5 relative group"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 p-1">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-[#FF5500]" />
                        )}
                      </div>

                      {/* Info & Controles */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-white line-clamp-1 leading-snug">
                          {item.name}
                        </h4>
                        
                        {variantsBadge && (
                          <span className="text-[10px] text-zinc-400 block line-clamp-1 mt-0.5">
                            {variantsBadge}
                          </span>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          {/* Precio unitario */}
                          <div className="text-xs font-mono font-bold text-[#FF5500]">
                            ${itemTotal.toLocaleString('es-AR')}
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-0.5">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="text-zinc-400 hover:text-white p-0.5"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-mono font-bold text-white px-1">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="text-zinc-400 hover:text-white p-0.5"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Botón eliminar */}
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="text-zinc-600 hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                        title="Quitar ítem"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Formulario de Checkout Rápido */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Datos de Entrega y Pago:
                </h4>

                {/* Nombre */}
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Tu Nombre y Apellido: <span className="text-[#FF5500]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej: Sofía Martínez"
                    className="w-full bg-[#161622] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#FF5500] outline-none"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    WhatsApp de Contacto (opcional):
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Ej: 223 544 4991"
                    className="w-full bg-[#161622] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#FF5500] outline-none"
                  />
                </div>

                {/* Forma de Pago */}
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Forma de Pago Preferida:
                  </label>
                  <select
                    value={paymentPreference}
                    onChange={(e) => setPaymentPreference(e.target.value)}
                    className="w-full bg-[#161622] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#FF5500] outline-none cursor-pointer"
                  >
                    <option value="Transferencia Bancaria (10% OFF)">Transferencia Bancaria (10% OFF)</option>
                    <option value="Efectivo en Local (10% OFF)">Efectivo en el Local (10% OFF)</option>
                    <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                    <option value="Tarjeta de Crédito (Hasta 3 o 6 cuotas)">Tarjeta de Crédito (Hasta 3 o 6 cuotas)</option>
                    <option value="Mercado Pago QR">Mercado Pago QR</option>
                  </select>
                </div>

                {/* Método de Entrega */}
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Modalidad de Entrega:
                  </label>
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="w-full bg-[#161622] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#FF5500] outline-none cursor-pointer"
                  >
                    <option value="Retiro en Local (Montes Carballo 943)">Retiro en Local (Montes Carballo 943, Mar del Plata)</option>
                    <option value="Envío a Domicilio en Mar del Plata">Envío a Domicilio en Mar del Plata</option>
                    <option value="Envío por Correo al resto del país">Envío por Correo al resto del país</option>
                  </select>
                </div>

                {/* Notas */}
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Aclaraciones o consulta (opcional):
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Horario preferido para retirar, detalles de entrega..."
                    className="w-full bg-[#161622] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#FF5500] outline-none resize-none"
                  />
                </div>

              </div>
            )}

          </div>

          {/* Footer del Carrito con Resumen y Checkout */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-zinc-800 bg-[#12121B] space-y-3 shrink-0">
              
              {/* Desglose */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-zinc-200">${subtotalArs.toLocaleString('es-AR')}</span>
                </div>

                {discountAmountArs > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Descuento 10% OFF:
                    </span>
                    <span className="font-mono">-${discountAmountArs.toLocaleString('es-AR')}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-zinc-800">
                  <span>Total Final:</span>
                  <div className="text-right">
                    <div className="text-xl font-heading font-black text-[#FF5500]">
                      ${totalArs.toLocaleString('es-AR')}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400">
                      (~ U$D {totalUsd})
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón WhatsApp Checkout */}
              <button
                type="button"
                onClick={handleCheckoutWhatsApp}
                className="w-full py-3.5 px-4 rounded-xl font-heading font-black text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] transition-all cursor-pointer active:scale-95"
              >
                <MessageCircle className="w-5 h-5 fill-white text-transparent" />
                <span>FINALIZAR PEDIDO POR WHATSAPP</span>
              </button>

              <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400">
                <Lock className="w-3 h-3 text-zinc-500" />
                <span>Atención personalizada inmediata por nuestro equipo de ventas</span>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
