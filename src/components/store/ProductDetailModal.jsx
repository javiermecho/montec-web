import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingBag, 
  MessageCircle, 
  Check, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  CreditCard, 
  MapPin, 
  Clock, 
  Plus, 
  Minus,
  CheckCircle2
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  currency = 'ARS',
  dolarRate = 1250,
  onAddToCart,
  onBuyNowWhatsApp
}) {
  if (!isOpen || !product) return null;

  const { businessConfig } = useData();

  const [selectedColor, setSelectedColor] = useState(() => {
    return product.variants?.colors?.[0] || null;
  });

  const [selectedStorage, setSelectedStorage] = useState(() => {
    return product.variants?.storage?.[0] || null;
  });

  const [selectedSize, setSelectedSize] = useState(() => {
    return product.variants?.sizes?.[0] || null;
  });

  const [selectedFinish, setSelectedFinish] = useState(() => {
    return product.variants?.finishes?.[0] || null;
  });

  const [quantity, setQuantity] = useState(1);
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  // Escuchar tecla escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const priceArs = Number(product.price) || 0;
  const rate = Number(dolarRate) > 0 ? Number(dolarRate) : 1250;
  const priceUsd = Math.round(priceArs / rate);

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const maxStock = product.stock || 10;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    // Crear item enriquecido con las variantes seleccionadas
    const variantItem = {
      ...product,
      selectedColor,
      selectedStorage,
      selectedSize,
      selectedFinish,
      cartQuantity: quantity
    };

    onAddToCart(variantItem);
    setIsAddedRecently(true);
    setTimeout(() => {
      setIsAddedRecently(false);
      onClose();
    }, 900);
  };

  const handleBuyNow = () => {
    const variantItem = {
      ...product,
      selectedColor,
      selectedStorage,
      selectedSize,
      selectedFinish,
      cartQuantity: quantity
    };
    onBuyNowWhatsApp(variantItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-[#101016] border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header del Modal */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#13131c] shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#FF5500]/20 text-[#FF5500] text-xs font-bold uppercase tracking-wider border border-[#FF5500]/30">
              {product.category}
            </span>
            <span className="text-xs font-mono text-zinc-500">
              SKU: {product.sku}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Columna Izquierda: Imagen y Garantía */}
          <div className="space-y-4">
            <div className="aspect-square w-full rounded-2xl bg-[#09090e] border border-zinc-800/80 p-6 flex items-center justify-center relative overflow-hidden group">
              {product.badge && (
                <span className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-[#FF5500] text-white text-xs font-bold shadow-lg">
                  {product.badge}
                </span>
              )}

              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <ShoppingBag className="w-20 h-20 text-[#FF5500]" />
              )}
            </div>

            {/* Garantía y Confianza */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Garantía Oficial Montec de 90 Días</span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Todos los productos y reparaciones cuentan con respaldo directo en nuestro laboratorio en Montes Carballo 943, Mar del Plata.
              </p>
            </div>
          </div>

          {/* Columna Derecha: Título, Variantes, Precios y Compra */}
          <div className="flex flex-col justify-between space-y-6">
            
            <div className="space-y-4">
              
              {/* Título & Condición */}
              <div>
                {product.condition && (
                  <span className="text-xs text-[#FF5500] font-bold block mb-1">
                    • {product.condition}
                  </span>
                )}
                <h2 className="text-xl sm:text-2xl font-heading font-black text-white leading-tight">
                  {product.name}
                </h2>
                {product.compatible && (
                  <p className="text-xs text-zinc-400 mt-1">
                    Compatibilidad: <span className="text-zinc-200 font-medium">{product.compatible}</span>
                  </p>
                )}
              </div>

              {/* Contenedor de Precio */}
              <div className="p-4 rounded-2xl bg-[#161622] border border-zinc-800/90 space-y-2">
                <div className="flex items-baseline gap-3">
                  {currency === 'ARS' ? (
                    <>
                      <span className="text-3xl sm:text-4xl font-heading font-black text-white">
                        ${priceArs.toLocaleString('es-AR')}
                      </span>
                      <span className="text-sm font-mono text-zinc-400 font-semibold">
                        (~ U$D {priceUsd})
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl sm:text-4xl font-heading font-black text-[#FF5500]">
                        U$D {priceUsd}
                      </span>
                      <span className="text-sm font-mono text-zinc-400 font-semibold">
                        (${priceArs.toLocaleString('es-AR')})
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-1 text-xs text-zinc-300">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>10% de descuento abonando en Efectivo o Transferencia</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Aceptamos todas las tarjetas de Débito y Crédito</span>
                  </div>
                </div>
              </div>

              {/* Selector de Variantes: Color */}
              {product.variants?.colors && product.variants.colors.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Seleccionar Color: <span className="text-[#FF5500]">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          selectedColor === color
                            ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-[0_0_12px_rgba(255,85,0,0.4)]'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selector de Variantes: Capacidad / Storage */}
              {product.variants?.storage && product.variants.storage.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Almacenamiento: <span className="text-[#FF5500]">{selectedStorage}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.storage.map((storage) => (
                      <button
                        key={storage}
                        type="button"
                        onClick={() => setSelectedStorage(storage)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                          selectedStorage === storage
                            ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-[0_0_12px_rgba(255,85,0,0.4)]'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {storage}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selector de Variantes: Talle / Medida (Apple Watch) */}
              {product.variants?.sizes && product.variants.sizes.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Medida de Caja: <span className="text-[#FF5500]">{selectedSize}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          selectedSize === size
                            ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-[0_0_12px_rgba(255,85,0,0.4)]'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selector de Variantes: Acabado Hidrogel */}
              {product.variants?.finishes && product.variants.finishes.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Tipo de Lámina: <span className="text-[#FF5500]">{selectedFinish}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.finishes.map((finish) => (
                      <button
                        key={finish}
                        type="button"
                        onClick={() => setSelectedFinish(finish)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          selectedFinish === finish
                            ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-[0_0_12px_rgba(255,85,0,0.4)]'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {finish}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Características Clave (Features) */}
              {product.features && product.features.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Características Destacadas:
                  </h4>
                  <ul className="space-y-1.5">
                    {product.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-[#FF5500] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

            {/* Acciones y Cantidad */}
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              
              {/* Stepper de Cantidad */}
              {!isOutOfStock && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Cantidad:</span>
                  <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold text-sm text-white px-2">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= maxStock}
                      onClick={() => setQuantity(q => Math.min(maxStock, q + 1))}
                      className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!isOutOfStock ? (
                  <>
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isAddedRecently
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#FF5500] hover:bg-[#FF6600] text-white shadow-[0_0_20px_rgba(255,85,0,0.4)]'
                      }`}
                    >
                      {isAddedRecently ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>¡Agregado al Carrito!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>Agregar al Carrito</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white text-transparent" />
                      <span>Comprar por WhatsApp</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="col-span-2 py-3 px-4 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Consultar Ingreso por WhatsApp</span>
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
