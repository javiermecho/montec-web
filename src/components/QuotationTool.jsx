import React, { useState, useMemo, useEffect } from 'react';
import { 
  Smartphone, 
  Cpu, 
  Laptop, 
  Search, 
  Check, 
  Clock, 
  ShieldCheck, 
  MessageCircle, 
  Sparkles,
  Maximize2,
  BatteryCharging,
  Zap,
  Fan,
  HardDrive,
  Info,
  X,
  Calculator,
  Wrench,
  ArrowRight
} from 'lucide-react';
import { DEVICE_TYPES } from '../data/repairData';
import { useData } from '../context/DataContext';

export default function QuotationTool() {
  const { models, issues, calculateCurrentEstimate, isQuoteModalOpen, setIsQuoteModalOpen } = useData();

  // Bloquear scroll de la página de fondo cuando el modal esté abierto
  useEffect(() => {
    if (isQuoteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isQuoteModalOpen]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isQuoteModalOpen) {
        setIsQuoteModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuoteModalOpen, setIsQuoteModalOpen]);

  const [selectedDevice, setSelectedDevice] = useState('iphone');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  const [customModel, setCustomModel] = useState('');
  const [selectedIssue, setSelectedIssue] = useState('screen');
  const [iphoneOptionKey, setIphoneOptionKey] = useState('compatible_unknown');

  // Marcas disponibles dinámicas para la categoría activa
  const availableBrands = useMemo(() => {
    const brandsSet = new Set();
    models
      .filter(m => m.type === selectedDevice)
      .forEach(m => {
        if (m.brand) brandsSet.add(m.brand);
      });
    
    // Orden de prioridad comercial
    const priority = ['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'LG', 'ZTE', 'TCL', 'Huawei', 'Alcatel', 'Nokia', 'Tecno', 'Oppo', 'Realme', 'Infinix', 'Honor', 'Noblex', 'Lenovo', 'HP', 'Dell', 'Asus', 'Acer'];
    
    return Array.from(brandsSet).sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [models, selectedDevice]);

  // Filtrar modelos según tipo de dispositivo, marca seleccionada y búsqueda inteligente
  const filteredModels = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const cleanQ = q.replace(/[^a-z0-9]/g, '');

    return models.filter((item) => {
      // 1. Tipo de dispositivo
      if (item.type !== selectedDevice) return false;

      // 2. Filtro por marca seleccionada en la lista desplazable
      if (selectedBrand !== 'all') {
        if (item.brand.toLowerCase() !== selectedBrand.toLowerCase()) return false;
      }

      // 3. Filtro por búsqueda de texto
      if (!q) return true;

      const itemModel = (item.model || '').toLowerCase();
      const itemBrand = (item.brand || '').toLowerCase();
      const cleanModel = itemModel.replace(/[^a-z0-9]/g, '');
      const cleanBrandModel = (itemBrand + ' ' + itemModel).replace(/[^a-z0-9]/g, '');

      // Coincidencia estándar por palabras
      if (itemModel.includes(q) || itemBrand.includes(q)) return true;

      // Coincidencia inteligente sin espacios (ej: 'g14' coincide con 'Moto G14', 'g 14', 'G14/G54')
      if (cleanQ && (cleanModel.includes(cleanQ) || cleanBrandModel.includes(cleanQ))) return true;

      return false;
    });
  }, [models, selectedDevice, selectedBrand, searchQuery]);

  // Si cambia el tipo de equipo, resetear filtros y preseleccionar el primer modelo relevante
  const handleDeviceChange = (typeId) => {
    setSelectedDevice(typeId);
    setSelectedBrand('all');
    setSearchQuery('');
    setCustomModel('');
    if (typeId === 'iphone') {
      setIphoneOptionKey(selectedIssue === 'screen' ? 'compatible_unknown' : 'bms_transplant');
    } else {
      setIphoneOptionKey(null);
    }
    const preferred = models.find(m => m.type === typeId && (
      m.model === 'iPhone 11' || 
      m.model === 'Galaxy A54 5G' || 
      m.model === 'Galaxy A54' ||
      m.model.includes('MacBook Air')
    )) || models.find(m => m.type === typeId);
    setSelectedModel(preferred || null);
  };

  // Manejar selección de falla con preselección inteligente para iPhone
  const handleIssueChange = (issueId) => {
    setSelectedIssue(issueId);
    if (selectedDevice === 'iphone') {
      if (issueId === 'screen') setIphoneOptionKey('compatible_unknown');
      else if (issueId === 'battery') setIphoneOptionKey('bms_transplant');
      else setIphoneOptionKey(null);
    }
  };

  // Manejar selección o deselección de marca en la barra desplazable
  const handleBrandSelect = (brandName) => {
    const nextBrand = selectedBrand.toLowerCase() === brandName.toLowerCase() ? 'all' : brandName;
    setSelectedBrand(nextBrand);
    setSearchQuery('');
    if (nextBrand !== 'all') {
      const firstMatch = models.find(m => m.type === selectedDevice && m.brand.toLowerCase() === nextBrand.toLowerCase());
      if (firstMatch) setSelectedModel(firstMatch);
    }
  };

  // Inicializar modelo inicial relevante si no hay ninguno o si pertenece a otra categoría
  React.useEffect(() => {
    if ((!selectedModel || selectedModel.type !== selectedDevice) && models.length > 0) {
      const initial = models.find(m => m.type === selectedDevice && (
        m.model === 'iPhone 11' || 
        m.model === 'Galaxy A54 5G' || 
        m.model === 'Galaxy A54' ||
        m.model.includes('MacBook Air')
      )) || models.find(m => m.type === selectedDevice);
      if (initial) setSelectedModel(initial);
    }
  }, [models, selectedDevice, selectedModel]);

  // Calcular el presupuesto actual con los datos reactivos del panel admin y repuestos reales
  const estimate = useMemo(() => {
    const activeModelId = selectedModel ? selectedModel.id : null;
    return calculateCurrentEstimate(selectedDevice, activeModelId, selectedIssue, customModel, {
      iphoneOptionKey
    });
  }, [selectedDevice, selectedModel, selectedIssue, customModel, iphoneOptionKey, calculateCurrentEstimate]);

  const activeIssueObj = issues.find(i => i.id === selectedIssue) || issues[0];

  // Icono para la falla seleccionada
  const renderIssueIcon = (id) => {
    switch (id) {
      case 'screen': return <Maximize2 className="w-5 h-5 text-[#FF5500]" />;
      case 'battery': return <BatteryCharging className="w-5 h-5 text-[#FF5500]" />;
      case 'charging-port': return <Zap className="w-5 h-5 text-[#FF5500]" />;
      case 'motherboard': return <Cpu className="w-5 h-5 text-[#FF5500]" />;
      case 'back-glass': return <Smartphone className="w-5 h-5 text-[#FF5500]" />;
      case 'thermal-maintenance': return <Fan className="w-5 h-5 text-[#FF5500]" />;
      case 'upgrade-storage': return <HardDrive className="w-5 h-5 text-[#FF5500]" />;
      default: return <Sparkles className="w-5 h-5 text-[#FF5500]" />;
    }
  };

  // Mensaje de WhatsApp precargado
  const currentModelName = customModel.trim() !== '' ? customModel : (selectedModel ? selectedModel.model : 'Mi equipo');
  const issueName = activeIssueObj ? activeIssueObj.name : 'Reparación técnica';
  const priceRangeStr = estimate ? (
    estimate.minPrice === estimate.maxPrice 
      ? `$${estimate.minPrice.toLocaleString('es-AR')}`
      : `$${estimate.minPrice.toLocaleString('es-AR')} a $${estimate.maxPrice.toLocaleString('es-AR')}`
  ) : 'A convenir';

  const iphoneModalityText = estimate?.selectedModality ? (
    `%0A🔬 *Modalidad / Repuesto:* ${estimate.selectedModality.name} (${estimate.selectedModality.iosNotice})`
  ) : '';
  const qualityText = (!estimate?.isIphoneSpecialized && estimate?.qualityLabel) ? `%0A💎 *Calidad:* ${estimate.qualityLabel} (100% Sin Incell/TFT)` : '';

  const whatsappMessage = `¡Hola montec! Vengo de la web y coticé una reparación:%0A%0A📱 *Equipo:* ${currentModelName}%0A🛠️ *Falla:* ${issueName}${iphoneModalityText}${qualityText}%0A💰 *Presupuesto estimativo web:* ${priceRangeStr}%0A⏱️ *Tiempo estimado:* 2 a 3 horas (con cita previa: 45 minutos)%0A🛡️ *Garantía:* ${estimate?.warranty || '30 días escrita'}%0A%0A¿Me confirmás la disponibilidad y el precio final para que me acerque al local de Montes Carballo 943?`;

  const whatsappLink = `https://wa.me/5492235000000?text=${whatsappMessage}`;

  return (
    <>
      {/* SECCIÓN COMPACTA EN LA PÁGINA PRINCIPAL */}
      <section id="cotizador" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative">
        {/* Glow decorativo de fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#FF5500]/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto">
          {/* Banner Tarjeta Compacta y Atractiva */}
          <div className="relative overflow-hidden bg-gradient-to-b from-[#18181B]/95 to-[#121214]/95 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
            {/* Acento superior naranja */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-[#FF5500] to-transparent opacity-80" />

            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-4 text-center lg:text-left max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5500]/15 border border-[#FF5500]/30 text-[#FF5500] text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Presupuesto Inmediato Online</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
                  Cotizá tu Reparación en <span className="text-[#FF5500]">3 simples pasos</span>
                </h2>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                  Seleccioná tu equipo (<strong className="text-zinc-200">iPhone</strong>, <strong className="text-zinc-200">Android</strong> o <strong className="text-zinc-200">Notebook</strong>) y conocé al instante el valor estimado de mano de obra y repuesto con instrumental de precisión y garantía escrita.
                </p>

                {/* Badges de Beneficios */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-900/80 px-2.5 py-1.5 rounded-lg border border-zinc-800/80">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>30 días escrita</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-900/80 px-2.5 py-1.5 rounded-lg border border-zinc-800/80">
                    <Clock className="w-4 h-4 text-[#FF5500] shrink-0" />
                    <span>2 a 3 hs (45m cita)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-900/80 px-2.5 py-1.5 rounded-lg border border-zinc-800/80">
                    <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>+600 Modelos</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-900/80 px-2.5 py-1.5 rounded-lg border border-zinc-800/80">
                    <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Sin Incell / TFT</span>
                  </div>
                </div>
              </div>

              {/* Botón Principal para Abrir el Modal */}
              <div className="w-full lg:w-auto flex flex-col items-center sm:items-stretch gap-2.5 shrink-0">
                <button
                  onClick={() => setIsQuoteModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-5 rounded-2xl font-heading font-black text-base sm:text-lg text-white bg-gradient-to-r from-[#FF5500] to-[#FF6600] hover:from-[#FF6600] hover:to-[#FF7700] shadow-[0_0_30px_rgba(255,85,0,0.5)] hover:shadow-[0_0_40px_rgba(255,85,0,0.7)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Calculator className="w-6 h-6" />
                  <span>Abrir Cotizador Online</span>
                  <ArrowRight className="w-5 h-5 text-white/80" />
                </button>
                <span className="text-center text-[11px] text-zinc-500">
                  ⚡ Presupuesto estimado en el acto
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VENTANA MODAL SUPERPUESTA (POPUP) */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn">
          {/* Backdrop para cerrar al hacer click afuera */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setIsQuoteModalOpen(false)} 
          />

          {/* Contenedor del Modal con tamaño controlado */}
          <div className="w-full max-w-6xl max-h-[94vh] flex flex-col bg-[#121214] border border-zinc-800/90 rounded-2xl sm:rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-hidden relative">
            
            {/* Header Fijo Superior del Modal */}
            <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-zinc-800/80 bg-[#151518]/95 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#FF5500]/15 text-[#FF5500]">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-heading font-bold text-white flex items-center gap-2">
                    <span>Cotizador de Reparaciones</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-sans font-bold bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30 hidden sm:inline-block">
                      Online MDP
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 hidden sm:block">
                    Completá los pasos para obtener el presupuesto de tu equipo
                  </p>
                </div>
              </div>

              {/* Botón Cerrar (X) */}
              <button
                onClick={() => setIsQuoteModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-5 h-5" />
                <span className="text-xs hidden sm:inline">Cerrar</span>
              </button>
            </div>

            {/* Contenido con Scroll Interior Suave */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {/* Card Principal del Cotizador */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Lado Izquierdo: Pasos de Configuración (7 cols) */}
                <div className="lg:col-span-7 space-y-8 bg-[#121212]/90 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            
            {/* PASO 1: Tipo de Dispositivo */}
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF5500] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FF5500] text-black font-bold flex items-center justify-center text-xs">1</span>
                  Tipo de Equipo
                </span>
                <span className="text-xs text-zinc-500">Seleccioná tu categoría</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {DEVICE_TYPES.map((dt) => {
                  const isSelected = selectedDevice === dt.id;
                  return (
                    <button
                      key={dt.id}
                      onClick={() => handleDeviceChange(dt.id)}
                      className={`p-3.5 sm:p-4 rounded-xl text-left border transition-all duration-200 flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-[#FF5500]/15 border-[#FF5500] shadow-[0_0_15px_rgba(255,85,0,0.25)]' 
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        {dt.id === 'iphone' && <Smartphone className={`w-5 h-5 ${isSelected ? 'text-[#FF5500]' : 'text-zinc-400'}`} />}
                        {dt.id === 'android' && <Cpu className={`w-5 h-5 ${isSelected ? 'text-[#FF5500]' : 'text-zinc-400'}`} />}
                        {dt.id === 'notebook' && <Laptop className={`w-5 h-5 ${isSelected ? 'text-[#FF5500]' : 'text-zinc-400'}`} />}
                        {isSelected && <Check className="w-4 h-4 text-[#FF5500]" />}
                      </div>
                      <div>
                        <div className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                          {dt.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">
                          {dt.badge}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PASO 2: Marca y Modelo */}
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF5500] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FF5500] text-black font-bold flex items-center justify-center text-xs">2</span>
                  Marca & Modelo
                </span>
                {selectedModel && (
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    Seleccionado: <strong className="text-white">{selectedModel.model}</strong>
                  </span>
                )}
              </div>

              {/* Lista desplazable con las marcas */}
              <div className="mb-3.5">
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Marcas disponibles:
                  </span>
                  {selectedBrand !== 'all' && (
                    <button
                      type="button"
                      onClick={() => { setSelectedBrand('all'); setSearchQuery(''); }}
                      className="text-[11px] text-[#FF5500] hover:underline font-medium"
                    >
                      Ver todas las marcas
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-0.5 no-scrollbar scroll-smooth">
                  <button
                    type="button"
                    onClick={() => { setSelectedBrand('all'); setSearchQuery(''); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 border ${
                      selectedBrand === 'all'
                        ? 'bg-[#FF5500] text-black border-[#FF5500] shadow-[0_0_12px_rgba(255,85,0,0.35)] font-bold'
                        : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    Todas ({models.filter(m => m.type === selectedDevice).length})
                  </button>

                  {availableBrands.map((brandName) => {
                    const isSelected = selectedBrand.toLowerCase() === brandName.toLowerCase();
                    const brandCount = models.filter(m => m.type === selectedDevice && m.brand === brandName).length;
                    return (
                      <button
                        type="button"
                        key={brandName}
                        onClick={() => handleBrandSelect(brandName)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 border flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#FF5500] text-black border-[#FF5500] shadow-[0_0_12px_rgba(255,85,0,0.35)] font-bold'
                            : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        <span>{brandName}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-black/25 text-black font-bold' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {brandCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input buscador predictivo */}
              <div className="relative mb-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Buscar modelo (ej: iPhone 11, Galaxy A54, IdeaPad, Moto G84)...`}
                  className="w-full bg-zinc-900/80 border border-zinc-700/80 focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
                  >
                    Borrar
                  </button>
                )}
              </div>

              {/* Sugerencias de Modelos desde DataContext (Catálogo de 626 equipos) */}
              <div className="max-h-52 overflow-y-auto pr-1 space-y-1 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-1.5">
                {filteredModels.length > 0 ? (
                  <>
                    {filteredModels.slice(0, 60).map((item) => {
                      const isCurrent = selectedModel?.id === item.id && !customModel;
                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => {
                            setSelectedModel(item);
                            setCustomModel('');
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center justify-between transition-colors ${
                            isCurrent 
                              ? 'bg-[#FF5500]/20 text-[#FF5500] font-semibold border border-[#FF5500]/40' 
                              : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono shrink-0">
                              {item.brand}
                            </span>
                            <span className="truncate">{item.model}</span>
                          </span>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-[#FF5500] shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                    {filteredModels.length > 60 && (
                      <div className="py-2 text-center text-[11px] text-zinc-500 bg-zinc-900/30 rounded-lg">
                        Mostrando los primeros 60 de {filteredModels.length} modelos. Escribí en el buscador para filtrar.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 text-center text-xs text-zinc-400">
                    No encontramos "{searchQuery}" en la lista. Podés escribirlo abajo en el casillero personalizado.
                  </div>
                )}
              </div>

              {/* Opción para escribir modelo no listado */}
              <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="¿No figura tu modelo? Escribilo acá directamente..."
                  className="bg-transparent text-xs text-zinc-300 placeholder-zinc-500 outline-none w-full focus:text-white"
                />
              </div>
            </div>

            {/* PASO 3: Selección de Falla desde DataContext */}
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF5500] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FF5500] text-black font-bold flex items-center justify-center text-xs">3</span>
                  Falla a Reparar
                </span>
                <span className="text-xs text-zinc-500">¿Qué le ocurre a tu equipo?</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {issues.map((issue) => {
                  const isSelected = selectedIssue === issue.id;
                  return (
                    <button
                      type="button"
                      key={issue.id}
                      onClick={() => handleIssueChange(issue.id)}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 flex items-start gap-3 ${
                        isSelected 
                          ? 'bg-[#FF5500]/15 border-[#FF5500] shadow-[0_0_12px_rgba(255,85,0,0.2)]' 
                          : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0 mt-0.5">
                        {renderIssueIcon(issue.id)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs sm:text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                            {issue.name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#FF5500] shrink-0 ml-1" />}
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5 leading-snug">
                          {issue.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PASO 4: Opciones de Calidad & Microelectrónica (Especial para iPhone) */}
            {estimate?.isIphoneSpecialized && estimate?.modalities && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#141416] border border-[#FF5500]/40 shadow-[0_0_20px_rgba(255,85,0,0.12)] space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF5500] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FF5500] text-black font-bold flex items-center justify-center text-xs">4</span>
                    Modalidad y Calidad ({selectedIssue === 'screen' ? 'Pantalla' : 'Batería'} iPhone)
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                    {selectedIssue === 'screen' ? 'Opciones de Módulo' : 'Salud de Batería'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  En iPhone podés elegir entre la opción estándar (con aviso en Ajustes de iOS) o trabajo de laboratorio (trasplante de chip/flex para mantener 100% condición y sin alertas).
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  {estimate.modalities.map((mod) => {
                    const isModSelected = (estimate.selectedModality?.key || (selectedIssue === 'screen' ? 'compatible_unknown' : 'bms_transplant')) === mod.key;
                    return (
                      <button
                        type="button"
                        key={mod.key}
                        onClick={() => setIphoneOptionKey(mod.key)}
                        className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isModSelected
                            ? 'bg-[#FF5500]/15 border-[#FF5500] shadow-[0_0_15px_rgba(255,85,0,0.25)]'
                            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs sm:text-sm font-bold ${isModSelected ? 'text-white' : 'text-zinc-200'}`}>
                              {mod.name}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              mod.key === 'ic_transplant' || mod.key === 'bms_transplant'
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                : mod.key === 'original_used'
                                ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}>
                              {mod.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400">
                            {mod.desc}
                          </p>
                          <div className="text-[10px] text-zinc-500 font-medium">
                            ℹ️ <span className={isModSelected ? 'text-zinc-300' : 'text-zinc-500'}>{mod.iosNotice}</span>
                          </div>
                        </div>

                        <div className="flex items-center sm:flex-col items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/80">
                          <span className="text-base sm:text-lg font-heading font-black text-[#FF5500]">
                            ${mod.finalPrice.toLocaleString('es-AR')}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            Repuesto + Laboratorio
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Lado Derecho: Tarjeta de Resultado & Conversión a WhatsApp (5 cols) */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-gradient-to-b from-[#18181B] to-[#101012] border-2 border-[#FF5500]/50 rounded-2xl p-6 sm:p-7 shadow-[0_0_35px_rgba(255,85,0,0.2)] relative overflow-hidden">
              
              {/* Badge Destacado */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/40">
                  Presupuesto Inmediato
                </span>
                <span className="text-xs text-zinc-400">Mar del Plata</span>
              </div>

              {/* Resumen del Equipo */}
              <div className="border-b border-zinc-800 pb-4 mb-5">
                <div className="text-xs text-zinc-400">Equipo seleccionado</div>
                <div className="text-lg sm:text-xl font-heading font-bold text-white mt-0.5">
                  {currentModelName}
                </div>
                <div className="text-xs text-[#FF5500] font-medium mt-0.5 flex items-center gap-1.5">
                  <span>{activeIssueObj?.name}</span>
                  <span>•</span>
                  <span className="text-zinc-400">{activeIssueObj?.badge}</span>
                </div>
              </div>

              {/* Rango de Precio Estimado */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                    Costo Estimado Repuesto + Mano de Obra
                  </div>
                  {estimate?.isDirectMatch && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                      {estimate.isIphoneSpecialized ? 'Apple Serializado' : 'Sin Incell'}
                    </span>
                  )}
                </div>

                {/* Badge Calidad / Modalidad Especializada */}
                {estimate?.isIphoneSpecialized && estimate?.selectedModality ? (
                  <div className="mb-3 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-semibold">Modalidad:</span>
                      <span className="font-bold text-white">{estimate.selectedModality.name}</span>
                    </div>
                    <div className="text-[11px] text-amber-400/90 font-medium">
                      📱 {estimate.selectedModality.iosNotice}
                    </div>
                  </div>
                ) : estimate?.isDirectMatch ? (
                  <div className="mb-3 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Calidad: <strong>{estimate.qualityLabel}</strong> (100% Libre de TFT/Incell)</span>
                  </div>
                ) : null}

                <div className="text-3xl sm:text-4xl font-heading font-black text-white tracking-tight flex items-baseline gap-2">
                  <span className="text-[#FF5500] drop-shadow-[0_0_15px_rgba(255,85,0,0.4)]">
                    {estimate ? `$${estimate.minPrice.toLocaleString('es-AR')}` : '$0'}
                  </span>
                  {estimate && estimate.minPrice !== estimate.maxPrice && (
                    <>
                      <span className="text-zinc-500 text-xl font-normal">a</span>
                      <span>
                        ${estimate.maxPrice.toLocaleString('es-AR')}
                      </span>
                    </>
                  )}
                </div>

                {/* Variantes de calidad si existen múltiples (ej: OLED vs Original) */}
                {estimate?.options && estimate.options.length > 1 && (
                  <div className="mt-3.5 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs">
                    <div className="text-[11px] text-zinc-400 font-medium mb-1.5 flex items-center justify-between">
                      <span>Calidades disponibles en taller:</span>
                      <span className="text-[10px] text-zinc-500">{estimate.optionsCount} opciones</span>
                    </div>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {estimate.options.slice(0, 3).map((opt, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-zinc-800/50 last:border-0">
                          <span className="text-zinc-300 truncate max-w-[200px]">
                            {opt.qualityType} {opt.hasFrame ? '• c/ Marco' : ''}
                          </span>
                          <span className="font-mono text-zinc-200 font-bold">
                            ${opt.final_price.toLocaleString('es-AR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tiempos y Garantías */}
              <div className="space-y-3 mb-4 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#FF5500]/10 text-[#FF5500]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400 font-medium">Tiempo de trabajo:</div>
                    <div className="text-xs sm:text-sm font-bold text-zinc-200">
                      De 2 a 3 horas <span className="text-[#FF5500] text-xs font-semibold block sm:inline sm:ml-1">• Con cita previa: 45 min</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400 font-medium">Garantía montec:</div>
                    <div className="text-xs sm:text-sm font-bold text-zinc-200">
                      {estimate?.warranty || '30 días escrita'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Aclaración Precios Estimativos */}
              <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-center">
                <p className="text-xs text-amber-300 font-medium leading-snug">
                  ⚠️ <strong>Precios estimativos:</strong> Sujetos a confirmación final vía WhatsApp según stock y diagnóstico físico del equipo.
                </p>
              </div>

              {/* Botón CTA Derivación a WhatsApp */}
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 py-4 px-5 rounded-xl font-heading font-bold text-base text-white bg-[#FF5500] hover:bg-[#FF6600] shadow-[0_0_25px_rgba(255,85,0,0.4)] hover:shadow-[0_0_35px_rgba(255,85,0,0.65)] transition-all duration-300 transform active:scale-98 text-center"
              >
                <MessageCircle className="w-5 h-5 fill-white text-transparent" />
                <span>Pedir Turno por WhatsApp</span>
              </a>

              <p className="text-center text-xs text-zinc-400 mt-3 flex items-center justify-center gap-1">
                <span>📍 Montes Carballo 943 • Presupuesto sin cargo</span>
              </p>

            </div>
          </div>

        </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
