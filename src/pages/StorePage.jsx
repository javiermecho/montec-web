import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  ShoppingBag, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Filter, 
  ShieldCheck, 
  Truck, 
  Zap, 
  Clock, 
  MapPin, 
  Phone,
  MessageCircle,
  ArrowRight,
  TrendingUp,
  X
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useSubdomain } from '../hooks/useSubdomain';
import { STORE_CATEGORIES, ACCESSORIES_DATABASE } from '../data/accessoriesData';
import StoreHeader from '../components/store/StoreHeader';
import StoreCategories from '../components/store/StoreCategories';
import ProductCard from '../components/store/ProductCard';
import ProductDetailModal from '../components/store/ProductDetailModal';
import CartDrawer from '../components/store/CartDrawer';
import MontecLogo from '../components/MontecLogo';

const STORAGE_KEYS = {
  CART: 'montec_store_cart_v1',
  CURRENCY: 'montec_store_currency_pref'
};

// Mapeo de categorías anteriores a las 7 categorías principales de la tienda
function normalizeCategory(cat) {
  if (!cat) return 'Accesorios & Fundas';
  const c = cat.toLowerCase();
  if (c.includes('iphone') || c.includes('smartphone') || c.includes('celular')) return 'iPhones & Smartphones';
  if (c.includes('watch') || c.includes('reloj') || c.includes('correa')) return 'Smartwatches & Relojes';
  if (c.includes('audio') || c.includes('airpod') || c.includes('auricular') || c.includes('parlante')) return 'Audio & AirPods';
  if (c.includes('cargador') || c.includes('fuente') || c.includes('cable') || c.includes('carga') || c.includes('bateria') || c.includes('powerbank')) return 'Carga & Energía';
  if (c.includes('funda') || c.includes('case') || c.includes('hidrogel') || c.includes('templado') || c.includes('vidrio') || c.includes('protector')) return 'Accesorios & Fundas';
  if (c.includes('gadget') || c.includes('airtag') || c.includes('hub') || c.includes('soporte') || c.includes('adaptador') || c.includes('otg')) return 'Gadgets & Electrónica Pequeña';
  return cat;
}

