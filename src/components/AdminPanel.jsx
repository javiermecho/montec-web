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
  Wrench, 
  Sliders, 
  Sparkles,
  DollarSign,
  Clock,
  ShieldCheck,
  Maximize2,
  Zap
} from 'lucide-react';
import { useData } from '../context/DataContext';
import MontecLogo from './MontecLogo';
import PartsSearchTab from './admin/PartsSearchTab';

export default function AdminPanel() {
  const {
    models,
    issues,
    accessories,
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
    dolarRate
  } = useData();

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

  // 1. Pantalla de Login con PIN
  if (!isAdminAuthenticated) {
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
                  placeholder="Escribí el PIN (ej: montec2026)"
                  autoFocus
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none"
                />
              </div>
              {loginError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>PIN incorrecto. (Prueba con montec2026 o 2026)</span>
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

  // Exportar respaldo JSON
  const handleExportData = () => {
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
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0A0A0A] overflow-hidden animate-fadeIn text-zinc-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FF5500] text-white text-xs sm:text-sm font-semibold shadow-[0_0_25px_rgba(255,85,0,0.5)] animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Superior del Panel */}
      <header className="bg-[#121212] border-b border-zinc-800 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <MontecLogo size="sm" />
          <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-[#FF5500] border border-[#FF5500]/30 font-semibold">
            PANEL ADMINISTRADOR
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={logoutAdmin}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 border border-zinc-800 transition-colors"
          >
            Cerrar Sesión
          </button>
          <button
            onClick={() => setIsAdminOpen(false)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,85,0,0.4)]"
          >
            <X className="w-4 h-4" />
            <span>Volver a la Web</span>
          </button>
        </div>
      </header>

      {/* Barra de Pestañas de Navegación */}
      <div className="bg-[#121212]/70 border-b border-zinc-800/80 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto py-2 shrink-0">
        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'models' 
              ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)]' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Catálogo de Modelos ({models.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('parts_search')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'parts_search' 
              ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)]' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Search className="w-4 h-4 text-orange-400" />
          <span>Buscador de Repuestos (Proveedores)</span>
        </button>

        <button
          onClick={() => setActiveTab('iphone_lab')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'iphone_lab' 
              ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)]' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Laboratorio iPhone</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'pricing' 
              ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)]' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Márgenes Android & Fallas</span>
        </button>

        <button
          onClick={() => setActiveTab('accessories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'accessories' 
              ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)]' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Accesorios & Stock ({accessories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'settings' 
              ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)]' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Ajustes & Respaldo</span>
        </button>
      </div>

      {/* Contenido Principal de las Pestañas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        
        {/* ============================================================== */}
        {/* PESTAÑA 1: MODELOS REPARADOS */}
        {/* ============================================================== */}
        {activeTab === 'models' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-white">
                  Modelos de Celulares y Computadoras
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                  Los modelos que cargues acá aparecen instantáneamente en el buscador del cotizador de la web.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingModel(null);
                  setModelFormData({ type: 'iphone', brand: 'Apple', model: '', year: new Date().getFullYear() });
                  setIsModelModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(255,85,0,0.35)] transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Nuevo Modelo</span>
              </button>
            </div>

            {/* Filtros y Buscador */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  placeholder="Buscar modelo o marca (ej: iPhone 14, S23, Moto G, IdeaPad)..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-[#FF5500]"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {['all', 'iphone', 'android', 'notebook'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setModelTypeFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors ${
                      modelTypeFilter === cat
                        ? 'bg-zinc-800 border-[#FF5500] text-[#FF5500]'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? 'Todos' : cat === 'iphone' ? 'iPhone' : cat === 'android' ? 'Android' : 'Notebooks'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla de Modelos */}
            <div className="bg-[#121212] border border-zinc-800/80 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto max-h-[550px]">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-zinc-900/90 text-zinc-400 uppercase text-[11px] font-mono tracking-wider sticky top-0 z-10 border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Marca</th>
                      <th className="px-4 py-3">Modelo</th>
                      <th className="px-4 py-3">Año / Gen</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredModelsList.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            m.type === 'iphone' ? 'bg-orange-500/20 text-orange-400' :
                            m.type === 'android' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {m.type === 'iphone' ? 'iPhone' : m.type === 'android' ? 'Android' : 'Notebook'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                          {m.brand}
                        </td>
                        <td className="px-4 py-3 text-zinc-200">
                          {m.model}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 font-mono">
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
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
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
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400"
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
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
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
                  const cfg = iphoneConfigs[m.id] || {
                    screenLabor: { compatible_unknown: 30000, ic_transplant: 55000, original_used: 42000 },
                    batteryLabor: { standard_unknown: 25000, bms_transplant: 48000, original_used: 32000 }
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
                            Año {m.year || '2020+'} • Microelectrónica Serializada
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
                            <span>Mano de Obra Pantalla / Módulo</span>
                          </span>
                          <span className="text-[10px] text-zinc-500">Mano de Obra neta en ARS</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                            <label className="block text-[10px] text-zinc-300 mb-1 font-semibold truncate" title="Compatible Premium (Aviso Desconocido)">
                              1. Compatible (Aviso)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">$</span>
                              <input
                                type="number"
                                step="1000"
                                value={cfg.screenLabor?.compatible_unknown || 30000}
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
                            <span className="text-[9px] text-zinc-500 block mt-1">Con alerta en iOS</span>
                          </div>

                          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                            <label className="block text-[10px] text-amber-300 mb-1 font-semibold truncate" title="Sin Aviso / Trasplante IC">
                              2. Trasplante IC
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
                            <span className="text-[9px] text-amber-400/80 block mt-1">Sin aviso / TrueTone</span>
                          </div>

                          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                            <label className="block text-[10px] text-emerald-400 mb-1 font-semibold truncate" title="Original Segunda Mano">
                              3. Original 2da Mano
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">$</span>
                              <input
                                type="number"
                                step="1000"
                                value={cfg.screenLabor?.original_used || 42000}
                                onChange={(e) => {
                                  updateIphoneConfig(m.id, {
                                    screenLabor: {
                                      ...(cfg.screenLabor || {}),
                                      original_used: Number(e.target.value)
                                    }
                                  });
                                }}
                                className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-[#FF5500] rounded-lg pl-6 pr-2 py-1 text-white font-mono text-xs outline-none"
                              />
                            </div>
                            <span className="text-[9px] text-emerald-400/80 block mt-1">Pieza desarme Apple</span>
                          </div>
                        </div>
                      </div>

                      {/* Configuración Batería */}
                      <div className="space-y-2.5 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/70">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" />
                            <span>Mano de Obra Batería</span>
                          </span>
                          <span className="text-[10px] text-zinc-500">Mano de Obra neta en ARS</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                            <label className="block text-[10px] text-zinc-300 mb-1 font-semibold truncate" title="Cambio Estándar (Aviso Desconocido)">
                              1. Estándar (Aviso)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">$</span>
                              <input
                                type="number"
                                step="1000"
                                value={cfg.batteryLabor?.standard_unknown || 25000}
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
                            <span className="text-[9px] text-zinc-500 block mt-1">Sin % de condición</span>
                          </div>

                          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                            <label className="block text-[10px] text-amber-300 mb-1 font-semibold truncate" title="Mantener Condición 100% (Trasplante BMS)">
                              2. Trasplante BMS
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
                            <span className="text-[9px] text-amber-400/80 block mt-1">100% Salud / Sin alerta</span>
                          </div>

                          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                            <label className="block text-[10px] text-emerald-400 mb-1 font-semibold truncate" title="Original Segunda Mano">
                              3. Original 2da Mano
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">$</span>
                              <input
                                type="number"
                                step="1000"
                                value={cfg.batteryLabor?.original_used || 32000}
                                onChange={(e) => {
                                  updateIphoneConfig(m.id, {
                                    batteryLabor: {
                                      ...(cfg.batteryLabor || {}),
                                      original_used: Number(e.target.value)
                                    }
                                  });
                                }}
                                className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-[#FF5500] rounded-lg pl-6 pr-2 py-1 text-white font-mono text-xs outline-none"
                              />
                            </div>
                            <span className="text-[9px] text-emerald-400/80 block mt-1">Batería original &gt;85%</span>
                          </div>
                        </div>
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
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold transition-colors"
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
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-black font-bold text-xs transition-all shadow-[0_0_15px_rgba(255,85,0,0.35)]"
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
        {/* PESTAÑA 3: ACCESORIOS & PRODUCTOS */}
        {/* ============================================================== */}
        {activeTab === 'accessories' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-white">
                  Productos y Accesorios en Venta
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                  Cargadores, cables reforzados, hidrogel a medida, fundas y audio disponibles en el local de Montes Carballo 943.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingAccessory(null);
                  setAccFormData({ category: 'Cargadores', name: '', compatible: '', price: 15000, badge: 'Disponible', features: '' });
                  setIsAccessoryModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(255,85,0,0.35)] transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Nuevo Accesorio</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {accessories.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-[#121212] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FF5500]/20 text-[#FF5500] font-mono">
                        {acc.category}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {acc.badge}
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-base text-white line-clamp-1 mb-1">
                      {acc.name}
                    </h4>
                    <p className="text-xs text-zinc-400 line-clamp-1 mb-3">
                      {acc.compatible}
                    </p>

                    <div className="text-xs text-zinc-500 mb-2">Precio de Venta Local:</div>
                    <div className="relative mb-3">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                      <input
                        type="number"
                        value={acc.price}
                        onChange={(e) => {
                          updateAccessory(acc.id, { price: e.target.value });
                          showToast(`Precio de ${acc.name} actualizado`);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FF5500] rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setEditingAccessory(acc);
                        setAccFormData({
                          category: acc.category,
                          name: acc.name,
                          compatible: acc.compatible,
                          price: acc.price,
                          badge: acc.badge,
                          features: Array.isArray(acc.features) ? acc.features.join('\n') : (acc.features || '')
                        });
                        setIsAccessoryModalOpen(true);
                      }}
                      className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 font-semibold"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar detalles</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar producto "${acc.name}"?`)) {
                          deleteAccessory(acc.id);
                          showToast(`Producto eliminado`);
                        }
                      }}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 4: AJUSTES Y RESPALDO */}
        {/* ============================================================== */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-white">
                Copia de Seguridad y Configuración
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Guardá una copia de todos los precios y modelos modificados o restablecé los valores originales de fábrica.
              </p>
            </div>

            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 space-y-5">
              <div>
                <h4 className="font-heading font-bold text-base text-white mb-1">
                  Exportar Datos a JSON
                </h4>
                <p className="text-xs text-zinc-400 mb-3">
                  Descargá un archivo .json con todos los modelos ({models.length}), precios y accesorios configurados en este navegador.
                </p>
                <button
                  onClick={handleExportData}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors"
                >
                  <Download className="w-4 h-4 text-[#FF5500]" />
                  <span>Descargar Respaldo JSON</span>
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
