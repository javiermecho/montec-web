import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  X, 
  Printer, 
  MessageSquare, 
  Check, 
  CheckCircle2, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  ArrowRight, 
  Barcode, 
  Package, 
  User, 
  Phone, 
  RotateCcw, 
  Sparkles, 
  AlertCircle,
  Tag,
  Percent,
  Receipt,
  Store
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ACCESSORIES_CATEGORIES } from '../../data/accessoriesData';

const PAYMENT_METHODS = [
  { id: 'Efectivo', label: 'Efectivo', icon: DollarSign, color: 'text-emerald-400' },
  { id: 'Transferencia', label: 'Transferencia / Alias', icon: ArrowRight, color: 'text-sky-400' },
  { id: 'Tarjeta', label: 'Débito / Crédito', icon: CreditCard, color: 'text-purple-400' },
  { id: 'MercadoPago', label: 'Mercado Pago QR', icon: QrCode, color: 'text-cyan-400' }
];

const MONTEC_ALIAS = 'MONTEC.MDQ';
const MONTEC_ADDRESS = 'Montes Carballo 943, Mar del Plata';
const MONTEC_PHONE = '5492235000000';

export default function SalesPOS() {
  const { inventory, recordStock, recordSale, panelTheme } = useData();
  const isLight = panelTheme === 'light';

  // --- Estados del Buscador y Catálogo ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const searchInputRef = useRef(null);

  // --- Estados del Carrito de Compras ---
  const [cart, setCart] = useState([]); // [{ id, sku, name, price, costPrice, stock, quantity, variant }]

  // --- Resumen Financiero y Descuento ---
  const [discountType, setDiscountType] = useState('none'); // 'none', 'percentage', 'fixed'
  const [discountValue, setDiscountValue] = useState('');

  // --- Medio de Pago & Cobro ---
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [cashGiven, setCashGiven] = useState('');

  // --- Datos opcionales del Cliente ---
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // --- Modal Post-Venta (Ticket) ---
  const [completedSale, setCompletedSale] = useState(null);
  const [barcodeAlert, setBarcodeAlert] = useState(null);

  // Filtrar productos del inventario
  const filteredProducts = useMemo(() => {
    return inventory.filter(prod => {
      // Filtro por categoría
      if (selectedCategory !== 'Todos' && prod.category !== selectedCategory) {
        return false;
      }

      // Filtro por texto de búsqueda (nombre, sku, código de barras)
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase().trim();
        const matchName = (prod.name || '').toLowerCase().includes(q);
        const matchSku = (prod.sku || '').toLowerCase().includes(q);
        const matchBarcode = (prod.barcode || '').toLowerCase().includes(q);
        const matchCategory = (prod.category || '').toLowerCase().includes(q);
        return matchName || matchSku || matchBarcode || matchCategory;
      }

      return true;
    });
  }, [inventory, selectedCategory, searchTerm]);

  // Agregar producto al carrito
  const addToCart = (product) => {
    if (product.stock <= 0) {
      setBarcodeAlert(`Sin stock disponible de ${product.name}`);
      setTimeout(() => setBarcodeAlert(null), 2500);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setBarcodeAlert(`Stock máximo alcanzado (${product.stock} un.)`);
          setTimeout(() => setBarcodeAlert(null), 2500);
          return prev;
        }
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          sku: product.sku,
          barcode: product.barcode,
          name: product.name,
          category: product.category,
          price: product.price,
          costPrice: product.costPrice || 0,
          stock: product.stock,
          image: product.image,
          quantity: 1,
          variant: ''
        }
      ];
    });

    // Feedback
    setBarcodeAlert(`Añadido: ${product.name}`);
    setTimeout(() => setBarcodeAlert(null), 2000);
  };

  // Manejar escáner de código de barras USB (termina con Enter)
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
      e.preventDefault();
      const code = searchTerm.trim().toLowerCase();
      // Buscar coincidencia exacta por barcode o sku
      const exactMatch = inventory.find(
        p => (p.barcode && p.barcode.toLowerCase() === code) ||
             (p.sku && p.sku.toLowerCase() === code)
      );

      if (exactMatch) {
        addToCart(exactMatch);
        setSearchTerm('');
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchTerm('');
      }
    }
  };

  // Modificar cantidad en carrito
  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.stock) {
            setBarcodeAlert(`Máximo stock disponible: ${item.stock}`);
            setTimeout(() => setBarcodeAlert(null), 2000);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Remover ítem del carrito
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // Limpiar carrito completo
  const clearCart = () => {
    setCart([]);
    setDiscountType('none');
    setDiscountValue('');
    setCashGiven('');
    setCustomerName('');
    setCustomerPhone('');
  };

  // --- Cálculos Financieros ---
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'none' || !discountValue || Number(discountValue) <= 0) return 0;
    const num = Number(discountValue);
    if (discountType === 'percentage') {
      const pct = Math.min(100, Math.max(0, num));
      return Math.round((subtotal * pct) / 100);
    }
    if (discountType === 'fixed') {
      return Math.min(subtotal, Math.max(0, num));
    }
    return 0;
  }, [subtotal, discountType, discountValue]);

  const total = Math.max(0, subtotal - discountAmount);

  // Vuelto en efectivo
  const cashNum = Number(cashGiven) || 0;
  const changeDue = paymentMethod === 'Efectivo' && cashNum > total ? cashNum - total : 0;
  const isCashInsufficient = paymentMethod === 'Efectivo' && cashGiven !== '' && cashNum < total;

  // Finalizar venta
  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'Efectivo' && isCashInsufficient) {
      alert(`El monto abonado ($${cashNum.toLocaleString('es-AR')}) es menor al total ($${total.toLocaleString('es-AR')}).`);
      return;
    }

    const saleRecord = {
      items: cart.map(item => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        price: item.price,
        costPrice: item.costPrice,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      })),
      subtotal,
      discountType,
      discountValue: Number(discountValue) || 0,
      discountAmount,
      total,
      paymentMethod,
      cashGiven: paymentMethod === 'Efectivo' ? cashNum : total,
      changeDue: paymentMethod === 'Efectivo' ? changeDue : 0,
      customer: {
        name: customerName,
        phone: customerPhone
      }
    };

    const completed = recordSale(saleRecord);
    setCompletedSale(completed);
  };

  // Generar WhatsApp del Ticket
  const generateTicketWhatsAppUrl = (sale) => {
    if (!sale) return '';
    const phoneClean = (sale.customer?.phone || '').replace(/[^0-9]/g, '');
    const finalPhone = phoneClean.startsWith('54') ? phoneClean : `549${phoneClean}`;

    const itemsText = sale.items.map(it => 
      `• *${it.quantity}x* ${it.name} - $${(it.subtotal).toLocaleString('es-AR')}`
    ).join('%0A');

    const discountText = sale.discountAmount > 0 
      ? `%0A🏷️ *Descuento:* -$${sale.discountAmount.toLocaleString('es-AR')}`
      : '';

    const msg = 
      `¡Hola ${sale.customer?.name || 'Cliente'}! 👋 Gracias por tu compra en *montec*.%0A%0A` +
      `🧾 *COMPROBANTE DE COMPRA:* ${sale.ticketNumber}%0A` +
      `📅 *Fecha:* ${sale.formattedDate}%0A%0A` +
      `📦 *DETALLE DE PRODUCTOS:*%0A${itemsText}%0A` +
      `${discountText}%0A` +
      `💳 *TOTAL ABONADO:* *$${sale.total.toLocaleString('es-AR')}*%0A` +
      `💵 *Medio de pago:* ${sale.paymentMethod}%0A` +
      (sale.changeDue > 0 ? `🪙 *Vuelto entregado:* $${sale.changeDue.toLocaleString('es-AR')}%0A` : '') +
      `%0A📍 *Local:* ${MONTEC_ADDRESS}%0A` +
      `🛡️ *Garantía oficial montec:* Todos los accesorios cuentan con cambio directo ante falla técnica.%0A%0A` +
      `¡Que disfrutes tu compra y te esperamos pronto!`;

    return `https://wa.me/${finalPhone}?text=${msg}`;
  };

  return (
    <div className="w-full space-y-4 font-sans animate-fade-in">
      
      {/* ALERTA FLOTANTE DE CÓDIGO DE BARRAS / STOCK */}
      {barcodeAlert && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#FF5500] text-white px-5 py-2.5 rounded-2xl shadow-xl font-bold text-xs sm:text-sm flex items-center gap-2 animate-bounce">
          <Barcode className="w-4 h-4" />
          <span>{barcodeAlert}</span>
        </div>
      )}

      {/* CABECERA GENERAL DEL POS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-zinc-700/20">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <h2 className={`text-xl sm:text-2xl font-heading font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Punto de Venta (POS de Mostrador)
            </h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}>
              Caja Rápida
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
            Compatible con lector de código de barras USB o selección táctil en pantalla
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 border ${
                isLight ? 'bg-white hover:bg-rose-50 text-rose-600 border-slate-300' : 'bg-zinc-900 hover:bg-rose-950/40 text-rose-400 border-zinc-700'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Vaciar Carrito</span>
            </button>
          )}
        </div>
      </div>

      {/* DISPOSICIÓN PRINCIPAL DE 2 PANELES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ================================================================ */}
        {/* PANEL IZQUIERDO: CATÁLOGO Y BUSCADOR (7/12 o 60% DE ANCHO)      */}
        {/* ================================================================ */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* BARRA DE BÚSQUEDA COMPATIBLE CON ESCÁNER */}
          <div className={`p-4 rounded-2xl border transition-colors shadow-xs ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#141417] border-zinc-800'
          }`}>
            <div className="relative">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-zinc-400'}`} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Escanear código de barras con pistola USB o buscar por SKU, Nombre..."
                autoFocus
                className={`w-full border rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm outline-none focus:border-[#FF5500] transition-colors font-sans ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                }`}
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg cursor-pointer ${
                    isLight ? 'text-slate-400 hover:text-slate-700' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Barcode className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 opacity-50 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
              )}
            </div>

            {/* FILTROS POR CATEGORÍA */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 scrollbar-thin text-xs">
              {ACCESSORIES_CATEGORIES.map(cat => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all border ${
                      active
                        ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-[0_0_12px_rgba(255,85,0,0.35)]'
                        : isLight
                          ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CUADRÍCULA DE PRODUCTOS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className={`col-span-full p-8 text-center rounded-2xl border italic text-xs sm:text-sm ${
                isLight ? 'bg-white text-slate-500 border-slate-200' : 'bg-zinc-900/40 text-zinc-500 border-zinc-800'
              }`}>
                No se encontraron productos coincidentes con "{searchTerm}".
              </div>
            ) : (
              filteredProducts.map(prod => {
                const isOutOfStock = prod.stock <= 0;
                const isLowStock = prod.stock > 0 && prod.stock <= (prod.minStock || 3);

                return (
                  <div
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    className={`group border rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 select-none ${
                      isOutOfStock
                        ? 'opacity-60 grayscale cursor-not-allowed'
                        : 'hover:border-[#FF5500] hover:shadow-[0_0_20px_rgba(255,85,0,0.2)] hover:-translate-y-0.5 active:scale-[0.98]'
                    } ${
                      isLight 
                        ? 'bg-white border-slate-200 shadow-xs' 
                        : 'bg-[#161619] border-zinc-800'
                    }`}
                  >
                    <div>
                      {/* Imagen y badges de stock */}
                      <div className="relative w-full h-28 rounded-xl bg-zinc-900 overflow-hidden mb-2.5 flex items-center justify-center border border-zinc-800/80">
                        {prod.image ? (
                          <img 
                            src={prod.image} 
                            alt={prod.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-zinc-600" />
                        )}

                        {/* Badge de Stock */}
                        <div className="absolute top-2 right-2">
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500 text-white shadow-xs">
                              Agotado
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/90 text-black shadow-xs font-mono">
                              Stock: {prod.stock}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600/90 text-white shadow-xs font-mono">
                              Stock: {prod.stock}
                            </span>
                          )}
                        </div>

                        {prod.sku && (
                          <span className="absolute bottom-1.5 left-2 text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/70 text-zinc-300 border border-zinc-700/60">
                            {prod.sku}
                          </span>
                        )}
                      </div>

                      {/* Nombre y categoría */}
                      <div className="text-[10px] uppercase font-bold text-[#FF5500] truncate">
                        {prod.category}
                      </div>
                      <h4 className={`text-xs sm:text-sm font-bold line-clamp-2 leading-tight mt-0.5 ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        {prod.name}
                      </h4>
                    </div>

                    {/* Precio y acción rápida */}
                    <div className="mt-3 pt-2 border-t border-zinc-700/20 flex items-center justify-between">
                      <span className={`text-sm sm:text-base font-heading font-black text-emerald-500`}>
                        ${Number(prod.price).toLocaleString('es-AR')}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-[#FF5500]/15 text-[#FF5500] group-hover:bg-[#FF5500] group-hover:text-white flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/* PANEL DERECHO: CARRITO, MEDIO DE PAGO & COBRO (5/12)             */}
        {/* ================================================================ */}
        <div className={`lg:col-span-5 border rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col space-y-4 transition-colors sticky top-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#141417] border-zinc-800'
        }`}>
          
          {/* TÍTULO DEL CARRITO */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-700/30">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#FF5500]" />
              <h3 className={`text-base font-heading font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Ticket de Venta
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF5500]/20 text-[#FF5500] font-bold font-mono">
                {cart.reduce((s, it) => s + it.quantity, 0)} ítems
              </span>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-rose-500 hover:text-rose-600 hover:underline cursor-pointer font-semibold"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* LISTADO DE ITEMS EN EL CARRITO */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className={`p-8 text-center rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 ${
                isLight ? 'border-slate-300 text-slate-400' : 'border-zinc-800 text-zinc-500'
              }`}>
                <ShoppingCart className="w-8 h-8 opacity-40" />
                <p className="text-xs">El carrito está vacío.</p>
                <p className="text-[11px] opacity-75">Tocá un producto o escaneá con lector de código de barras.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/90 border-zinc-800'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {item.name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                      <span>${Number(item.price).toLocaleString('es-AR')} c/u</span>
                      {item.sku && <span className="font-mono">({item.sku})</span>}
                    </div>
                  </div>

                  {/* Controles de Cantidad */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-colors border ${
                        isLight ? 'bg-white hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                      }`}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className={`w-7 text-center font-bold font-mono text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-colors border ${
                        isLight ? 'bg-white hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subtotal del ítem y botón borrar */}
                  <div className="text-right shrink-0">
                    <div className={`font-mono font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      ${(item.price * item.quantity).toLocaleString('es-AR')}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-zinc-500 hover:text-rose-500 p-0.5 cursor-pointer transition-colors mt-0.5"
                      title="Quitar ítem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DESCUENTO OPCIONAL */}
          {cart.length > 0 && (
            <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/60 border-zinc-800'
            }`}>
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>Descuento:</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDiscountType(discountType === 'percentage' ? 'none' : 'percentage')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer border ${
                    discountType === 'percentage'
                      ? 'bg-amber-500 text-black border-amber-500'
                      : isLight ? 'bg-white border-slate-300 text-slate-600' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType(discountType === 'fixed' ? 'none' : 'fixed')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer border ${
                    discountType === 'fixed'
                      ? 'bg-amber-500 text-black border-amber-500'
                      : isLight ? 'bg-white border-slate-300 text-slate-600' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}
                >
                  $ Fijo
                </button>

                {discountType !== 'none' && (
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '10%' : '$2000'}
                    className={`w-20 border rounded-lg px-2 py-1 text-xs font-mono outline-none focus:border-[#FF5500] ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-950 border-zinc-700 text-white'
                    }`}
                  />
                )}
              </div>
            </div>
          )}

          {/* RESUMEN FINANCIERO CON TOTAL EN NARANJA NEÓN */}
          <div className={`p-4 rounded-2xl border space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950 border-zinc-800'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={isLight ? 'text-slate-500' : 'text-zinc-400'}>Subtotal:</span>
              <span className={`font-mono font-bold ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                ${subtotal.toLocaleString('es-AR')}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-amber-500 font-semibold">
                <span>Descuento aplicado:</span>
                <span className="font-mono">-${discountAmount.toLocaleString('es-AR')}</span>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-700/30 flex items-baseline justify-between">
              <span className={`text-xs uppercase font-bold tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Total a Pagar:
              </span>
              <span className="text-2xl sm:text-3xl font-heading font-black text-[#FF5500] tracking-tight drop-shadow-[0_0_12px_rgba(255,85,0,0.3)]">
                ${total.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* SELECCIÓN DE MEDIO DE PAGO */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
              Medio de Pago:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(m => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                      active
                        ? 'bg-[#FF5500]/15 border-[#FF5500] ring-1 ring-[#FF5500] text-white font-bold'
                        : isLight
                          ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${m.color}`} />
                    <span className="text-xs truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DETALLES CONDICIONALES SEGÚN MEDIO DE PAGO */}
          {paymentMethod === 'Efectivo' && (
            <div className={`p-3 rounded-xl border space-y-2 text-xs ${
              isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/30'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`font-semibold ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>
                  Paga con $:
                </span>
                <input
                  type="number"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder={`Ej: $${Math.ceil(total / 1000) * 1000}`}
                  className={`w-36 border rounded-lg px-2.5 py-1 font-mono font-bold text-xs outline-none focus:border-emerald-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>

              {cashGiven !== '' && (
                <div className="flex items-center justify-between pt-1 border-t border-emerald-500/20 font-bold">
                  <span className={isCashInsufficient ? 'text-rose-500' : isLight ? 'text-emerald-900' : 'text-emerald-300'}>
                    {isCashInsufficient ? 'Monto insuficiente:' : 'Vuelto a entregar:'}
                  </span>
                  <span className={`font-mono text-sm ${
                    isCashInsufficient ? 'text-rose-500' : 'text-emerald-500 text-base'
                  }`}>
                    {isCashInsufficient 
                      ? `Faltan $${(total - cashNum).toLocaleString('es-AR')}`
                      : `$${changeDue.toLocaleString('es-AR')}`
                    }
                  </span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'Transferencia' && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
              isLight ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-sky-950/20 border-sky-500/30 text-sky-300'
            }`}>
              <div>
                <span className="block text-[10px] uppercase font-bold opacity-80">Alias Montec Oficial:</span>
                <span className="font-mono font-black text-sm tracking-wider">{MONTEC_ALIAS}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(MONTEC_ALIAS);
                  setBarcodeAlert('¡Alias copiado al portapapeles!');
                  setTimeout(() => setBarcodeAlert(null), 2000);
                }}
                className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
              >
                Copiar Alias
              </button>
            </div>
          )}

          {/* DATOS OPCIONALES DEL CLIENTE (PARA WHATSAPP) */}
          <div className="space-y-2 pt-1">
            <span className={`block text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
              Datos Opcionales del Cliente:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nombre cliente"
                  className={`w-full border rounded-xl pl-8 pr-2.5 py-1.5 text-xs outline-none focus:border-[#FF5500] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>

              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="WhatsApp ej: 2235..."
                  className={`w-full border rounded-xl pl-8 pr-2.5 py-1.5 text-xs outline-none focus:border-[#FF5500] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* BOTÓN FINALIZAR VENTA & COBRAR */}
          <button
            type="button"
            disabled={cart.length === 0 || isCashInsufficient}
            onClick={handleCheckout}
            className="w-full py-4 bg-[#FF5500] hover:bg-[#FF6600] text-white font-heading font-black text-sm sm:text-base rounded-2xl shadow-[0_0_25px_rgba(255,85,0,0.4)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>FINALIZAR VENTA & COBRAR</span>
          </button>

        </div>
      </div>

      {/* ================================================================ */}
      {/* MODAL POST-VENTA: TICKET IMPRESO / WHATSAPP / NUEVA VENTA        */}
      {/* ================================================================ */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
          <div className={`border rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative transition-colors ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#141417] border-zinc-800 text-white'
          }`}>
            
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-heading font-black">
                ¡Venta Registrada con Éxito!
              </h3>
              <p className={`text-xs mt-1 font-mono ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Comprobante: <strong>{completedSale.ticketNumber}</strong> • {completedSale.formattedDate}
              </p>
            </div>

            {/* VISTA PREVIA DEL TICKET (ESTILO TÉRMICO / MOSTRADOR) */}
            <div className={`p-4 rounded-2xl border mb-6 text-xs space-y-2 font-mono ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-zinc-950 border-zinc-800 text-zinc-300'
            }`}>
              <div className="text-center pb-2 border-b border-zinc-700/40">
                <div className="font-heading font-black text-sm tracking-wider text-[#FF5500]">montec</div>
                <div className="text-[10px] text-zinc-400">{MONTEC_ADDRESS}</div>
                <div className="text-[10px] text-zinc-400">Mar del Plata • Tel: 223 500-0000</div>
              </div>

              {/* Items */}
              <div className="space-y-1 py-1">
                {completedSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate pr-2">{it.quantity}x {it.name}</span>
                    <span className="font-bold">${it.subtotal.toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-700/40 space-y-1 text-right">
                {completedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-amber-500">
                    <span>Descuento:</span>
                    <span>-${completedSale.discountAmount.toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-[#FF5500]">
                  <span>TOTAL:</span>
                  <span>${completedSale.total.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Pago ({completedSale.paymentMethod}):</span>
                  <span>${completedSale.cashGiven.toLocaleString('es-AR')}</span>
                </div>
                {completedSale.changeDue > 0 && (
                  <div className="flex justify-between text-[11px] text-emerald-500 font-bold">
                    <span>Vuelto:</span>
                    <span>${completedSale.changeDue.toLocaleString('es-AR')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* BOTONERA DE ACCIÓN: IMPRIMIR, WHATSAPP, NUEVA VENTA */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors border ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700'
                  }`}
                >
                  <Printer className="w-4 h-4 text-[#FF5500]" />
                  <span>Imprimir Ticket</span>
                </button>

                {completedSale.customer?.phone ? (
                  <a
                    href={generateTicketWhatsAppUrl(completedSale)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-emerald-600/25"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const tel = prompt('Ingresá el número de WhatsApp del cliente (ej: 2235123456):');
                      if (tel) {
                        const updated = {
                          ...completedSale,
                          customer: { ...completedSale.customer, phone: tel }
                        };
                        window.open(generateTicketWhatsAppUrl(updated), '_blank');
                      }
                    }}
                    className="py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Enviar WhatsApp</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setCompletedSale(null);
                  clearCart();
                  if (searchInputRef.current) searchInputRef.current.focus();
                }}
                className="w-full py-3 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#FF5500]/25"
              >
                <Plus className="w-4 h-4" />
                <span>NUEVA VENTA</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