export default function StorePage() {
  const { accessories, inventory, dolarRate, businessConfig } = useData();
  const { navigateToMain } = useSubdomain();

  // Estados locales
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'price_asc' | 'price_desc' | 'name'
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENCY) || 'ARS';
  });

  // Carrito de compras
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Guardar carrito y moneda
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.error('Error guardando carrito:', e);
    }
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
  }, [currency]);

  // Toast auto-dismiss
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Base de datos de productos unificada: Contexto -> Fallback base oficial
  const allProducts = useMemo(() => {
    const source = (accessories && accessories.length > 0) 
      ? accessories 
      : ((inventory && inventory.length > 0) ? inventory.filter(i => i.visibleInWeb !== false) : ACCESSORIES_DATABASE);
    
    // Si la base del contexto tiene menos de 10 ítems (ej. versión vieja), enriquecer con ACCESSORIES_DATABASE
    if (source.length < ACCESSORIES_DATABASE.length) {
      const existingIds = new Set(source.map(s => s.id));
      const extra = ACCESSORIES_DATABASE.filter(item => !existingIds.has(item.id));
      return [...source, ...extra];
    }

    return source;
  }, [accessories, inventory]);

  // Conteo de productos por categoría
  const categoryCounts = useMemo(() => {
    const counts = { Todos: allProducts.length };
    STORE_CATEGORIES.forEach(cat => {
      if (cat !== 'Todos') {
        counts[cat] = allProducts.filter(p => {
          const norm = normalizeCategory(p.category);
          return norm === cat || p.category === cat;
        }).length;
      }
    });
    return counts;
  }, [allProducts]);

  // Filtrado y ordenamiento de productos
  const filteredProducts = useMemo(() => {
    let result = allProducts.filter(product => {
      // Filtro de categoría
      if (selectedCategory !== 'Todos') {
        const norm = normalizeCategory(product.category);
        if (norm !== selectedCategory && product.category !== selectedCategory) {
          return false;
        }
      }

      // Filtro de búsqueda
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = product.name?.toLowerCase().includes(query);
        const matchCat = product.category?.toLowerCase().includes(query);
        const matchSku = product.sku?.toLowerCase().includes(query);
        const matchComp = product.compatible?.toLowerCase().includes(query);
        const matchBadge = product.badge?.toLowerCase().includes(query);
        const matchFeatures = Array.isArray(product.features) && product.features.some(f => f.toLowerCase().includes(query));

        if (!matchName && !matchCat && !matchSku && !matchComp && !matchBadge && !matchFeatures) {
          return false;
        }
      }

      return true;
    });

    // Ordenamiento
    if (sortBy === 'price_asc') {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return result;
  }, [allProducts, selectedCategory, searchTerm, sortBy]);

  // Handlers del Carrito
  const handleAddToCart = (product) => {
    setCart(prev => {
      // Clave única según producto + variantes seleccionadas
      const variantKey = `${product.id}-${product.selectedColor || ''}-${product.selectedStorage || ''}-${product.selectedSize || ''}-${product.selectedFinish || ''}`;
      
      const existingIndex = prev.findIndex(item => {
        const itemKey = `${item.id}-${item.selectedColor || ''}-${item.selectedStorage || ''}-${item.selectedSize || ''}-${item.selectedFinish || ''}`;
        return itemKey === variantKey;
      });

      const qtyToAdd = product.cartQuantity || 1;

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          cartQuantity: (updated[existingIndex].cartQuantity || 1) + qtyToAdd
        };
        return updated;
      }

      return [...prev, { ...product, cartQuantity: qtyToAdd }];
    });

    showToast(`🛒 "${product.name}" agregado al carrito`);
  };

  const handleUpdateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = (item.cartQuantity || 1) + delta;
          if (newQty <= 0) return null;
          return { ...item, cartQuantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const handleClearCart = () => {
    if (confirm('¿Deseas vaciar todos los productos del carrito?')) {
      setCart([]);
    }
  };

  // Compra directa WhatsApp
  const handleDirectWhatsApp = (product) => {
    const rawWhatsapp = businessConfig?.contact?.quotationWhatsapp || businessConfig?.contact?.supportPhone || '5492235444991';
    const targetWhatsapp = rawWhatsapp.replace(/[^0-9]/g, '') || '5492235444991';

    const variantsText = [
      product.selectedColor ? `Color: ${product.selectedColor}` : null,
      product.selectedStorage ? `${product.selectedStorage}` : null,
      product.selectedSize ? `${product.selectedSize}` : null,
      product.selectedFinish ? `${product.selectedFinish}` : null
    ].filter(Boolean).join(' - ');

    let msg = `¡Hola Montec! Quiero consultar para comprar el siguiente producto de la tienda:\n`;
    msg += `📦 *${product.name}*`;
    if (variantsText) msg += ` (${variantsText})`;
    msg += `\n💰 Precio: $${Number(product.price).toLocaleString('es-AR')}\n`;
    msg += `¿Tienen stock disponible para retirar en Montes Carballo 943 o coordinar envío?`;

    const url = `https://wa.me/${targetWhatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const totalCartItems = cart.reduce((acc, item) => acc + (item.cartQuantity || 1), 0);

  return (
    <div className="min-h-screen bg-[#09090D] text-white flex flex-col selection:bg-[#FF5500] selection:text-white font-sans antialiased">
      
      {/* Toast Notification Flotante */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#151522] border border-[#FF5500]/50 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-fadeIn backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-[#FF5500]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Oficial de la Tienda */}
      <StoreHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        currency={currency}
        onCurrencyChange={setCurrency}
        cartCount={totalCartItems}
        onOpenCart={() => setIsCartOpen(true)}
        onBackToMain={navigateToMain}
        dolarRate={dolarRate}
      />

      {/* Barra de Categorías */}
      <StoreCategories
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
      />

      {/* Hero / Banner Principal de la Tienda */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-6 overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#FF5500]/10 blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto">
          <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-[#12121A] via-[#151524] to-[#12121A] border border-zinc-800/80 shadow-2xl relative overflow-hidden">
            
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5500]/15 border border-[#FF5500]/30 text-[#FF5500] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tienda Oficial Montec Tech Lab</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight leading-tight">
                Tecnología Seleccionada con <span className="text-[#FF5500]">Garantía Real</span>
              </h1>

              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                iPhones seminuevos inspeccionados punto a punto, Apple Watch, AirPods y accesorios de alta durabilidad. Retirá en nuestro laboratorio de Montes Carballo 943 o pedí envío directo a tu puerta.
              </p>

              {/* Badges de Beneficios */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-zinc-300 font-medium">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900/90 border border-zinc-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Garantía escrita 90 días</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900/90 border border-zinc-800">
                  <Truck className="w-4 h-4 text-sky-400" />
                  <span>Envíos en Mar del Plata & País</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900/90 border border-zinc-800">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>10% OFF Efectivo / Transferencia</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Contenido Principal / Grilla de Productos */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Barra de Filtros y Ordenamiento */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#12121A] border border-zinc-800/80">
          
          <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300">
            <span className="font-bold text-white font-mono text-base text-[#FF5500]">
              {filteredProducts.length}
            </span>
            <span>productos disponibles</span>
            {selectedCategory !== 'Todos' && (
              <span className="text-zinc-500">
                en <strong className="text-zinc-200">{selectedCategory}</strong>
              </span>
            )}
            {searchTerm && (
              <span className="text-zinc-500">
                para "<strong className="text-zinc-200">{searchTerm}</strong>"
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            
            {/* Reset de Filtros */}
            {(selectedCategory !== 'Todos' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('Todos');
                  setSearchTerm('');
                }}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Limpiar filtros</span>
              </button>
            )}

            {/* Selector de Orden */}
            <div className="flex items-center gap-2 bg-[#181824] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-zinc-200 outline-none cursor-pointer text-xs"
              >
                <option value="featured" className="bg-[#181824]">Más Destacados</option>
                <option value="price_asc" className="bg-[#181824]">Menor Precio</option>
                <option value="price_desc" className="bg-[#181824]">Mayor Precio</option>
                <option value="name" className="bg-[#181824]">Nombre (A - Z)</option>
              </select>
            </div>

          </div>

        </div>

        {/* Grilla Reactiva de Productos */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-[#101017] rounded-3xl border border-zinc-800 p-8">
            <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-heading font-bold text-white">
                No se encontraron productos
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                No hay resultados para tu búsqueda o filtro actual. Probá seleccionando otra categoría o limpiando los términos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Todos');
                setSearchTerm('');
              }}
              className="px-5 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs font-bold transition-all shadow-lg cursor-pointer"
            >
              Ver Todos los Productos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={currency}
                dolarRate={dolarRate}
                onAddToCart={handleAddToCart}
                onOpenDetail={setSelectedProductDetail}
                onDirectWhatsApp={handleDirectWhatsApp}
              />
            ))}
          </div>
        )}

      </main>

      {/* Botón Flotante de Carrito Móvil */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-6 right-6 z-40 sm:hidden animate-bounce">
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-4 rounded-2xl bg-[#FF5500] text-white shadow-[0_0_30px_rgba(255,85,0,0.6)] flex items-center justify-center relative cursor-pointer"
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black text-[#FF5500] text-xs font-mono font-black flex items-center justify-center border-2 border-[#FF5500]">
              {totalCartItems}
            </span>
          </button>
        </div>
      )}

      {/* Modal Ficha Rápida del Producto */}
      <ProductDetailModal
        product={selectedProductDetail}
        isOpen={Boolean(selectedProductDetail)}
        onClose={() => setSelectedProductDetail(null)}
        currency={currency}
        dolarRate={dolarRate}
        onAddToCart={handleAddToCart}
        onBuyNowWhatsApp={handleDirectWhatsApp}
      />

      {/* Slide-over Drawer Carrito */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        currency={currency}
        dolarRate={dolarRate}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* Footer Especial de la Tienda */}
      <footer className="mt-16 bg-[#07070A] border-t border-zinc-800/80 py-12 px-4 sm:px-6 lg:px-8 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <MontecLogo size="sm" />
            <div>
              <span className="font-heading font-bold text-white text-sm block">
                Montec Store
              </span>
              <span className="text-[11px] text-zinc-500">
                División oficial de venta de equipos y accesorios de Montec Tech Lab
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-400 text-xs">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#FF5500]" />
              Montes Carballo 943, Mar del Plata
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FF5500]" />
              Lun a Vie 9:30 a 19:00 | Sáb 10:00 a 14:00
            </span>
            <button
              onClick={navigateToMain}
              className="text-[#FF5500] hover:underline font-semibold cursor-pointer"
            >
              ← Ir a Servicio Técnico & Laboratorio
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
