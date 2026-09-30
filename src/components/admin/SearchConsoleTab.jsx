import React, { useState, useMemo, useEffect } from 'react';
import { searchConsoleApi } from '../../services/searchConsoleApi';
import {
  Search,
  MousePointerClick,
  Eye,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Globe,
  Smartphone,
  Monitor,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ExternalLink,
  Award,
  Sparkles,
  HelpCircle,
  BarChart3,
  Layers,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { useData } from '../../context/DataContext';

// 30 días de evolución para Mar del Plata (Search Console data mock)
const MOCK_DAILY_SEO_DATA = [
  { date: '01 Mar', clicks: 112, impressions: 1840, ctr: 6.08, position: 3.4 },
  { date: '02 Mar', clicks: 128, impressions: 1980, ctr: 6.46, position: 3.3 },
  { date: '03 Mar', clicks: 145, impressions: 2150, ctr: 6.74, position: 3.2 },
  { date: '04 Mar', clicks: 139, impressions: 2090, ctr: 6.65, position: 3.3 },
  { date: '05 Mar', clicks: 156, impressions: 2310, ctr: 6.75, position: 3.1 },
  { date: '06 Mar', clicks: 172, impressions: 2480, ctr: 6.93, position: 3.0 },
  { date: '07 Mar', clicks: 185, impressions: 2650, ctr: 6.98, position: 2.9 },
  { date: '08 Mar', clicks: 160, impressions: 2400, ctr: 6.66, position: 3.1 },
  { date: '09 Mar', clicks: 142, impressions: 2120, ctr: 6.69, position: 3.2 },
  { date: '10 Mar', clicks: 168, impressions: 2510, ctr: 6.69, position: 3.0 },
  { date: '11 Mar', clicks: 179, impressions: 2680, ctr: 6.67, position: 2.9 },
  { date: '12 Mar', clicks: 194, impressions: 2790, ctr: 6.95, position: 2.8 },
  { date: '13 Mar', clicks: 205, impressions: 2920, ctr: 7.02, position: 2.7 },
  { date: '14 Mar', clicks: 218, impressions: 3050, ctr: 7.14, position: 2.7 },
  { date: '15 Mar', clicks: 188, impressions: 2710, ctr: 6.93, position: 2.9 },
  { date: '16 Mar', clicks: 162, impressions: 2390, ctr: 6.77, position: 3.0 },
  { date: '17 Mar', clicks: 190, impressions: 2750, ctr: 6.90, position: 2.8 },
  { date: '18 Mar', clicks: 201, impressions: 2890, ctr: 6.95, position: 2.7 },
  { date: '19 Mar', clicks: 215, impressions: 3040, ctr: 7.07, position: 2.6 },
  { date: '20 Mar', clicks: 224, impressions: 3120, ctr: 7.17, position: 2.6 },
  { date: '21 Mar', clicks: 236, impressions: 3280, ctr: 7.19, position: 2.5 },
  { date: '22 Mar', clicks: 198, impressions: 2860, ctr: 6.92, position: 2.7 },
  { date: '23 Mar', clicks: 175, impressions: 2540, ctr: 6.88, position: 2.8 },
  { date: '24 Mar', clicks: 210, impressions: 2990, ctr: 7.02, position: 2.6 },
  { date: '25 Mar', clicks: 228, impressions: 3180, ctr: 7.16, position: 2.5 },
  { date: '26 Mar', clicks: 242, impressions: 3340, ctr: 7.24, position: 2.4 },
  { date: '27 Mar', clicks: 251, impressions: 3450, ctr: 7.27, position: 2.4 },
  { date: '28 Mar', clicks: 263, impressions: 3620, ctr: 7.26, position: 2.3 },
  { date: '29 Mar', clicks: 230, impressions: 3190, ctr: 7.21, position: 2.5 },
  { date: '30 Mar', clicks: 247, impressions: 3390, ctr: 7.28, position: 2.4 }
];

// Palabras clave orgánicas de alta relevancia local en Mar del Plata
const MOCK_SEARCH_QUERIES = [
  { keyword: 'reparacion celulares mar del plata', clicks: 842, impressions: 7210, ctr: 11.67, position: 1.2, diff: '+0.3' },
  { keyword: 'cambio modulo iphone mar del plata', clicks: 624, impressions: 4890, ctr: 12.76, position: 1.4, diff: '+0.5' },
  { keyword: 'servicio tecnico celulares mdp', clicks: 531, impressions: 5120, ctr: 10.37, position: 1.8, diff: '+0.2' },
  { keyword: 'cambio bateria iphone mar del plata', clicks: 512, impressions: 3940, ctr: 12.99, position: 2.1, diff: '+0.8' },
  { keyword: 'arreglo pin de carga motorola mar del plata', clicks: 438, impressions: 3150, ctr: 13.90, position: 2.3, diff: '+0.4' },
  { keyword: 'montec reparaciones mar del plata', clicks: 395, impressions: 1240, ctr: 31.85, position: 1.0, diff: '0.0' },
  { keyword: 'reparacion notebook mar del plata', clicks: 348, impressions: 5620, ctr: 6.19, position: 3.1, diff: '+1.2' },
  { keyword: 'cambio pantalla samsung s23 mar del plata', clicks: 284, impressions: 3410, ctr: 8.32, position: 2.8, diff: '+0.6' },
  { keyword: 'reparar motherboard pc gamer mdp', clicks: 215, impressions: 4180, ctr: 5.14, position: 3.5, diff: '-0.2' },
  { keyword: 'tecnico celulares a domicilio mar del plata', clicks: 192, impressions: 2840, ctr: 6.76, position: 4.2, diff: '+0.9' },
  { keyword: 'cambio de vidrio camara iphone 13 mdp', clicks: 178, impressions: 1960, ctr: 9.08, position: 1.9, diff: '+0.7' },
  { keyword: 'reparacion bisagra notebook lenovo', clicks: 164, impressions: 2310, ctr: 7.09, position: 2.6, diff: '+0.3' },
  { keyword: 'mantenimiento pasta termica ps5 mar del plata', clicks: 142, impressions: 3250, ctr: 4.36, position: 4.8, diff: '-0.4' },
  { keyword: 'pantalla motorola g54 mar del plata precio', clicks: 129, impressions: 1870, ctr: 6.89, position: 3.3, diff: '+0.4' },
  { keyword: 'cuanto cuesta cambiar bateria iphone 11 mdp', clicks: 118, impressions: 1640, ctr: 7.19, position: 2.7, diff: '+0.5' }
];

const MOCK_PAGES = [
  { url: 'https://montec.com.ar/', clicks: 2150, impressions: 28400, ctr: 7.57, position: 1.9 },
  { url: 'https://montec.com.ar/#cotizador', clicks: 1480, impressions: 19200, ctr: 7.70, position: 2.2 },
  { url: 'https://montec.com.ar/#iphone-precios', clicks: 820, impressions: 11400, ctr: 7.19, position: 2.5 },
  { url: 'https://montec.com.ar/#contacto-local', clicks: 370, impressions: 6800, ctr: 5.44, position: 3.1 }
];

export default function SearchConsoleTab() {
  const { panelTheme } = useData();
  const isLight = panelTheme === 'light';

  // Filtros y estados
  const [dateRange, setDateRange] = useState('30d');
  const [activeMetric, setActiveMetric] = useState('both'); // 'clicks', 'impressions', 'both'
  const [searchTerm, setSearchTerm] = useState('');
  const [subTab, setSubTab] = useState('queries'); // 'queries' | 'pages'
  const [deviceFilter, setDeviceFilter] = useState('all'); // 'all' | 'mobile' | 'desktop'
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [isLoadingLive, setIsLoadingLive] = useState(true);

  const loadLiveSearchData = async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    try {
      const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;
      const res = await searchConsoleApi.getSearchPerformance(days);
      if (res && res.success) {
        setLiveData(res);
        if (isManual) {
          setSyncToast(res.hasData 
            ? 'Datos sincronizados con Google Search Console API' 
            : 'Conectado a Google Search Console (Esperando primeras métricas)');
        }
      }
    } catch (e) {
      console.error('Error al cargar Search Console:', e);
    } finally {
      setIsLoadingLive(false);
      if (isManual) {
        setIsSyncing(false);
        setTimeout(() => setSyncToast(null), 4000);
      }
    }
  };

  useEffect(() => {
    loadLiveSearchData(false);
  }, [dateRange]);

  // Selección de datos: Real si existe y tiene datos, sino datos de referencia (Mock)
  const activeDailyData = useMemo(() => {
    if (liveData?.hasData && liveData?.dailyData?.length > 0) {
      return liveData.dailyData;
    }
    return MOCK_DAILY_SEO_DATA;
  }, [liveData]);

  const activeQueries = useMemo(() => {
    if (liveData?.hasData && liveData?.queries?.length > 0) {
      return liveData.queries.map(q => ({
        keyword: q.query,
        clicks: q.clicks,
        impressions: q.impressions,
        ctr: q.ctr,
        position: q.position,
        diff: '0.0'
      }));
    }
    return MOCK_SEARCH_QUERIES;
  }, [liveData]);

  const activePages = useMemo(() => {
    if (liveData?.hasData && liveData?.pages?.length > 0) {
      return liveData.pages;
    }
    return MOCK_PAGES;
  }, [liveData]);

  // Cálculos de KPIs consolidados
  const totalClicks = useMemo(() => {
    if (liveData?.hasData && liveData?.summary) return liveData.summary.totalClicks;
    return activeDailyData.reduce((acc, curr) => acc + curr.clicks, 0);
  }, [liveData, activeDailyData]);

  const totalImpressions = useMemo(() => {
    if (liveData?.hasData && liveData?.summary) return liveData.summary.totalImpressions;
    return activeDailyData.reduce((acc, curr) => acc + curr.impressions, 0);
  }, [liveData, activeDailyData]);

  const avgCtr = useMemo(() => {
    if (liveData?.hasData && liveData?.summary) return liveData.summary.avgCtr.toFixed(2);
    return totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  }, [liveData, totalClicks, totalImpressions]);

  const avgPosition = useMemo(() => {
    if (liveData?.hasData && liveData?.summary) return liveData.summary.avgPosition.toFixed(1);
    const sum = activeDailyData.reduce((acc, curr) => acc + curr.position, 0);
    return activeDailyData.length > 0 ? (sum / activeDailyData.length).toFixed(1) : '0.0';
  }, [liveData, activeDailyData]);

  // Filtrado de queries
  const filteredQueries = useMemo(() => {
    return activeQueries.filter(item =>
      item.keyword.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [activeQueries, searchTerm]);

  const handleSync = () => {
    loadLiveSearchData(true);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Palabra Clave,Clics,Impresiones,CTR (%),Posicion\n"
      + filteredQueries.map(e => `"${e.keyword}",${e.clicks},${e.impressions},${e.ctr},${e.position}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `search_console_montec_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Tooltip para el gráfico de Recharts con estética Dark Montec
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-xl shadow-2xl border text-xs backdrop-blur-md ${
          isLight ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-[#121215]/95 border-zinc-700/80 text-zinc-200'
        }`}>
          <p className="font-bold text-zinc-400 mb-2 border-b border-zinc-700/50 pb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#FF5500]" />
            {label}
          </p>
          <div className="space-y-1.5">
            {payload.map((entry, index) => (
              <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                  {entry.name}:
                </span>
                <span className="font-mono font-bold text-white">
                  {entry.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notificación */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-[0_0_25px_rgba(16,185,129,0.5)] animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Header del Tab */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 shadow-sm">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-xl sm:text-2xl font-heading font-bold flex items-center gap-2 flex-wrap ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Google Search Console
                {liveData?.isLive ? (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    API Conectada (OAuth2)
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Modo Simulación
                  </span>
                )}
              </h2>
              <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                Rendimiento de búsqueda orgánica en Google para <strong className="text-zinc-200">montec.ar</strong> en Mar del Plata.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones y Filtros de Fecha */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de Período */}
          <div className={`flex items-center rounded-xl p-1 border ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <button
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateRange === '7d' 
                  ? 'bg-[#FF5500] text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateRange === '30d' 
                  ? 'bg-[#FF5500] text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              28 Días
            </button>
            <button
              onClick={() => setDateRange('90d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateRange === '90d' 
                  ? 'bg-[#FF5500] text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              3 Meses
            </button>
          </div>

          {/* Botón Sincronizar */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#FF5500]' : ''}`} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>

          {/* Botón Exportar */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold transition-all cursor-pointer"
            title="Exportar palabras clave a CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Banner Informativo de API en Vivo */}
      {liveData?.isLive && !liveData?.hasData && (
        <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start sm:items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">
                ¡Conexión en vivo confirmada con Google Search Console! (Propiedad: {liveData?.siteUrl || 'sc-domain:montec.ar'})
              </p>
              <p className="text-zinc-300 text-xs mt-0.5">
                Google verificó tu dominio y procesó el sitemap. Comenzará a registrar tus primeras visitas reales en las próximas 24 a 48 hs. Mientras tanto, tu panel muestra datos de referencia estimados.
              </p>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-white font-bold text-xs shrink-0 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Consultar Ahora</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4 TARJETAS DE KPIS SUPERIORES                                   */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Clics Orgánicos */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/90 border-zinc-800/80 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Clics Orgánicos
            </span>
            <div className="p-2 rounded-xl bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              {totalClicks.toLocaleString()}
            </h3>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              +14.2%
            </span>
          </div>
          <p className={`text-[11px] mt-2 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
            Usuarios directos que ingresaron desde Google Search
          </p>
        </div>

        {/* KPI 2: Impresiones */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/90 border-zinc-800/80 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Impresiones
            </span>
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              {totalImpressions.toLocaleString()}
            </h3>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              +8.7%
            </span>
          </div>
          <p className={`text-[11px] mt-2 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
            Veces que Montec apareció en los resultados de Google
          </p>
        </div>

        {/* KPI 3: CTR Promedio */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/90 border-zinc-800/80 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              CTR Promedio
            </span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              {avgCtr}%
            </h3>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              +0.5 pts
            </span>
          </div>
          <p className={`text-[11px] mt-2 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
            Tasa de clics por cada impresión orgánica lograda
          </p>
        </div>

        {/* KPI 4: Posición Media */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/90 border-zinc-800/80 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Posición Media
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              {avgPosition}
            </h3>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              +0.8 subió
            </span>
          </div>
          <p className={`text-[11px] mt-2 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
            Ranking promedio ponderado en la página 1 de Google
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ÁREA CENTRAL: GRÁFICO DE EVOLUCIÓN (CLICS VS IMPRESIONES)      */}
      {/* ============================================================== */}
      <div className={`p-5 sm:p-6 rounded-2xl border ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/90 border-zinc-800/80 shadow-lg'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className={`font-heading font-bold text-base sm:text-lg flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <BarChart3 className="w-5 h-5 text-[#FF5500]" />
              Evolución de Clics vs Impresiones Orgánicas
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Desempeño diario en los últimos 30 días en Google Search
            </p>
          </div>

          {/* Toggle de Visualización de Métricas */}
          <div className={`inline-flex items-center p-1 rounded-xl border text-xs font-semibold ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-zinc-950 border-zinc-800'
          }`}>
            <button
              onClick={() => setActiveMetric('clicks')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeMetric === 'clicks'
                  ? 'bg-[#FF5500] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Solo Clics
            </button>
            <button
              onClick={() => setActiveMetric('impressions')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeMetric === 'impressions'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Solo Impresiones
            </button>
            <button
              onClick={() => setActiveMetric('both')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeMetric === 'both'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ambos (Comparativa)
            </button>
          </div>
        </div>

        {/* Gráfico Recharts con ResponsiveContainer */}
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeDailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {/* Degradado Clics (Naranja Montec) */}
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF5500" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#FF5500" stopOpacity={0.0} />
                </linearGradient>
                {/* Degradado Impresiones (Azul Cielo) */}
                <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#27272A'} vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke={isLight ? '#94A3B8' : '#71717A'} 
                fontSize={11}
                tickLine={false}
              />
              <YAxis 
                yAxisId="left"
                stroke={isLight ? '#94A3B8' : '#71717A'} 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              {activeMetric === 'both' && (
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#38BDF8" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
              />
              {(activeMetric === 'both' || activeMetric === 'clicks') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="clicks"
                  name="Clics Orgánicos"
                  stroke="#FF5500"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorClicks)"
                />
              )}
              {(activeMetric === 'both' || activeMetric === 'impressions') && (
                <Area
                  yAxisId={activeMetric === 'both' ? 'right' : 'left'}
                  type="monotone"
                  dataKey="impressions"
                  name="Impresiones"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorImpressions)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Resumen al pie del gráfico */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500]" />
              Picos de clics: <strong>Lunes y Miércoles</strong>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              Mayor volumen de búsquedas: <strong>14:00 a 20:00 hs</strong>
            </span>
          </div>
          <span className="text-zinc-500 font-mono">
            Última actualización: Hoy {new Date().toLocaleDateString('es-AR')}
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN INFERIOR: CONSULTAS DE BÚSQUEDA Y PÁGINAS              */}
      {/* ============================================================== */}
      <div className={`rounded-2xl border overflow-hidden ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/90 border-zinc-800/80 shadow-lg'
      }`}>
        {/* Cabecera de la tabla y buscador */}
        <div className="p-5 border-b border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex rounded-xl p-1 border ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-zinc-950 border-zinc-800'
            }`}>
              <button
                onClick={() => setSubTab('queries')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  subTab === 'queries'
                    ? 'bg-[#FF5500] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Consultas ({filteredQueries.length})
              </button>
              <button
                onClick={() => setSubTab('pages')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  subTab === 'pages'
                    ? 'bg-[#FF5500] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Páginas Principales ({activePages.length})
              </button>
            </div>
          </div>

          {/* Buscador de keywords */}
          <div className="relative w-full md:w-80">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isLight ? 'text-slate-400' : 'text-zinc-500'
            }`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por palabra clave..."
              className={`w-full border rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm outline-none focus:border-[#FF5500] transition-colors ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  : 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500'
              }`}
            />
          </div>
        </div>

        {/* Tabla de Consultas (Queries) */}
        {subTab === 'queries' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-400'
                }`}>
                  <th className="py-3.5 px-4 sm:px-6">Palabra Clave</th>
                  <th className="py-3.5 px-4 text-right">Clics</th>
                  <th className="py-3.5 px-4 text-right">Impresiones</th>
                  <th className="py-3.5 px-4 text-right">CTR</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Posición</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-xs sm:text-sm">
                {filteredQueries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      No se encontraron consultas para "{searchTerm}"
                    </td>
                  </tr>
                ) : (
                  filteredQueries.map((item, idx) => {
                    const isTop3 = item.position <= 3;
                    const isFirstPage = item.position <= 10;
                    return (
                      <tr 
                        key={idx} 
                        className={`transition-colors ${
                          isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/40'
                        }`}
                      >
                        <td className="py-3.5 px-4 sm:px-6 font-medium text-white flex items-center gap-2">
                          <span className="text-zinc-400 font-mono text-xs w-5">{idx + 1}.</span>
                          <span className="text-zinc-200 font-semibold">{item.keyword}</span>
                          {item.position === 1.0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/40">
                              #1 TOP
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                          {item.clicks.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-zinc-400">
                          {item.impressions.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono">
                          <span className={`font-semibold ${
                            item.ctr > 10 ? 'text-emerald-400' : item.ctr > 6 ? 'text-amber-400' : 'text-zinc-400'
                          }`}>
                            {item.ctr}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right font-mono">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            isTop3
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : isFirstPage
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            {item.position.toFixed(1)}
                            <span className="text-[10px] text-zinc-400 font-normal">
                              ({item.diff})
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabla de Páginas Principales */}
        {subTab === 'pages' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-400'
                }`}>
                  <th className="py-3.5 px-4 sm:px-6">URL de la Página</th>
                  <th className="py-3.5 px-4 text-right">Clics</th>
                  <th className="py-3.5 px-4 text-right">Impresiones</th>
                  <th className="py-3.5 px-4 text-right">CTR</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Posición Media</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-xs sm:text-sm">
                {activePages.map((page, idx) => (
                  <tr key={idx} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/40'}>
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                      <a 
                        href={page.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-zinc-200 hover:text-[#FF5500] underline-offset-2 hover:underline truncate max-w-md font-mono text-xs"
                      >
                        {page.url}
                      </a>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      {page.clicks.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-400">
                      {page.impressions.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400">
                      {page.ctr}%
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right font-mono">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                        {page.position.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
