import React, { useState, useMemo } from 'react';
import {
  BrainCircuit,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
  Zap,
  Layers,
  HelpCircle,
  RefreshCw,
  Search,
  MessageCircle,
  Eye,
  Sliders,
  Check,
  X,
  ChevronRight,
  Target,
  BarChart3,
  Bot
} from 'lucide-react';
import { useData } from '../../context/DataContext';

// Mock de Alertas Automáticas Inteligentes (Data Blending entre Ads + SEO + GA4)
const INITIAL_ALERTS = [
  {
    id: 'alert-1',
    type: 'saving', // Alerta de Ahorro (Amarilla / Ámbar)
    severity: 'warning',
    title: "Pausar anuncio de 'arreglar celular' en Google Ads",
    badge: 'Ahorro Inmediato',
    savingEstimate: '$38.500 / mes',
    description: "Ya posicionás en Posición 1.0 Orgánica en Google Search Console para Mar del Plata. Estás pagando clics en Ads por tráfico que ya captás de forma 100% gratuita.",
    sourceData: {
      seoPosition: '1.0 (#1 Google)',
      seoClicks: '842 clics/mes',
      adsSpent: '$38.500',
      adsClicks: '115 clics',
      cpcAds: '$334'
    },
    actionLabel: 'Pausar Palabra en Ads',
    status: 'pending'
  },
  {
    id: 'alert-2',
    type: 'opportunity', // Oportunidad (Verde / Esmeralda)
    severity: 'success',
    title: "Escalar presupuesto en 'cambio bateria iphone'",
    badge: 'Alta Conversión',
    savingEstimate: '+32 Consultas WhatsApp',
    description: "La búsqueda 'cambio bateria iphone mar del plata' tiene una tasa de conversión récord del 82.4% a WhatsApp (medido en GA4) con un costo por lead de solo $1.150.",
    sourceData: {
      conversionRate: '82.4%',
      whatsappLeads: '68 mensajes',
      cpa: '$1.150 / lead',
      roas: '14.2x'
    },
    actionLabel: 'Subir Presupuesto +25%',
    status: 'pending'
  },
  {
    id: 'alert-3',
    type: 'waste', // Alerta de Fuga de Presupuesto (Rojo)
    severity: 'danger',
    title: "Bloquear 'reparacion celulares gratis' como negativa",
    badge: 'Gasto Inútil',
    savingEstimate: '$14.200 ahorrados',
    description: "Esta consulta activó anuncios de búsqueda amplia en Mar del Plata acumulando 46 clics sin una sola conversión a WhatsApp. Público no calificado buscando tutoriales.",
    sourceData: {
      wastedBudget: '$14.200',
      clicksWithoutConversion: '46 clics',
      conversionRate: '0.0%',
      bounceRate: '98%'
    },
    actionLabel: 'Agregar a Negativas',
    status: 'pending'
  },
  {
    id: 'alert-4',
    type: 'synergy', // Sinergia Híbrida (Azul / Violeta)
    severity: 'info',
    title: "Potenciar sinergia en 'reparacion notebook mar del plata'",
    badge: 'Sinergia Híbrida',
    savingEstimate: 'Liderazgo Local',
    description: "Subiste de Posición 8 a 3.1 en Search Console y en Google Ads genera conversiones con ticket promedio alto ($85.000). Mantener presencia dual para copar la primera página.",
    sourceData: {
      seoPosition: '3.1 (Página 1)',
      seoClicks: '348 clics',
      adsConversions: '24 consultas WhatsApp',
      avgTicket: '$85.000'
    },
    actionLabel: 'Optimizar Anuncio Dual',
    status: 'pending'
  }
];

