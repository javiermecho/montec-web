import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ClipboardList, 
  ShoppingCart, 
  Lightbulb, 
  Search, 
  Wrench, 
  Package, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  LogOut, 
  Maximize2, 
  Sliders, 
  X, 
  User, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
  Store
} from 'lucide-react';
import MontecLogo from '../MontecLogo';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import RepairOrdersManager from './RepairOrdersManager';
import SalesPOS from '../pos/SalesPOS';
import PartsSearchTab from '../admin/PartsSearchTab';
import RepairOrderReceiver from './RepairOrderReceiver';
import UnifiedDeliveryModal from './UnifiedDeliveryModal';

export default function OperatorCockpit({ onClose }) {
  const { currentUser, role, isAdmin, logout, elevateToAdmin, isTallerSubdomain } = useAuth();
  const { 
    orders, 
    inventory, 
    dolarRate, 
    setIsAdminOpen, 
    setIsTallerOpen,
    panelTheme,
    togglePanelTheme,
    serverStatus,
    refreshConnection
  } = useData();

  const isLight = panelTheme === 'light';

  // Vista activa: 'orders' (F9), 'pos' (F10), 'quote' (F11)
  const [activeTab, setActiveTab] = useState('orders');

  // Modales
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [deliveryOrder, setDeliveryOrder] = useState(null);
  const [isElevateModalOpen, setIsElevateModalOpen] = useState(false);
  const [elevatePin, setElevatePin] = useState('');
  const [elevateError, setElevateError] = useState('');

  // Reloj en tiempo real
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ATAJOS DE TECLADO GLOBALES (F9, F10, F11, F12)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorar si se está escribiendo en un input o textarea para ciertas teclas
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

      if (e.key === 'F12') {
        e.preventDefault();
        setIsNewOrderOpen(prev => !prev);
      } else if (e.key === 'F9') {
        e.preventDefault();
        setActiveTab('orders');
      } else if (e.key === 'F10') {
        e.preventDefault();
        setActiveTab('pos');
      } else if (e.key === 'F11') {
        e.preventDefault();
        setActiveTab('quote');
      } else if (e.key === 'Escape') {
        if (isNewOrderOpen) setIsNewOrderOpen(false);
        if (deliveryOrder) setDeliveryOrder(null);
        if (isElevateModalOpen) setIsElevateModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNewOrderOpen, deliveryOrder, isElevateModalOpen]);

  // Métricas rápidas de cabecera
  const activeOrdersCount = orders.filter(o => o.service?.status !== 'delivered' && o.service?.status !== 'no_repair').length;
  const readyOrdersCount = orders.filter(o => o.service?.status === 'ready').length;

  // Manejo de elevación a administrador
  const handleElevateSubmit = (e) => {
    e.preventDefault();
    const res = elevateToAdmin(elevatePin);
    if (res.success) {
      setIsElevateModalOpen(false);
      setElevatePin('');
      setElevateError('');
      setIsAdminOpen(true);
    } else {
      setElevateError(res.error || 'PIN incorrecto');
    }
  };

  const handleOpenAdminPanel = () => {
    if (isAdmin) {
      setIsAdminOpen(true);
    } else {
      setIsElevateModalOpen(true);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col overflow-hidden animate-fadeIn transition-colors ${
      isLight ? 'montec-panel-light' : 'bg-[#08080A] text-zinc-100'
    }`}>
      
      {/* 1. BARRA SUPERIOR DE CABECERA DEL COCKPIT */}
      <header className="bg-[#0c0c10] border-b border-zinc-800/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-md">
        
        {/* Izquierda: Logo + Insignia de Rol + Reloj */}
        <div className="flex items-center gap-3">
          <MontecLogo size="sm" />
          <div className="hidden sm:flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border tracking-wider uppercase ${
              isAdmin 
                ? 'bg-purple-950/40 text-purple-300 border-purple-500/40' 
                : 'bg-[#FF5500]/15 text-[#FF5500] border-[#FF5500]/30'
            }`}>
              {isAdmin ? 'ADMINISTRADOR (DUEÑO)' : 'COCKPIT MOSTRADOR / OPERADOR'}
            </span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-zinc-800 text-xs font-mono text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-[#FF5500]" />
            <span className="font-semibold text-zinc-200">{currentTime}</span>
          </div>
        </div>

        {/* Centro: Métricas Clave Rápidas */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <Wrench className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-zinc-400">En Taller:</span>
            <span className="font-mono font-bold text-white">{activeOrdersCount}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">Listos a Retirar:</span>
            <span className="font-mono font-bold text-emerald-400">{readyOrdersCount}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">Dólar Blue:</span>
            <span className="font-mono font-bold text-white">${dolarRate?.toLocaleString('es-AR')}</span>
          </div>

          {/* Indicador de Conexión Servidor Central (Railway / PostgreSQL) */}
          <button
            type="button"
            onClick={() => refreshConnection?.()}
            title={serverStatus === 'online' ? '🟢 Conectado con base de datos PostgreSQL en Railway' : '🔴 Servidor no detectado. Clic para reintentar conexión'}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              serverStatus === 'online'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                : serverStatus === 'checking'
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/40 animate-pulse'
                : 'bg-rose-950/40 text-rose-300 border-rose-500/40 hover:bg-rose-900/50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              serverStatus === 'online'
                ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]'
                : serverStatus === 'checking'
                ? 'bg-amber-400'
                : 'bg-rose-500'
            }`} />
            <span>
              {serverStatus === 'online'
                ? '🟢 Conectado a Servidor Central (Railway)'
                : serverStatus === 'checking'
                ? '🟡 Verificando Servidor...'
                : '🔴 Sin Conexión (Modo Local)'}
            </span>
          </button>
        </div>

        {/* Derecha: Botón Tema + Panel Admin + Cerrar Sesión */}
        <div className="flex items-center gap-2">
          {/* Botón Tema */}
          <button
            type="button"
            onClick={togglePanelTheme}
            className="p-2 rounded-xl border text-xs font-semibold flex items-center transition-all cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700"
            title={isLight ? 'Modo Oscuro' : 'Modo Claro'}
          >
            {isLight ? <Moon className="w-3.5 h-3.5 text-amber-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          {/* Acceso a Panel Administrador */}
          <button
            type="button"
            onClick={handleOpenAdminPanel}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
              isAdmin 
                ? 'bg-purple-900/40 hover:bg-purple-900/60 border-purple-500/40 text-purple-200 shadow-sm'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
            title="Ajustes de Precios, Márgenes y Finanzas"
          >
            <Sliders className="w-3.5 h-3.5 text-[#FF5500]" />
            <span className="hidden sm:inline">{isAdmin ? 'Panel Admin' : 'Admin'}</span>
          </button>

          {/* Salir */}
          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 transition-colors cursor-pointer"
            title="Cerrar Sesión de Mostrador"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

          {/* Volver a la web pública si no es subdominio exclusivo */}
          {onClose && !isTallerSubdomain && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Web Pública</span>
            </button>
          )}
        </div>

      </header>

      {/* 2. BARRA DE ACCESOS RÁPIDOS & ATAJOS DE TECLADO (COCKPIT BAR) */}
      <div className="cockpit-shortcuts-bar bg-[#101015] border-b border-zinc-800/80 px-4 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
        
        <div className="flex items-center gap-2">
          {/* F12: NUEVA ORDEN */}
          <button
            type="button"
            onClick={() => setIsNewOrderOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#FF5500] hover:bg-[#FF6600] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)] transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Orden</span>
            <span className="px-1.5 py-0.5 rounded bg-black/25 text-[10px] font-mono font-extrabold border border-white/20">
              F12
            </span>
          </button>

          {/* F9: ÓRDENES EN TALLER */}
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'orders'
                ? 'bg-zinc-800 text-white border border-[#FF5500]/50 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-emerald-400" />
            <span>Órdenes en Taller</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-[10px] font-mono text-zinc-400 border border-zinc-700">
              F9
            </span>
          </button>

          {/* F10: VENTA / POS DE ACCESORIOS */}
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'pos'
                ? 'bg-zinc-800 text-white border border-[#FF5500]/50 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-amber-400" />
            <span>Venta / POS Accesorios</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-[10px] font-mono text-zinc-400 border border-zinc-700">
              F10
            </span>
          </button>

          {/* F11: PRESUPUESTAR & REPUESTOS */}
          <button
            type="button"
            onClick={() => setActiveTab('quote')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'quote'
                ? 'bg-zinc-800 text-white border border-[#FF5500]/50 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-orange-400" />
            <span>Presupuestar / Repuestos</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-[10px] font-mono text-zinc-400 border border-zinc-700">
              F11
            </span>
          </button>
        </div>

        {/* Acceso Rápido: Entrega de Orden con Saldo */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-400">
          <span className="text-[11px] font-mono">Entrega rápida:</span>
          {readyOrdersCount > 0 ? (
            <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 font-semibold border border-emerald-500/40">
              {readyOrdersCount} {readyOrdersCount === 1 ? 'equipo listo' : 'equipos listos'}
            </span>
          ) : (
            <span className="text-zinc-500">Sin equipos pendientes de entrega</span>
          )}
        </div>

      </div>

      {/* 3. ÁREA PRINCIPAL DE TRABAJO */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto">
        
        {/* PESTAÑA F9: ÓRDENES EN TALLER */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <RepairOrdersManager
              isEmbedded={true}
              onNewOrder={() => setIsNewOrderOpen(true)}
              onDeliverOrder={(order) => setDeliveryOrder(order)}
            />
          </div>
        )}

        {/* PESTAÑA F10: PUNTO DE VENTA (POS DE MOSTRADOR) */}
        {activeTab === 'pos' && (
          <div className="space-y-4">
            <SalesPOS />
          </div>
        )}

        {/* PESTAÑA F11: PRESUPUESTADOR & BUSCADOR DE REPUESTOS */}
        {activeTab === 'quote' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-heading font-bold text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-[#FF5500]" />
                  <span>Presupuestador de Mostrador & Repuestos</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Consulta de precios mayoristas con proveedores y cálculo de cotización al instante para clientes presenciales.
                </p>
              </div>
            </div>
            
            <PartsSearchTab />
          </div>
        )}

      </main>

      {/* 4. MODAL F12: INGRESO DE NUEVA ORDEN */}
      {isNewOrderOpen && (
        <RepairOrderReceiver 
          forceOpen={true}
          onClose={() => setIsNewOrderOpen(false)}
        />
      )}

      {/* 5. MODAL DE ENTREGA UNIFICADA CON VENTA CRUZADA */}
      {deliveryOrder && (
        <UnifiedDeliveryModal
          order={deliveryOrder}
          isOpen={Boolean(deliveryOrder)}
          onClose={() => setDeliveryOrder(null)}
          onDelivered={(orderId) => {
            setDeliveryOrder(null);
            setActiveTab('orders');
          }}
        />
      )}

      {/* 6. MODAL DE ELEVACIÓN A ADMINISTRADOR (PIN DUEÑO) */}
      {isElevateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121215] border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-purple-400 font-heading font-bold text-sm">
                <Sliders className="w-4 h-4" />
                <span>Acceso de Administrador</span>
              </div>
              <button onClick={() => setIsElevateModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Ingresa la contraseña del dueño para acceder al ajuste de precios, finanzas y analíticas.
            </p>

            <form onSubmit={handleElevateSubmit} className="space-y-3">
              <input
                type="password"
                value={elevatePin}
                onChange={(e) => setElevatePin(e.target.value)}
                placeholder="Contraseña de Administrador..."
                autoFocus
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#FF5500] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono outline-none"
              />

              {elevateError && (
                <div className="text-xs text-rose-400 font-semibold">{elevateError}</div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Acceder al Panel
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
