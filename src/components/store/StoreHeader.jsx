import React, { useState } from 'react';
import { 
  Search, 
  ShoppingBag, 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  Sparkles,
  Phone,
  MapPin,
  Menu,
  X
} from 'lucide-react';
import MontecLogo from '../MontecLogo';
import { useData } from '../../context/DataContext';

export default function StoreHeader({
  searchTerm,
  onSearchChange,
  currency,
  onCurrencyChange,
  cartCount,
  onOpenCart,
  onBackToMain,
  dolarRate
}) {
  const { businessConfig } = useData();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const rawPhone = businessConfig?.contact?.supportPhone || businessConfig?.contact?.quotationWhatsapp || '5492235444991';
  const displayAddress = businessConfig?.business?.address || 'Montes Carballo 943';
  const displayCity = businessConfig?.business?.city || 'Mar del Plata';

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0E]/95 backdrop-blur-xl border-b border-zinc-800/80 shadow-2xl transition-all">
      {/* Top Banner de Confianza y Cotización Dólar */}
      <div className="bg-[#101017] border-b border-zinc-800/60 px-3 sm:px-6 py-1.5 text-[11px] text-zinc-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="flex items-center gap-1 text-emerald-400 font-medium shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Retiro en el local o Envíos Express
            </span>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-zinc-300">
              📍 {displayAddress}, {displayCity}
            </span>
            <span className="text-zinc-700 hidden md:inline">•</span>
            <span className="hidden md:inline text-zinc-400">
              🛡️ Garantía escrita en todos los equipos y accesorios
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {dolarRate && (
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] sm:text-[11px] text-zinc-300"
                title="Cotización Dólar Blue Venta en tiempo real (fuente oficial)"
              >
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-zinc-400">Dólar Blue:</span>
                <strong className="text-white font-mono font-bold">${Number(dolarRate).toLocaleString('es-AR')}</strong>
              </div>
            )}

            <button
              onClick={onBackToMain}
              className="text-zinc-400 hover:text-white hover:underline flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3 h-3 text-[#FF5500]" />
              <span className="hidden sm:inline">Servicio Técnico</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Logo Montec + Badge Store */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onBackToMain}
              className="group flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
              title="Volver a Montec Laboratorio & Servicio Técnico"
            >
              <MontecLogo size="sm" className="group-hover:opacity-90 transition-opacity" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-heading font-black tracking-tight text-white group-hover:text-zinc-200">
                    STORE
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#FF5500]/20 text-[#FF5500] text-[9px] font-black uppercase tracking-wider border border-[#FF5500]/40">
                    OFICIAL
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 -mt-0.5 hidden sm:block">
                  Tecnología & Pequeña Electrónica
                </span>
              </div>
            </button>
          </div>

          {/* Buscador Desktop en tiempo real */}
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <div className="w-full relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar iPhones, AirPods, cargadores rápidos, Apple Watch, fundas..."
                className="w-full bg-[#14141c] hover:bg-[#181822] focus:bg-[#181822] text-white placeholder-zinc-500 text-xs sm:text-sm pl-10 pr-10 py-2.5 rounded-xl border border-zinc-800 focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500]/30 outline-none transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Acciones: Selector de Moneda + Carrito + Volver al Taller */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Botón búsqueda móvil */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
              title="Buscar productos"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Selector de Moneda: ARS / USD */}
            <div className="flex items-center p-1 rounded-xl bg-[#14141c] border border-zinc-800 text-xs font-semibold">
              <button
                onClick={() => onCurrencyChange('ARS')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currency === 'ARS'
                    ? 'bg-[#FF5500] text-white shadow-[0_0_12px_rgba(255,85,0,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Mostrar precios en Pesos Argentinos"
              >
                $ ARS
              </button>
              <button
                onClick={() => onCurrencyChange('USD')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-[#FF5500] text-white shadow-[0_0_12px_rgba(255,85,0,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Mostrar precios en Dólares (U$D)"
              >
                U$D
              </button>
            </div>

            {/* Carrito de Compras */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FF6600] hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(255,85,0,0.4)] transition-all cursor-pointer active:scale-95"
              title="Ver carrito de compras"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Carrito</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-black text-[#FF5500] text-[11px] font-black font-mono border border-white/20 animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Botón Volver a Servicio Técnico */}
            <button
              onClick={onBackToMain}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-800 transition-colors cursor-pointer"
              title="Ir a la web de Servicio Técnico y Laboratorio"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Servicio Técnico</span>
            </button>

          </div>

        </div>

        {/* Buscador Móvil Desplegable */}
        {mobileSearchOpen && (
          <div className="md:hidden mt-2 pt-2 border-t border-zinc-800/80 animate-fadeIn">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por producto, marca o modelo..."
                className="w-full bg-[#161620] text-white placeholder-zinc-500 text-xs pl-9 pr-9 py-2.5 rounded-xl border border-zinc-700 focus:border-[#FF5500] outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