// Tabla de Atribución Cruzada (Data Blending)
const MOCK_CROSS_ATTRIBUTION_DATA = [
  {
    id: 'k1',
    keyword: 'reparacion celulares mar del plata',
    adsSpend: 38500,
    adsClicks: 115,
    seoVisits: 842,
    seoPosition: 1.2,
    whatsappConversions: 94,
    cpa: 409,
    diagnosis: 'Dominio Orgánico',
    recommendation: 'Pausar Ads para no canibalizar tráfico propio',
    tagColor: 'amber'
  },
  {
    id: 'k2',
    keyword: 'cambio bateria iphone mar del plata',
    adsSpend: 42000,
    adsClicks: 88,
    seoVisits: 512,
    seoPosition: 2.1,
    whatsappConversions: 68,
    cpa: 617,
    diagnosis: 'Escalar Ads',
    recommendation: 'Subir puja un 20%: alta rentabilidad de repuesto',
    tagColor: 'emerald'
  },
  {
    id: 'k3',
    keyword: 'cambio modulo iphone mar del plata',
    adsSpend: 65400,
    adsClicks: 142,
    seoVisits: 624,
    seoPosition: 1.4,
    whatsappConversions: 89,
    cpa: 734,
    diagnosis: 'Sinergia Óptima',
    recommendation: 'Mantener mix orgánico + patrocinado activo',
    tagColor: 'blue'
  },
  {
    id: 'k4',
    keyword: 'arreglo pin de carga motorola mdp',
    adsSpend: 18200,
    adsClicks: 62,
    seoVisits: 438,
    seoPosition: 2.3,
    whatsappConversions: 35,
    cpa: 520,
    diagnosis: 'Buen Retorno',
    recommendation: 'Mantener presupuesto actual',
    tagColor: 'emerald'
  },
  {
    id: 'k5',
    keyword: 'reparacion celulares gratis mar del plata',
    adsSpend: 14200,
    adsClicks: 46,
    seoVisits: 18,
    seoPosition: 8.4,
    whatsappConversions: 0,
    cpa: 0,
    diagnosis: 'Gasto Inútil',
    recommendation: 'Negativizar de inmediato en concordancia exacta',
    tagColor: 'rose'
  },
  {
    id: 'k6',
    keyword: 'servicio tecnico notebook mar del plata',
    adsSpend: 31000,
    adsClicks: 74,
    seoVisits: 348,
    seoPosition: 3.1,
    whatsappConversions: 28,
    cpa: 1107,
    diagnosis: 'Ticket Alto',
    recommendation: 'Excelente rentabilidad por reparación mayor',
    tagColor: 'blue'
  },
  {
    id: 'k7',
    keyword: 'cambio pantalla samsung s23 mdp',
    adsSpend: 24500,
    adsClicks: 41,
    seoVisits: 284,
    seoPosition: 2.8,
    whatsappConversions: 22,
    cpa: 1113,
    diagnosis: 'Escalar Ads',
    recommendation: 'Público premium dispuesto a cotizar original',
    tagColor: 'emerald'
  },
  {
    id: 'k8',
    keyword: 'descargar software flashear samsung gratis',
    adsSpend: 11800,
    adsClicks: 39,
    seoVisits: 45,
    seoPosition: 6.2,
    whatsappConversions: 0,
    cpa: 0,
    diagnosis: 'Gasto Inútil',
    recommendation: 'Bloquear como palabra negativa',
    tagColor: 'rose'
  }
];

