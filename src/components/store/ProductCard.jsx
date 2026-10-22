import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Eye, 
  Check, 
  MessageCircle, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  CreditCard,
  Plus
} from 'lucide-react';

export default function ProductCard({
  product,
  currency = 'ARS',
  dolarRate = 1250,
  onAddToCart,
  onOpenDetail,
  onDirectWhatsApp
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  const priceArs = Number(product.price) || 0;
  const rate = Number(dolarRate) > 0 ? Number(dolarRate) : 1250;
  const priceUsd = Math.round(priceArs / rate);

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 3;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart(product);
    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 1200);
  };

  return (
    <div
      onClick={() => onOpenDetail(product)}
      className={`group bg-[#121219] rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer relative hover:-translate-y-1 ${
        isOutOfStock
          ? 'border-zinc-800/80 opacity-75'
          : 'border-zinc-800/90 hover:border-[#FF5500]/60 hover:shadow-[0_8px_30px_rgba(255,85,0,0.18)]'
      }`}
    >
      {/* Visual / Imagen del Producto */}
      <div className="relative w-full aspect-square bg-[#0b0b10] flex items-center justify-center overflow-hidden border-b border-zinc-800/60 p-4">
        
        {/* Badges superiores */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
          {product.badge && (
            <span className="px-2.5 py-1 rounded-lg bg-[#FF5500]/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
              {product.badge}
            </span>
          )}
          {product.condition && (
            <span className="px-2 py-0.5 rounded-md bg-zinc-900/90 border border-zinc-700/80 text-zinc-300 text-[10px] font-medium backdrop-blur-md">
              {product.condition}
            </span>
          )}
        </div>

        {/* Badge de stock derecho */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {isOutOfStock ? (
            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
              Sin Stock
            </span>
          ) : isLowStock ? (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-pulse">
              ¡Últimas {product.stock}!
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium">
              En Stock
            </span>
          )}
        </div>

        {/* Imagen del Producto con Lazy Loading */}
        {product.image && !imageError ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-108 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#FF5500]">
            <ShoppingBag className="w-8 h-8" />
          </div>
        )}

        {/* Hover Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(product);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver Ficha</span>
          </button>
        </div>

      </div>

      {/* Contenido / Información */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        
        <div>
          {/* Categoría & SKU */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
            <span className="text-[#FF5500] font-semibold">{product.category}</span>
            <span className="font-mono text-[10px] text-zinc-500">{product.sku}</span>
          </div>

          {/* Nombre del Producto */}
          <h3 className="text-sm sm:text-base font-heading font-bold text-white group-hover:text-[#FF5500] transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>

          {/* Compatibilidad */}
          {product.compatible && (
            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
              📱 {product.compatible}
            </p>
          )}

          {/* Variantes disponibles (si tiene colores o almacenamiento) */}
          {product.variants && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {product.variants.colors && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-500">Colores:</span>
                  <span className="text-[10px] text-zinc-300 font-medium">
                    {product.variants.colors.slice(0, 3).join(', ')}
                    {product.variants.colors.length > 3 ? '...' : ''}
                  </span>
                </div>
              )}
              {product.variants.storage && (
                <div className="flex items-center gap-1 ml-auto">
                  {product.variants.storage.map(s => (
                    <span key={s} className="px-1.5 py-0.2 rounded bg-zinc-800 text-[9px] font-mono font-bold text-zinc-300">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Precio & CTA */}
        <div className="pt-3 border-t border-zinc-800/80 space-y-3">
          
          {/* Contenedor de Precio */}
          <div>
            <div className="flex items-baseline gap-2">
              {currency === 'ARS' ? (
                <>
                  <span className="text-xl sm:text-2xl font-heading font-black text-white">
                    ${priceArs.toLocaleString('es-AR')}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 font-medium">
                    (~ U$D {priceUsd})
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl sm:text-2xl font-heading font-black text-[#FF5500]">
                    U$D {priceUsd}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 font-medium">
                    (${priceArs.toLocaleString('es-AR')})
                  </span>
                </>
              )}
            </div>

            {/* Facilidades de pago */}
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-400 font-medium">
              <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>10% OFF pagando con Efectivo / Transferencia</span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2">
            {!isOutOfStock ? (
              <button
                type="button"
                onClick={handleAdd}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isAddedRecently
                    ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                    : 'bg-[#FF5500] hover:bg-[#FF6600] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)] active:scale-95'
                }`}
              >
                {isAddedRecently ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>¡Agregado!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Agregar al Carrito</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDirectWhatsApp(product);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Consultar Ingreso</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(product);
              }}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
              title="Ver especificaciones completas"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
