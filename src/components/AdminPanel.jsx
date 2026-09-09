import React, { useState } from 'react';
import {
  X,
  Lock,
  Key,
  Smartphone,
  Cpu,
  Laptop,
  Plus,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  Search,
  Check,
  AlertCircle,
  Download,
  ShoppingBag,
  ShoppingCart,
  Boxes,
  Wrench,
  Sliders,
  Sparkles,
  DollarSign,
  Clock,
  ShieldCheck,
  Maximize2,
  Zap,
  BarChart3,
  ClipboardList,
  Sun,
  Moon,
  Store
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { getIphoneGenerationInfo } from '../data/iphonePricingData';
import MontecLogo from './MontecLogo';
import PartsSearchTab from './admin/PartsSearchTab';
import AnalyticsTab from './admin/AnalyticsTab';
import RepairOrdersManager from './taller/RepairOrdersManager';
import SalesPOS from './pos/SalesPOS';
import InventoryManager from './inventory/InventoryManager';

export default function AdminPanel() {
  const {
    models,
    issues,
    accessories,
    inventory,
    isAdminAuthenticated,
    isAdminOpen,
    setIsAdminOpen,
    loginAdmin,
    logoutAdmin,
    addModel,
    updateModel,
    deleteModel,
    updateIssuePrices,
    updateIssueMeta,
    addAccessory,
    updateAccessory,
    deleteAccessory,
    resetToDefaults,
    pricingRules,
    updatePricingRules,
    resetPricingRules,
    iphoneConfigs,
    updateIphoneConfig,
    resetIphoneConfigs,
    dolarRate,
    orders,
    panelTheme,
    togglePanelTheme,
    setIsTallerOpen,
    triggerManualBackup,
    serverStatus
  } = useData();

  const { isAdmin, currentUser, logout, isTallerSubdomain } = useAuth();
  const effectiveIsAdmin = isAdminAuthenticated || isAdmin || currentUser?.role === 'admin';

  const isLight = panelTheme === 'light';

  // Estados de interfaz
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [activeTab, setActiveTab] = useState('models'); // 'models', 'parts_search', 'iphone_lab', 'pricing', 'accessories', 'settings'
  const [toastMessage, setToastMessage] = useState(null);

  // Estados para filtro y modales
  const [modelSearch, setModelSearch] = useState('');
  const [modelTypeFilter, setModelTypeFilter] = useState('all');
  const [iphoneSearch, setIphoneSearch] = useState('');

  // Formulario local de reglas de márgenes comerciales
  const [rulesForm, setRulesForm] = useState(() => ({
    minLaborArs: pricingRules?.minLaborArs || 30000,
    maxMarginArs: pricingRules?.maxMarginArs || 80000,
    markupMultiplier: pricingRules?.markupMultiplier || 2.0
  }));

  React.useEffect(() => {
    if (pricingRules) {
      setRulesForm({
        minLaborArs: pricingRules.minLaborArs || 30000,
        maxMarginArs: pricingRules.maxMarginArs || 80000,
        markupMultiplier: pricingRules.markupMultiplier || 2.0
      });
    }
  }, [pricingRules]);

  // Modal para agregar/editar modelo
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [modelFormData, setModelFormData] = useState({
    type: 'iphone',
    brand: 'Apple',
    model: '',
    year: new Date().getFullYear()
  });

  // Modal para agregar/editar accesorio
  const [isAccessoryModalOpen, setIsAccessoryModalOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState(null);
  const [accFormData, setAccFormData] = useState({
    category: 'Cargadores',
    name: '',
    compatible: '',
    price: 15000,
    badge: 'Disponible',
    features: ''
  });

  // Mostrar alerta toast temporal
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!isAdminOpen) return null;

  // 1. Pantalla de Login con PIN (solo si no está autenticado como administrador)
  if (!effectiveIsAdmin) {
    const handleLoginSubmit = (e) => {
      e.preventDefault();
      if (loginAdmin(pinInput.trim())) {
        setPinInput('');
        setLoginError(false);
        showToast('Acceso concedido al panel técnico');
      } else {
        setLoginError(true);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
        <div className="bg-[#141414] border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_40px_rgba(255,85,0,0.25)] relative">

          <button
            onClick={() => setIsAdminOpen(false)}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(255,85,0,0.3)]">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-heading font-bold text-white">
              Acceso al Panel Técnico
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Ingresá tu clave PIN para gestionar modelos, cotizaciones y precios de repuestos.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Clave PIN de Administrador
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setLoginError(false);
                  }}
                  placeholder="Ingresá la clave de Administrador..."
                  autoFocus
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none"
                />
              </div>
              {loginError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Clave incorrecta. Verificá los caracteres ingresados.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white font-heading font-bold text-sm shadow-[0_0_20px_rgba(255,85,0,0.4)] transition-all"
            >
              Ingresar al Panel
            </button>
          </form>

          <div className="text-center mt-4 text-[11px] text-zinc-500">
            montec • Servicio Técnico Especializado Mar del Plata
          </div>
        </div>
      </div>
    );
  }

  // 2. Panel Administrador Principal
  const filteredModelsList = models.filter(m => {
    const matchType = modelTypeFilter === 'all' || m.type === modelTypeFilter;
    const matchSearch = modelSearch.trim() === '' ||
      m.model.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.brand.toLowerCase().includes(modelSearch.toLowerCase());
    return matchType && matchSearch;
  });

  // Manejo de guardado de modelo
  const handleSaveModel = (e) => {
    e.preventDefault();
    if (!modelFormData.model.trim()) return;

    if (editingModel) {
      updateModel(editingModel.id, modelFormData);
      showToast(`Modelo "${modelFormData.model}" actualizado.`);
    } else {
      addModel(modelFormData);
      showToast(`Nuevo modelo "${modelFormData.model}" agregado.`);
    }

    setIsModelModalOpen(false);
    setEditingModel(null);
    setModelFormData({ type: 'iphone', brand: 'Apple', model: '', year: new Date().getFullYear() });
  };

  // Manejo de guardado de accesorio
  const handleSaveAccessory = (e) => {
    e.preventDefault();
    if (!accFormData.name.trim()) return;

    if (editingAccessory) {
      updateAccessory(editingAccessory.id, accFormData);
      showToast(`Accesorio "${accFormData.name}" actualizado.`);
    } else {
      addAccessory(accFormData);
      showToast(`Nuevo accesorio "${accFormData.name}" agregado.`);
    }

    setIsAccessoryModalOpen(false);
    setEditingAccessory(null);
    setAccFormData({ category: 'Cargadores', name: '', compatible: '', price: 15000, badge: 'Disponible', features: '' });
  };

  // Exportar respaldo en la nube y archivo JSON
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleExportData = async () => {
    setIsBackingUp(true);
    showToast('Respaldando modelos, fallas y órdenes en PostgreSQL (Railway)...');
    try {
      if (typeof triggerManualBackup === 'function') {
        const res = await triggerManualBackup();
        if (res.success) {
          showToast('✅ Respaldo completo guardado en PostgreSQL y descargado.');
        } else {
          showToast('⚠️ Datos guardados localmente: ' + (res.error || ''));
        }
      } else {
        const backup = {
          exportedAt: new Date().toISOString(),
          models,
          issues,
          accessories
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `montec_datos_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        showToast('Copia de seguridad descargada en JSON.');
      }
    } catch (e) {
      showToast('Error al generar backup: ' + e.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col overflow-hidden animate-fadeIn transition-colors ${isLight ? 'montec-panel-light' : 'bg-[#0A0A0A] text-zinc-200'
      }`}>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FF5500] text-white text-xs sm:text-sm font-semibold shadow-[0_0_25px_rgba(255,85,0,0.5)] animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Superior del Panel - Siempre oscuro para preservar el logo Montec */}
      <header className="panel-top-header bg-[#09090b] border-b border-zinc-800 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <MontecLogo size="sm" />
          <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 text-[#FF5500] border border-[#FF5500]/30 font-semibold">
            PANEL ADMINISTRADOR
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botón Minimalista de Tema Claro / Oscuro - Estilizado para armonizar con el header oscuro */}
          <button
            type="button"
            onClick={togglePanelTheme}
            className="p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700"
            title={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {isLight ? (
              <>
                <Moon className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline text-xs">Modo Oscuro</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline text-xs">Modo Claro</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              logoutAdmin();
              if (typeof logout === 'function') logout();
              setIsAdminOpen(false);
            }}
            className="px-3.5 py-1.5 text-xs text-zinc-200 hover:text-white rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 transition-colors font-semibold cursor-pointer"
          >
            Cerrar Sesión
          </button>
          <button
            onClick={() => {
              sessionStorage.setItem('montec_taller_view_preference', 'mostrador');
              setIsAdminOpen(false);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,85,0,0.4)] cursor-pointer"
            title={isTallerSubdomain ? 'Ir al Mostrador / Operaciones de Taller' : 'Volver a la Web'}
          >
            <Store className="w-4 h-4" />
            <span>{isTallerSubdomain ? 'Ir al Mostrador' : 'Volver a la Web'}</span>
          </button>
        </div>
      </header>

      {/* Barra de Pestañas de Navegación - Siempre oscura y coordinada */}
      <div className="admin-tabs-bar bg-[#0f0f12] border-b border-zinc-800/80 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto py-2 shrink-0">
        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'models'
              ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
        >
          <Smartphone className="w-4 h-4" />
          <span> Modelos ({models.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'orders'
              ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
        >
          <ClipboardList className="w-4 h-4 text-emerald-400" />
          <span>Órdenes ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('parts_search')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'parts_search'
              ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
        >
          <Search className="w-4 h-4 text-orange-400" />
          <span>Buscar Repuestos </span>
        </button>

        <button
          onClick={() => setActiveTab('iphone_lab')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'iphone_lab'
              ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span> Costo iPhone</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'pricing'
              ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
        >
          <Wrench className="w-4 h-4" />
          <span> Costo Android </span>
        </button>


        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'inventory' || activeTab === 'accessories'
              ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
        >
          <Boxes className="w-4 h-4 text-purple-400" />
          <span>Inventario ({inventory?.length || accessories?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'analytics'
              ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>Google Analytic </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'settings'
              ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Ajustes</span>
        </button>
      </div>

      {/* Contenido Principal de las Pestañas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">

        {/* ============================================================== */}
        {/* PESTAÑA: GESTIÓN INTEGRAL DE ÓRDENES DE TALLER                 */}
        {/* ============================================================== */}
        {activeTab === 'orders' && (
          <RepairOrdersManager
            isEmbedded={true}
            onNewOrder={() => setIsTallerOpen(true)}
            onClose={() => setActiveTab('models')}
          />
        )}

        {/* ============================================================== */}
        {/* PESTAÑA: PUNTO DE VENTA (POS DE MOSTRADOR)                     */}
        {/* ============================================================== */}
        {activeTab === 'pos' && (
          <SalesPOS />
        )}

        {/* ============================================================== */}
        {/* PESTAÑA: MODELOS REPARADOS */}
        {/* ============================================================== */}
        {activeTab === 'models' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className={`text-xl sm:text-2xl font-heading font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Modelos de Celulares y Computadoras
                </h2>
                <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                  Los modelos que cargues acá aparecen instantáneamente en el buscador del cotizador de la web.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingModel(null);
                  setModelFormData({ type: 'iphone', brand: 'Apple', model: '', year: new Date().getFullYear() });
                  setIsModelModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(255,85,0,0.35)] transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Nuevo Modelo</span>
              </button>
            </div>

            {/* Filtros y Buscador */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
                <input
                  type="text"
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  placeholder="Buscar modelo o marca (ej: iPhone 14, S23, Moto G, IdeaPad)..."
                  className={`w-full border rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm outline-none focus:border-[#FF5500] ${isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500'
                    }`}
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {['all', 'iphone', 'android', 'notebook'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setModelTypeFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${modelTypeFilter === cat
                        ? (isLight ? 'bg-orange-100 border-[#FF5500] text-[#FF5500]' : 'bg-zinc-800 border-[#FF5500] text-[#FF5500]')
                        : (isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white')
                      }`}
                  >
                    {cat === 'all' ? 'Todos' : cat === 'iphone' ? 'iPhone' : cat === 'android' ? 'Android' : 'Notebooks'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla de Modelos */}
            <div className={`border rounded-2xl overflow-hidden shadow-xs transition-colors ${isLight ? 'bg-white border-slate-200' : 'bg-[#121212] border-zinc-800/80'
              }`}>
              <div className="overflow-x-auto max-h-[550px]">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className={`uppercase text-[11px] font-mono tracking-wider sticky top-0 z-10 border-b ${isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-zinc-900/90 text-zinc-400 border-zinc-800'
                    }`}>
                    <tr>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Marca</th>
                      <th className="px-4 py-3">Modelo</th>
                      <th className="px-4 py-3">Año / Gen</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-zinc-800/60'}`}>
                    {filteredModelsList.map((m) => (
                      <tr key={m.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-900/40'}`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${m.type === 'iphone' ? (isLight ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/20 text-orange-400') :
                              m.type === 'android' ? (isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400') :
                                (isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400')
                            }`}>
                            {m.type === 'iphone' ? 'iPhone' : m.type === 'android' ? 'Android' : 'Notebook'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-semibold whitespace-nowrap ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {m.brand}
                        </td>
                        <td className={`px-4 py-3 ${isLight ? 'text-slate-700' : 'text-zinc-200'}`}>
                          {m.model}
                        </td>
                        <td className={`px-4 py-3 font-mono ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                          {m.year || '-'}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingModel(m);
                                setModelFormData({
                                  type: m.type,
                                  brand: m.brand,
                                  model: m.model,
                                  year: m.year || new Date().getFullYear()
                                });
                                setIsModelModalOpen(true);
                              }}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isLight
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                                }`}
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Seguro que deseas eliminar el modelo "${m.model}"?`)) {
                                  deleteModel(m.id);
                                  showToast(`Modelo eliminado.`);
                                }
                              }}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isLight
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                                  : 'bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400'
                                }`}
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA: LABORATORIO IPHONE & MICROELECTRÓNICA */}
        {/* ============================================================== */}
        {activeTab === 'iphone_lab' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-white">
                    Laboratorio iPhone & Microelectrónica
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/40 text-xs font-mono font-bold">
                    {models.filter(m => m.type === 'iphone').length} Modelos
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl">
                  Configuración manual de mano de obra por modelo para <strong>Pantallas</strong> (Compatible con aviso vs Trasplante de IC sin aviso vs Original) y <strong>Baterías</strong> (Estándar vs Trasplante de BMS para mantener 100% condición vs Original).
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('¿Restablecer la mano de obra sugerida de laboratorio para todos los iPhone?')) {
                      resetIphoneConfigs();
                      showToast('Valores sugeridos de iPhone restaurados.');
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white'
                    }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>Restaurar Sugeridos</span>
                </button>
              </div>
            </div>

            {/* Buscador de iPhone */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={iphoneSearch}
                onChange={(e) => setIphoneSearch(e.target.value)}
                placeholder="Buscar modelo de iPhone (ej: 11, 12 Pro, 13, 14 Pro Max, 15, SE)..."
                className="w-full bg-[#121212] border border-zinc-800 focus:border-[#FF5500] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
              {iphoneSearch && (
                <button
                  type="button"
                  onClick={() => setIphoneSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Lista de Modelos de iPhone */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {models
                .filter(m => m.type === 'iphone' && (
                  !iphoneSearch.trim() ||
                  m.model.toLowerCase().includes(iphoneSearch.toLowerCase())
                ))
                .map((m) => {
                  const genInfo = getIphoneGenerationInfo(m.model);
                  const cfg = iphoneConfigs[m.id] || {
                    screenLabor: { compatible_unknown: 32000, ic_transplant: 55000, screen_incell_oled_premium: 30000 },
                    batteryLabor: { standard_unknown: 28000, bms_transplant: 48000, battery_standard_100: 25000 }
                  };

                  return (
                    <div
                      key={m.id}
                      className="bg-[#121212] border border-zinc-800/90 hover:border-zinc-700/80 rounded-2xl p-5 shadow-lg space-y-4 transition-all"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono font-bold">
                              Apple
                            </span>
                            <h3 className="text-base font-heading font-bold text-white">
                              {m.model}
                            </h3>
                          </div>
                          <span className="text-[11px] text-zinc-500 mt-0.5 block">
                            Año {m.year || '2020+'} • {genInfo.hasBackGlass ? 'Vidrio Trasero Láser' : 'Chasis Aluminio Monobloque'}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                          ID: {m.id.slice(0, 16)}...
                        </span>
                      </div>

                      {/* Configuración Pantalla / Módulo */}
                      <div className="space-y-2.5 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/70">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Mano de Obra Pantalla ({genInfo.isScreenBefore11 ? 'Pre-11: True Tone' : '11+: Opciones 1 y 2'})</span>
                          </span>
                          <span className="text-[10px] text-zinc-500">Mano de Obra neta en ARS</span>
                        </div>

                        {genInfo.isScreenBefore11 ? (
                          <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
                            <label className="block text-[10px] text-zinc-300 mb-1 font-semibold truncate" title="Módulo Calidad Premium">
                              Módulo Calidad Premium (True Tone Incluido)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">$</span>
                              <input
                                type="number"
                                step="1000"
                                value={cfg.screenLabor?.screen_premium || cfg.screenLabor?.screen_incell_oled_premium || cfg.screenLabor?.compatible_unknown || 30000}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  updateIphoneConfig(m.id, {
                                    screenLabor: {
                                      ...(cfg.screenLabor || {}),
                                      screen_premium: val,
                                      screen_incell_oled_premium: val
                                    }
                                  });
                                }}
                                className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-[#FF5500] rounded-lg pl-6 pr-2 py-1 text-white font-mono text-xs outline-none"
                              />
                            </div>
                            <span className="text-[9px] text-zinc-500 block mt-1">Reprogramación True Tone de fábrica sin bloqueos</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                              <label className="block text-[10px] text-zinc-300 mb-1 font-semibold truncate" title="Opción 1: Módulo Premium (Aviso iOS)">
                                Opción 1: Premium (Aviso iOS)
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">$</span>
                                <input
                                  type="number"
                                  step="1000"
                                  value={cfg.screenLabor?.compatible_unknown || 32000}
                                  onChange={(e) => {
                                    updateIphoneConfig(m.id, {
                                      screenLabor: {
                                        ...(cfg.screenLabor || {}),
                                        compatible_unknown: Number(e.target.value)
                                      }
                                    });
                                  }}
                                  className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-[#FF5500] rounded-lg pl-6 pr-2 py-1 text-white font-mono text-xs outline-none"
                                />
                              </div>
                              <span className="text-[9px] text-zinc-500 block mt-1">Mantiene True Tone (con alerta)</span>
                            </div>

                            <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                              <label className="block text-[10px] text-amber-300 mb-1 font-semibold truncate" title="Opción 2: Calidad Original con Trasplante IC">
                                Opción 2: Trasplante IC (Sin Aviso)
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">$</span>
                                <input
                                  type="number"
                                  step="1000"
                                  value={cfg.screenLabor?.ic_transplant || 55000}
                                  onChange={(e) => {
                                    updateIphoneConfig(m.id, {
                                      screenLabor: {
                                        ...(cfg.screenLabor || {}),
                                        ic_transplant: Number(e.target.value)
                                      }
                                    });
                                  }}
                                  className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-[#FF5500] rounded-lg pl-6 pr-2 py-1 text-white font-mono text-xs outline-none"
                                />
                              </div>
                              <span className="text-[9px] text-amber-400/80 block mt-1">Laboratorio microelectrónica</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Configuración Batería */}
                      <div className="space-y-2.5 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/70">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" />
                            <span>Mano de Obra Batería ({genInfo.isBatteryWithoutBmsLock ? 'Pre-XS: 100% Automático' : 'XS+: Opciones 1 y 2'})</span>
                          </span>
                          <span className="text-[10px] text-zinc-500">Mano de Obra neta en ARS</span>
                        </div>

                        {genInfo.isBatteryWithoutBmsLock ? (
                          <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
                            <label className="block text-[10px] text-zinc-300 mb-1 font-semibold truncate" title="Batería Calidad Original (Condición 100% Automática)">
                              Cambio de Batería (Calidad Original - 100% Automático)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">$</span>
                              <input
                                type="number"
                                step="1000"
                                value={cfg.batteryLabor?.battery_standard_100 || cfg.batteryLabor?.standard_unknown || 25000}
                                onChange={(e) => {
                                  updateIphoneConfig(m.id, {
                                    batteryLabor: {
                                      ...(cfg.batteryLabor || {}),
                                      battery_standard_100: Number(e.target.value)
                                    }
                                  });
                                }}
                                className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-[#FF5500] rounded-lg pl-6 pr-2 py-1 text-white font-mono text-xs outline-none"
                              />
                            </div>
                            <span className="text-[9px] text-emerald-400/80 block mt-1">Indica 100% sin requerir reprogramación</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                              <label className="block text-[10px] text-zinc-300 mb-1 font-semibold truncate" title="Opción 1: Batería Premium (Rápido / Económico)">
                                Opción 1: Premium (Sin %)
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">$</span>
                                <input
                                  type="number"
                                  step="1000"
                                  value={cfg.batteryLabor?.standard_unknown || 28000}
                                  onChange={(e) => {
                                    updateIphoneConfig(m.id, {
                                      batteryLabor: {
                                        ...(cfg.batteryLabor || {}),
                                        standard_unknown: Number(e.target.value)
                                      }
                                    });
                                  }}
                                  className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-[#FF5500] rounded-lg pl-6 pr-2 py-1 text-white font-mono text-xs outline-none"
                                />
                              </div>
                              <span className="text-[9px] text-zinc-500 block mt-1">Rápido / Económico (Aviso en iOS)</span>
                            </div>

                            <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                              <label className="block text-[10px] text-amber-300 mb-1 font-semibold truncate" title="Opción 2: Traspaso de Flex & Reprogramación 100%">
                                Opción 2: Traspaso Flex & Reprog. 100%
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">$</span>
                                <input
                                  type="number"
                                  step="1000"
                                  value={cfg.batteryLabor?.bms_transplant || 48000}
                                  onChange={(e) => {
                                    updateIphoneConfig(m.id, {
                                      batteryLabor: {
                                        ...(cfg.batteryLabor || {}),
                                        bms_transplant: Number(e.target.value)
                                      }
                                    });
                                  }}
                                  className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-[#FF5500] rounded-lg pl-6 pr-2 py-1 text-white font-mono text-xs outline-none"
                                />
                              </div>
                              <span className="text-[9px] text-amber-400/80 block mt-1">Conserva flex original Apple al 100%</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Configuración Reparación en Placa */}
                      <div className="space-y-2 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/70">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5" />
                            <span>Reparación en Placa (Audio, Señal, Mojado, Cortos, Face ID)</span>
                          </span>
                          <span className="text-[11px] font-mono font-bold text-white bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                            Total: ${Math.round(((Number(cfg.guildPlacaUsd || 75) + Number(cfg.montecMarginUsd || 40)) * (dolarRate || 1545)) / 1000 * 1000).toLocaleString('es-AR')} ARS
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                            <label className="block text-[10px] text-zinc-300 mb-1 font-semibold">
                              Costo Gremio Placa (USD)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">USD $</span>
                              <input
                                type="number"
                                step="5"
                                value={cfg.guildPlacaUsd || 75}
                                onChange={(e) => {
                                  updateIphoneConfig(m.id, {
                                    guildPlacaUsd: Number(e.target.value)
                                  });
                                }}
                                className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-[#FF5500] rounded-lg pl-14 pr-2 py-1 text-white font-mono text-xs outline-none"
                              />
                            </div>
                            <span className="text-[9px] text-zinc-500 block mt-1">Costo mano de obra iLab</span>
                          </div>

                          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                            <label className="block text-[10px] text-amber-300 mb-1 font-semibold">
                              Ganancia Montec (USD)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">USD $</span>
                              <input
                                type="number"
                                step="5"
                                value={cfg.montecMarginUsd || 40}
                                onChange={(e) => {
                                  updateIphoneConfig(m.id, {
                                    montecMarginUsd: Number(e.target.value)
                                  });
                                }}
                                className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-[#FF5500] rounded-lg pl-14 pr-2 py-1 text-white font-mono text-xs outline-none"
                              />
                            </div>
                            <span className="text-[9px] text-amber-400/80 block mt-1">Margen calibrado ($30 a $100 USD)</span>
                          </div>
                        </div>
                      </div>

                      {/* Configuración Cambio de Tapa Trasera */}
                      <div className="space-y-2 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/70">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Cambio de Tapa Trasera (Glass Láser)</span>
                          </span>
                          <span className="text-[11px] font-mono font-bold text-white bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                            Total: ${Math.round(((Number(cfg.guildTapaUsd || 40) + Number(cfg.montecMarginUsd || 40)) * (dolarRate || 1545)) / 1000 * 1000).toLocaleString('es-AR')} ARS
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                            <label className="block text-[10px] text-zinc-300 mb-1 font-semibold">
                              Costo Gremio Tapa (USD)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">USD $</span>
                              <input
                                type="number"
                                step="5"
                                value={cfg.guildTapaUsd || 40}
                                onChange={(e) => {
                                  updateIphoneConfig(m.id, {
                                    guildTapaUsd: Number(e.target.value)
                                  });
                                }}
                                className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-[#FF5500] rounded-lg pl-14 pr-2 py-1 text-white font-mono text-xs outline-none"
                              />
                            </div>
                            <span className="text-[9px] text-zinc-500 block mt-1">Costo con remoción láser</span>
                          </div>

                          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                            <label className="block text-[10px] text-amber-300 mb-1 font-semibold">
                              Ganancia Montec (USD)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">USD $</span>
                              <input
                                type="number"
                                step="5"
                                value={cfg.montecMarginUsd || 40}
                                onChange={(e) => {
                                  updateIphoneConfig(m.id, {
                                    montecMarginUsd: Number(e.target.value)
                                  });
                                }}
                                className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-[#FF5500] rounded-lg pl-14 pr-2 py-1 text-white font-mono text-xs outline-none"
                              />
                            </div>
                            <span className="text-[9px] text-amber-400/80 block mt-1">Margen calibrado ($30 a $100 USD)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 2: PRECIOS DE REPARACIONES Y FALLAS */}
        {/* ============================================================== */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-white">
                Márgenes Comerciales & Fallas de Reparación
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Ajustá las reglas de margen para repuestos de Android/General y los rangos de precios de fallas del taller.
              </p>
            </div>

            {/* Card de Reglas Comerciales para Android y Repuestos */}
            <div className="bg-[#121212] border-2 border-[#FF5500]/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500] animate-pulse"></span>
                    <h3 className="text-base sm:text-lg font-heading font-bold text-white">
                      Reglas de Ganancia para Repuestos (Android & General)
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Estas reglas calculan en tiempo real los presupuestos de módulos a partir del costo en Dólar Blue.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetPricingRules();
                    showToast('Reglas restablecidas a los valores de Montec ($30k / $80k / x2)');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white'
                    }`}
                >
                  Restaurar Predeterminados
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Mano de Obra Mínima ($ ARS)
                  </label>
                  <p className="text-[11px] text-zinc-500 mb-1.5">
                    Piso de ganancia asegurado en cualquier módulo económico.
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                    <input
                      type="number"
                      step="1000"
                      value={rulesForm.minLaborArs}
                      onChange={(e) => setRulesForm(prev => ({ ...prev, minLaborArs: Number(e.target.value) }))}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#FF5500] rounded-xl pl-7 pr-3 py-2 text-white font-mono text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Ganancia Máxima Gama Alta ($ ARS)
                  </label>
                  <p className="text-[11px] text-zinc-500 mb-1.5">
                    Tope de ganancia sobre el repuesto en equipos costosos.
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                    <input
                      type="number"
                      step="1000"
                      value={rulesForm.maxMarginArs}
                      onChange={(e) => setRulesForm(prev => ({ ...prev, maxMarginArs: Number(e.target.value) }))}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#FF5500] rounded-xl pl-7 pr-3 py-2 text-white font-mono text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Multiplicador Comercial (Cobrar x)
                  </label>
                  <p className="text-[11px] text-zinc-500 mb-1.5">
                    Multiplicador sobre costo en gama media (ej: 2.0x cobra el doble).
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">x</span>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="4"
                      value={rulesForm.markupMultiplier}
                      onChange={(e) => setRulesForm(prev => ({ ...prev, markupMultiplier: Number(e.target.value) }))}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#FF5500] rounded-xl pl-7 pr-3 py-2 text-white font-mono text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    updatePricingRules(rulesForm);
                    showToast('Reglas de márgenes comerciales actualizadas con éxito');
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(255,85,0,0.35)]"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Reglas de Márgenes</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="bg-[#121212] border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono uppercase text-[#FF5500] font-bold">
                        {issue.badge}
                      </span>
                      <h3 className="text-lg font-heading font-bold text-white">
                        {issue.name}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {issue.description}
                      </p>
                    </div>
                  </div>

                  {/* Campos de Tiempos y Garantía */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-[#FF5500]" />
                        <span>Tiempo estimado de taller</span>
                      </label>
                      <input
                        type="text"
                        value={issue.duration}
                        onChange={(e) => updateIssueMeta(issue.id, { duration: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700/80 focus:border-[#FF5500] rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1 flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Garantía montec</span>
                      </label>
                      <input
                        type="text"
                        value={issue.warranty}
                        onChange={(e) => updateIssueMeta(issue.id, { warranty: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700/80 focus:border-[#FF5500] rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Matriz de Precios por Categoría */}
                  <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Rango de Precios en ARS ($ Mínimo / $ Máximo)
                    </span>

                    {/* iPhone */}
                    <div className="flex items-center justify-between gap-3 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80 text-xs">
                      <span className="font-semibold text-orange-400 w-24 shrink-0">iPhone / Apple:</span>
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="number"
                          value={issue.basePrices?.iphone?.min || 0}
                          onChange={(e) => {
                            updateIssuePrices(issue.id, 'iphone', e.target.value, issue.basePrices?.iphone?.max);
                            showToast(`Precios actualizados para ${issue.name}`);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#FF5500] rounded-lg px-2.5 py-1 text-white font-mono"
                        />
                        <span className="text-zinc-500">a</span>
                        <input
                          type="number"
                          value={issue.basePrices?.iphone?.max || 0}
                          onChange={(e) => {
                            updateIssuePrices(issue.id, 'iphone', issue.basePrices?.iphone?.min, e.target.value);
                            showToast(`Precios actualizados para ${issue.name}`);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#FF5500] rounded-lg px-2.5 py-1 text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Android */}
                    <div className="flex items-center justify-between gap-3 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80 text-xs">
                      <span className="font-semibold text-emerald-400 w-24 shrink-0">Android:</span>
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="number"
                          value={issue.basePrices?.android?.min || 0}
                          onChange={(e) => {
                            updateIssuePrices(issue.id, 'android', e.target.value, issue.basePrices?.android?.max);
                            showToast(`Precios actualizados para ${issue.name}`);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#FF5500] rounded-lg px-2.5 py-1 text-white font-mono"
                        />
                        <span className="text-zinc-500">a</span>
                        <input
                          type="number"
                          value={issue.basePrices?.android?.max || 0}
                          onChange={(e) => {
                            updateIssuePrices(issue.id, 'android', issue.basePrices?.android?.min, e.target.value);
                            showToast(`Precios actualizados para ${issue.name}`);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#FF5500] rounded-lg px-2.5 py-1 text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Notebook */}
                    <div className="flex items-center justify-between gap-3 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80 text-xs">
                      <span className="font-semibold text-blue-400 w-24 shrink-0">Notebook:</span>
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="number"
                          value={issue.basePrices?.notebook?.min || 0}
                          onChange={(e) => {
                            updateIssuePrices(issue.id, 'notebook', e.target.value, issue.basePrices?.notebook?.max);
                            showToast(`Precios actualizados para ${issue.name}`);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#FF5500] rounded-lg px-2.5 py-1 text-white font-mono"
                        />
                        <span className="text-zinc-500">a</span>
                        <input
                          type="number"
                          value={issue.basePrices?.notebook?.max || 0}
                          onChange={(e) => {
                            updateIssuePrices(issue.id, 'notebook', issue.basePrices?.notebook?.min, e.target.value);
                            showToast(`Precios actualizados para ${issue.name}`);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#FF5500] rounded-lg px-2.5 py-1 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA: GESTIÓN DE INVENTARIO, STOCK & CATÁLOGO               */}
        {/* ============================================================== */}
        {(activeTab === 'inventory' || activeTab === 'accessories') && (
          <InventoryManager />
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 4: AJUSTES Y RESPALDO */}
        {/* ============================================================== */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className={`text-xl sm:text-2xl font-heading font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Copia de Seguridad y Configuración
              </h2>
              <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Guardá una copia de todos los precios y modelos modificados o restablecé los valores originales de fábrica.
              </p>
            </div>

            <div className={`border rounded-2xl p-6 space-y-5 ${isLight ? 'bg-white border-slate-200' : 'bg-[#121212] border-zinc-800'}`}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-heading font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Respaldo en la Nube (PostgreSQL en Railway) & Descarga JSON
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${serverStatus === 'online'
                      ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-950/50 text-amber-300 border-amber-500/40'
                    }`}>
                    {serverStatus === 'online' ? '🟢 PostgreSQL Sincronizado' : '🟡 Modo Local'}
                  </span>
                </div>
                <p className={`text-xs mb-3 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Sincroniza todos los modelos soportados ({models.length}), precios de reparación, fallas, inventario y órdenes en tu base de datos de Railway y descarga un snapshot completo en archivo .json.
                </p>
                <button
                  onClick={handleExportData}
                  disabled={isBackingUp}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isBackingUp ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.01]'
                    } ${isLight
                      ? 'bg-[#FF5500] text-white hover:bg-[#E64D00] shadow-sm'
                      : 'bg-gradient-to-r from-[#FF5500] to-[#E64D00] hover:from-[#FF6600] hover:to-[#FF5500] text-white shadow-[0_0_20px_rgba(255,85,0,0.3)]'
                    }`}
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>{isBackingUp ? 'Generando Backup en PostgreSQL...' : 'Respaldar en la Nube y Descargar JSON'}</span>
                </button>
              </div>

              <div className="pt-5 border-t border-zinc-800">
                <h4 className="font-heading font-bold text-base text-rose-400 mb-1">
                  Restaurar Valores de Fábrica
                </h4>
                <p className="text-xs text-zinc-400 mb-3">
                  Volver a cargar el listado original de modelos y precios predeterminados de montec para Mar del Plata.
                </p>
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de restablecer todos los modelos y precios a los valores iniciales?')) {
                      resetToDefaults();
                      showToast('Valores restaurados con éxito.');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restaurar Valores Predeterminados</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA: BUSCADOR DE REPUESTOS Y PROVEEDORES */}
        {/* ============================================================== */}
        {activeTab === 'parts_search' && (
          <PartsSearchTab dolarRate={dolarRate} pricingRules={pricingRules} />
        )}

        {/* ============================================================== */}
        {/* PESTAÑA: GOOGLE ANALYTICS & MEDICIÓN DE LEADS */}
        {/* ============================================================== */}
        {activeTab === 'analytics' && (
          <AnalyticsTab />
        )}

      </div>

      {/* ============================================================== */}
      {/* MODAL PARA AGREGAR / EDITAR MODELO */}
      {/* ============================================================== */}
      {isModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#161616] border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-white">
                {editingModel ? 'Editar Modelo' : 'Nuevo Modelo a Reparar'}
              </h3>
              <button
                onClick={() => setIsModelModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Tipo de Dispositivo</label>
                <select
                  value={modelFormData.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    const defaultBrand = newType === 'iphone' ? 'Apple' : newType === 'android' ? 'Samsung' : 'Lenovo';
                    setModelFormData({ ...modelFormData, type: newType, brand: defaultBrand });
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none"
                >
                  <option value="iphone">iPhone / Apple</option>
                  <option value="android">Smartphone Android</option>
                  <option value="notebook">Notebook / Mac</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Marca</label>
                <input
                  type="text"
                  value={modelFormData.brand}
                  onChange={(e) => setModelFormData({ ...modelFormData, brand: e.target.value })}
                  placeholder="Apple, Samsung, Motorola, Lenovo, HP..."
                  required
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#FF5500]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Nombre Exacto del Modelo</label>
                <input
                  type="text"
                  value={modelFormData.model}
                  onChange={(e) => setModelFormData({ ...modelFormData, model: e.target.value })}
                  placeholder="ej: Galaxy S25 Ultra, iPhone 16 Pro, IdeaPad Slim 3"
                  required
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#FF5500]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Año de Lanzamiento</label>
                <input
                  type="number"
                  value={modelFormData.year}
                  onChange={(e) => setModelFormData({ ...modelFormData, year: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#FF5500]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModelModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs font-bold shadow-lg"
                >
                  Guardar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL PARA AGREGAR / EDITAR ACCESORIO */}
      {/* ============================================================== */}
      {isAccessoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#161616] border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-white">
                {editingAccessory ? 'Editar Accesorio' : 'Nuevo Accesorio en Venta'}
              </h3>
              <button
                onClick={() => setIsAccessoryModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccessory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Categoría</label>
                <select
                  value={accFormData.category}
                  onChange={(e) => setAccFormData({ ...accFormData, category: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none"
                >
                  <option value="Cargadores">Cargadores</option>
                  <option value="Cables">Cables</option>
                  <option value="Hidrogel">Hidrogel</option>
                  <option value="Fundas">Fundas</option>
                  <option value="Audio">Audio</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  value={accFormData.name}
                  onChange={(e) => setAccFormData({ ...accFormData, name: e.target.value })}
                  placeholder="ej: Cargador 35W Dual USB-C"
                  required
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#FF5500]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Compatibilidad</label>
                <input
                  type="text"
                  value={accFormData.compatible}
                  onChange={(e) => setAccFormData({ ...accFormData, compatible: e.target.value })}
                  placeholder="ej: iPhone 12 al 16, Galaxy S Series"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#FF5500]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Precio en ARS ($)</label>
                  <input
                    type="number"
                    value={accFormData.price}
                    onChange={(e) => setAccFormData({ ...accFormData, price: e.target.value })}
                    required
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#FF5500] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Etiqueta / Badge</label>
                  <input
                    type="text"
                    value={accFormData.badge}
                    onChange={(e) => setAccFormData({ ...accFormData, badge: e.target.value })}
                    placeholder="Más Vendido, En Stock..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#FF5500]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Características (una por línea)</label>
                <textarea
                  rows={3}
                  value={accFormData.features}
                  onChange={(e) => setAccFormData({ ...accFormData, features: e.target.value })}
                  placeholder="Carga ultra rápida&#10;Cable trenzado antirotura&#10;Garantía escrita"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#FF5500]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAccessoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs font-bold shadow-lg"
                >
                  Guardar Accesorio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