export default function SmartAlertsTab() {
  const { panelTheme } = useData();
  const isLight = panelTheme === 'light';

  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'saving' | 'opportunity' | 'waste'
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApplyAlert = (id, title) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'applied' } : a));
    showToast(`✅ Acción aplicada con éxito: "${title}"`);
  };

  const handleDismissAlert = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'dismissed' } : a));
    showToast('Alerta archivada');
  };

  const handleRunReanalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAlerts(INITIAL_ALERTS.map(a => ({ ...a, status: 'pending' })));
      showToast('🤖 Cruce de datos reanalizado con éxito. Todas las fuentes están al día.');
    }, 1100);
  };

  // Filtrado de alertas
  const activeAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (a.status !== 'pending') return false;
      if (filterType === 'all') return true;
      return a.type === filterType;
    });
  }, [alerts, filterType]);

  // Filtrado de la tabla de atribución
  const filteredAttribution = useMemo(() => {
    return MOCK_CROSS_ATTRIBUTION_DATA.filter(item =>
      item.keyword.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      item.diagnosis.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [searchTerm]);

  // Cálculos globales de ahorro y oportunidades
  const totalMonthlySavings = "$52.700";
  const potentialLeadsIncrease = "+32 leads/mes";
  const aiOptimizationScore = 92;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FF5500] text-white text-xs sm:text-sm font-semibold shadow-[0_0_25px_rgba(255,85,0,0.5)] animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header del Tab */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#FF5500]/20 to-purple-500/20 text-[#FF5500] border border-[#FF5500]/40 shadow-sm">
              <BrainCircuit className="w-5 h-5 text-[#FF5500]" />
            </div>
            <div>
              <h2 className={`text-xl sm:text-2xl font-heading font-bold flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Alertas Inteligentes (IA) & Data Blending
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Cruce Multi-Canal
                </span>
              </h2>
              <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                Inteligencia artificial que cruza datos en tiempo real entre <strong className="text-zinc-200">Google Ads</strong>, <strong className="text-zinc-200">Search Console</strong> y <strong className="text-zinc-200">Google Analytics (WhatsApp)</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones de reanálisis */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunReanalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64D00] hover:from-[#FF6600] hover:to-[#FF5500] text-white text-xs font-bold shadow-[0_0_20px_rgba(255,85,0,0.35)] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Cruzando Fuentes...' : 'Reanalizar Cruce de Datos'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3 BANNER STATS: DATA BLENDING HEALTH                           */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat 1: Ahorro Detectado */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isLight ? 'bg-amber-50/70 border-amber-200 shadow-sm' : 'bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-900 border-amber-500/30 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              Ahorro Mensual Identificado
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Canibalización & Fugas
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
            {totalMonthlySavings}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Redirigiendo tráfico a tu posición #1 orgánica y eliminando clics basura.
          </p>
        </div>

        {/* Stat 2: Oportunidades de Conversión */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isLight ? 'bg-emerald-50/70 border-emerald-200 shadow-sm' : 'bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-900 border-emerald-500/30 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              Potencial de Nuevos Leads
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Alta Intención
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
            {potentialLeadsIncrease}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Al reasignar el presupuesto ahorrado a búsquedas con más del 80% de cierre.
          </p>
        </div>

        {/* Stat 3: Score de Eficiencia */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isLight ? 'bg-purple-50/70 border-purple-200 shadow-sm' : 'bg-gradient-to-br from-purple-500/10 via-zinc-900 to-zinc-900 border-purple-500/30 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              Score de Eficiencia Multi-Canal
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
              IA Montec
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {aiOptimizationScore}
            </span>
            <span className="text-xs text-purple-300 font-mono">/ 100 puntos</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Sinergia alta entre inversión paga y posicionamiento orgánico en Mar del Plata.
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN 1: TARJETAS DE ALERTAS AUTOMÁTICAS                      */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className={`font-heading font-bold text-base sm:text-lg flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <Bot className="w-5 h-5 text-[#FF5500]" />
              Alertas Automáticas y Recomendaciones de Acción
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Decisiones accionables sugeridas al comparar Search Console vs Google Ads vs GA4
            </p>
          </div>

          {/* Filtros de Tipo de Alerta */}
          <div className={`flex rounded-xl p-1 border text-xs font-semibold ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'all' ? 'bg-[#FF5500] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todas ({activeAlerts.length})
            </button>
            <button
              onClick={() => setFilterType('saving')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'saving' ? 'bg-amber-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ahorro
            </button>
            <button
              onClick={() => setFilterType('opportunity')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'opportunity' ? 'bg-emerald-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Oportunidades
            </button>
            <button
              onClick={() => setFilterType('waste')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'waste' ? 'bg-rose-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Fugas
            </button>
          </div>
        </div>

        {/* Lista de Tarjetas de Alerta */}
        {activeAlerts.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="font-bold text-white text-base">¡Todas las alertas están atendidas!</h4>
            <p className="text-xs text-zinc-400 mt-1">
              Tu presupuesto de Google Ads y posicionamiento orgánico están perfectamente coordinados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAlerts.map(alert => {
              // Colores temáticos por tipo
              const isSaving = alert.type === 'saving';
              const isOpportunity = alert.type === 'opportunity';
              const isWaste = alert.type === 'waste';

              const cardBorder = isSaving
                ? 'border-amber-500/40 bg-zinc-900/90 hover:border-amber-500/70'
                : isOpportunity
                ? 'border-emerald-500/40 bg-zinc-900/90 hover:border-emerald-500/70'
                : isWaste
                ? 'border-rose-500/40 bg-zinc-900/90 hover:border-rose-500/70'
                : 'border-purple-500/40 bg-zinc-900/90 hover:border-purple-500/70';

              const badgeColor = isSaving
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : isOpportunity
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : isWaste
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : 'bg-purple-500/15 text-purple-400 border-purple-500/30';

              const iconComponent = isSaving ? (
                <DollarSign className="w-5 h-5 text-amber-400" />
              ) : isOpportunity ? (
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              ) : isWaste ? (
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              ) : (
                <Sparkles className="w-5 h-5 text-purple-400" />
              );

              return (
                <div
                  key={alert.id}
                  className={`p-5 rounded-2xl border transition-all shadow-md flex flex-col justify-between ${cardBorder}`}
                >
                  <div>
                    {/* Top de la Tarjeta */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 shrink-0">
                          {iconComponent}
                        </div>
                        <div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                            {alert.badge}
                          </span>
                          <span className="ml-2 text-xs font-mono font-bold text-white">
                            {alert.savingEstimate}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDismissAlert(alert.id)}
                        className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                        title="Descartar alerta"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Título y Descripción */}
                    <h4 className="font-heading font-bold text-sm sm:text-base text-white mb-1.5">
                      {alert.title}
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                      {alert.description}
                    </p>

                    {/* Telemetría cruzada (Data Blending Breakdown) */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-[11px] mb-4">
                      {Object.entries(alert.sourceData).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-zinc-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                          </span>
                          <span className="font-mono font-bold text-zinc-200">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-500 font-mono">
                      Impacto Directo en Facturación
                    </span>
                    <button
                      onClick={() => handleApplyAlert(alert.id, alert.title)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSaving
                          ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                          : isOpportunity
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : isWaste
                          ? 'bg-rose-500 hover:bg-rose-400 text-white font-bold shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                          : 'bg-[#FF5500] hover:bg-[#FF6600] text-white font-bold shadow-[0_0_12px_rgba(255,85,0,0.3)]'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{alert.actionLabel}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN 2: TABLA DE ATRIBUCIÓN CRUZADA (DATA BLENDING)         */}
      {/* ============================================================== */}
      <div className={`rounded-2xl border overflow-hidden ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/90 border-zinc-800/80 shadow-lg'
      }`}>
        <div className="p-5 border-b border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className={`font-heading font-bold text-base sm:text-lg flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <Layers className="w-5 h-5 text-[#FF5500]" />
              Matriz de Atribución Cruzada (Ads vs SEO vs Conversión)
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Cruce de inversión en Google Ads con tráfico orgánico de Search Console y cierres de WhatsApp
            </p>
          </div>

          {/* Buscador de consultas */}
          <div className="relative w-full md:w-80">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isLight ? 'text-slate-400' : 'text-zinc-500'
            }`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por término o diagnóstico..."
              className={`w-full border rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm outline-none focus:border-[#FF5500] transition-colors ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  : 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500'
              }`}
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-400'
              }`}>
                <th className="py-3.5 px-4 sm:px-6">Palabra Clave</th>
                <th className="py-3.5 px-4 text-right">Gasto Ads</th>
                <th className="py-3.5 px-4 text-right">Visitas SEO</th>
                <th className="py-3.5 px-4 text-right">Pos. Orgánica</th>
                <th className="py-3.5 px-4 text-right">Conversiones (WA)</th>
                <th className="py-3.5 px-4">Diagnóstico IA</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acción Recomendada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-xs sm:text-sm">
              {filteredAttribution.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No se encontraron datos para "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredAttribution.map((item) => {
                  const tagStyles = {
                    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  }[item.tagColor] || 'bg-zinc-800 text-zinc-300 border-zinc-700';

                  return (
                    <tr 
                      key={item.id} 
                      className={`transition-colors ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/40'
                      }`}
                    >
                      {/* Palabra Clave */}
                      <td className="py-3.5 px-4 sm:px-6 font-medium text-white">
                        <span className="text-zinc-200 font-semibold block">{item.keyword}</span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {item.adsClicks > 0 ? `${item.adsClicks} clics pagos` : 'Sin tráfico pago'}
                        </span>
                      </td>

                      {/* Gasto Ads */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        ${item.adsSpend.toLocaleString('es-AR')}
                      </td>

                      {/* Visitas SEO */}
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-300">
                        {item.seoVisits.toLocaleString()}
                      </td>

                      {/* Posición Orgánica */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          item.seoPosition <= 2 
                            ? 'bg-emerald-500/20 text-emerald-400 font-extrabold' 
                            : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          #{item.seoPosition.toFixed(1)}
                        </span>
                      </td>

                      {/* Conversiones WhatsApp */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <span className={`font-bold inline-flex items-center gap-1 ${
                          item.whatsappConversions > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <MessageCircle className="w-3.5 h-3.5" />
                          {item.whatsappConversions}
                        </span>
                      </td>

                      {/* Diagnóstico */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-block whitespace-nowrap ${tagStyles}`}>
                          {item.diagnosis}
                        </span>
                      </td>

                      {/* Acción Recomendada */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <span className="text-xs text-zinc-300 block">
                          {item.recommendation}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
