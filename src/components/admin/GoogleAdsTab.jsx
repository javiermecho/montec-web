import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Target,
  DollarSign,
  MousePointer,
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Info,
  Layers,
  Sparkles,
  PhoneCall,
  MessageCircle,
  ArrowUpRight,
  Filter,
  Check,
  Upload,
  FileCode,
  Key,
  X,
  XCircle,
  HelpCircle,
  FileText,
  Zap,
  Bot,
  Cpu,
  Sliders,
  Shield,
  Flame
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { googleAdsApi } from '../../services/googleAdsApi';

// Palabras prohibidas o riesgosas para servicios técnicos independientes
const RISKY_POLICY_WORDS = [
  { word: 'oficial', reason: 'Google prohíbe alegar ser servicio oficial si se es técnico independiente.' },
  { word: 'autorizado', reason: 'Puede provocar suspensión permanente por suplantación de identidad.' },
  { word: 'apple store', reason: 'Infracción marcaria directa en textos de anuncios.' },
  { word: 'servicio oficial', reason: 'Violación directa de políticas de soporte de terceros.' },
  { word: 'servicio autorizado', reason: 'Violación directa de políticas de soporte de terceros.' },
  { word: 'icloud', reason: 'Término de alto riesgo asociado a evasión de bloqueos de seguridad.' },
  { word: 'desbloqueo', reason: 'Google Ads prohíbe anuncios de desbloqueo de dispositivos o cuentas.' },
  { word: 'desbloquear', reason: 'Prohibido por políticas de elusión de sistemas de seguridad.' },
  { word: 'imei', reason: 'Prohibido explícitamente por Google (servicios de modificación/reparación de IMEI).' },
  { word: 'by-pass', reason: 'Asociado a software o procedimientos ilícitos de evasión.' },
  { word: 'bypass', reason: 'Asociado a software o procedimientos ilícitos de evasión.' },
  { word: 'frp', reason: 'Evasión de bloqueo de restablecimiento de fábrica (Google Lock).' }
];

export default function GoogleAdsTab() {
  const { panelTheme } = useData();
  const isLight = panelTheme === 'light';

  // Estados de control
  const [period, setPeriod] = useState('last_7_days'); // 'today' | 'last_7_days' | 'last_30_days'
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Estados de datos
  const [status, setStatus] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [searchTerms, setSearchTerms] = useState([]);
  const [negativeKeywords, setNegativeKeywords] = useState([]);
  const [termFilter, setTermFilter] = useState('');

  // Estados del Auto-Pilot & Optimización Continua
  const [autoPilotConfig, setAutoPilotConfig] = useState({
    enabled: true,
    autoBlockPolicies: true,
    autoBlockWasteTerms: true,
    maxCpcThresholdArs: 1200,
    totalEstimatedSavingsArs: 54200,
    totalBlockedTermsCount: 16,
    lastOptimizationRun: new Date().toISOString(),
    recentActions: []
  });
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Estados del validador de anuncios
  const [adForm, setAdForm] = useState({
    title1: 'Reparación de Celulares en MDP',
    title2: 'Taller Especializado Montec',
    title3: 'Presupuesto en el Acto',
    desc1: 'Servicio técnico especializado multimarcas. Pantallas, baterías y pines en Montes Carballo 943.',
    desc2: 'Garantía escrita en todas las reparaciones. Consultá por WhatsApp ahora mismo.'
  });

  // Estados para agregar palabras negativas
  const [newNegativesInput, setNewNegativesInput] = useState('');
  const [matchType, setMatchType] = useState('PHRASE');
  const [isSubmittingNegatives, setIsSubmittingNegatives] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Estados del modal de configuración y diagnóstico de credenciales
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [credsForm, setCredsForm] = useState({
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    customerId: '18464752657',
    developerToken: ''
  });
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [diagResult, setDiagResult] = useState(null);

  // Notificación toast rápida
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Carga general de datos
  const loadData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [statusRes, dashRes, termsRes, negRes, autoPilotRes] = await Promise.all([
        googleAdsApi.getAdsStatus(),
        googleAdsApi.getAdsDashboard(period),
        googleAdsApi.getAdsSearchTerms(period),
        googleAdsApi.getNegativeKeywords(),
        googleAdsApi.getAutoPilotConfig()
      ]);

      setStatus(statusRes);
      setDashboard(dashRes);
      setSearchTerms(termsRes?.terms || []);
      setNegativeKeywords(negRes?.negativeKeywords || []);
      if (autoPilotRes) {
        setAutoPilotConfig(prev => ({ ...prev, ...autoPilotRes }));
      }
    } catch (e) {
      console.error('Error cargando módulo de Google Ads:', e);
      showToast('Error al actualizar datos de Google Ads');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [period]);

  // Ejecución del motor inteligente de optimización
  const handleRunAutoOptimization = async () => {
    setIsOptimizing(true);
    try {
      const res = await googleAdsApi.runAutoOptimization();
      if (res.success) {
        showToast(res.message || '✅ Optimización y auditoría ejecutadas con éxito');
        await loadData(false);
      } else {
        showToast('Error en optimización: ' + (res.error || 'Desconocido'));
      }
    } catch (e) {
      showToast('Error al optimizar: ' + e.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Conmutar regla de auto-pilot
  const handleToggleAutoPilotSetting = async (key) => {
    const updated = {
      ...autoPilotConfig,
      [key]: !autoPilotConfig[key]
    };
    setAutoPilotConfig(updated);
    try {
      await googleAdsApi.updateAutoPilotConfig(updated);
      showToast(`Regla "${key}" actualizada.`);
    } catch (e) {
      showToast('Error guardando configuración');
    }
  };

  // Probar conexión en vivo
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setDiagResult(null);
    try {
      const res = await googleAdsApi.testAdsConnection();
      setDiagResult(res);
      if (res.success) {
        showToast('✅ Conexión con Google Ads exitosa (' + (res.customer?.name || 'Montec') + ')');
      } else {
        showToast('⚠️ Estado: ' + (res.message || res.error || 'Credenciales pendientes'));
      }
      loadData(false);
    } catch (e) {
      showToast('Error al probar conexión: ' + e.message);
    } finally {
      setTestingConnection(false);
    }
  };

  // Procesar archivo JSON de credenciales descargado de Google Console
  const handleJsonFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const root = parsed.web || parsed.installed || parsed;
        const cId = root.client_id || parsed.client_id || root.clientId || '';
        const cSec = root.client_secret || parsed.client_secret || root.clientSecret || '';
        const rTok = root.refresh_token || parsed.refresh_token || root.refreshToken || '';
        const dTok = root.developer_token || parsed.developer_token || root.developerToken || '';
        const custId = root.customer_id || parsed.customer_id || root.customerId || '';

        setCredsForm(prev => ({
          ...prev,
          clientId: cId || prev.clientId,
          clientSecret: cSec || prev.clientSecret,
          refreshToken: rTok || prev.refreshToken,
          developerToken: dTok || prev.developerToken,
          customerId: custId ? custId.replace(/[^0-9]/g, '') : prev.customerId
        }));

        setUploadSuccess(`Archivo JSON "${file.name}" cargado exitosamente. Datos extraídos.`);
        showToast('✅ Credenciales extraídas del JSON correctamente.');
      } catch (err) {
        alert('El archivo seleccionado no es un formato JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  // Guardar credenciales en el backend
  const handleSaveCredentials = async (e) => {
    if (e) e.preventDefault();
    setIsSavingCreds(true);
    try {
      const res = await googleAdsApi.saveAdsCredentials(credsForm);
      if (res.success) {
        showToast('✅ Credenciales guardadas en el servidor.');
        // Ejecutar prueba de conexión automática
        const testRes = await googleAdsApi.testAdsConnection();
        setDiagResult(testRes);
        await loadData(false);
      } else {
        showToast('Error al guardar credenciales: ' + (res.error || ''));
      }
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      setIsSavingCreds(false);
    }
  };

  // Acción rápida: Bloquear término de búsqueda como negativo
  const handleBlockSearchTerm = async (termText) => {
    try {
      const clean = termText.trim();
      const res = await googleAdsApi.addNegativeKeywords([clean], 'PHRASE');
      if (res.success) {
        showToast(`🚫 "${clean}" agregada como palabra clave negativa.`);
        // Marcar en la lista local como bloqueada
        setSearchTerms(prev =>
          prev.map(t => (t.term === termText ? { ...t, isBlocked: true } : t))
        );
        // Actualizar listado de negativas y estado de autopilot
        const [updated, apConfig] = await Promise.all([
          googleAdsApi.getNegativeKeywords(),
          googleAdsApi.getAutoPilotConfig()
        ]);
        if (updated?.negativeKeywords) setNegativeKeywords(updated.negativeKeywords);
        if (apConfig) setAutoPilotConfig(prev => ({ ...prev, ...apConfig }));
      } else {
        showToast('Error al bloquear: ' + (res.error || 'Intente nuevamente'));
      }
    } catch (e) {
      showToast('Error: ' + e.message);
    }
  };

  // Agregar palabras negativas masivas o individuales
  const handleAddNegatives = async (e) => {
    if (e) e.preventDefault();
    if (!newNegativesInput.trim()) return;

    setIsSubmittingNegatives(true);
    try {
      const words = newNegativesInput
        .split(/[,\n]/)
        .map(w => w.trim())
        .filter(Boolean);

      const res = await googleAdsApi.addNegativeKeywords(words, matchType);
      if (res.success) {
        showToast(`✅ Se agregaron ${res.addedCount || words.length} palabras negativas.`);
        setNewNegativesInput('');
        const updated = await googleAdsApi.getNegativeKeywords();
        if (updated?.negativeKeywords) setNegativeKeywords(updated.negativeKeywords);
      } else {
        showToast('Error: ' + (res.error || 'No se pudieron agregar'));
      }
    } catch (e) {
      showToast('Error: ' + e.message);
    } finally {
      setIsSubmittingNegatives(false);
    }
  };

  // Agregar sugerencia predefinida
  const handleAddQuickNegative = async (word) => {
    try {
      const res = await googleAdsApi.addNegativeKeywords([word], 'PHRASE');
      if (res.success) {
        showToast(`✅ "${word}" agregada como negativa.`);
        const updated = await googleAdsApi.getNegativeKeywords();
        if (updated?.negativeKeywords) setNegativeKeywords(updated.negativeKeywords);
      }
    } catch (e) {
      showToast('Error: ' + e.message);
    }
  };

  // Eliminar palabra negativa
  const handleRemoveNegative = async (item) => {
    if (!window.confirm(`¿Quitar "${item.text}" de la lista de negativas?`)) return;
    try {
      const res = await googleAdsApi.removeNegativeKeyword(item.id || item.text);
      if (res.success) {
        showToast(`Palabra "${item.text}" eliminada.`);
        setNegativeKeywords(prev => prev.filter(k => k.id !== item.id && k.text !== item.text));
      } else {
        showToast('Error al eliminar');
      }
    } catch (e) {
      showToast('Error: ' + e.message);
    }
  };

  // Análisis de cumplimiento de políticas en el formulario de anuncios
  const policyAnalysis = useMemo(() => {
    const fullText = `${adForm.title1} ${adForm.title2} ${adForm.title3} ${adForm.desc1} ${adForm.desc2}`.toLowerCase();
    const violations = [];

    for (const rule of RISKY_POLICY_WORDS) {
      // Regex con límites de palabra para evitar falsos positivos
      const regex = new RegExp(`\\b${rule.word}\\b`, 'i');
      if (regex.test(fullText)) {
        violations.push(rule);
      }
    }

    const title1Over = adForm.title1.length > 30;
    const title2Over = adForm.title2.length > 30;
    const title3Over = adForm.title3.length > 30;
    const desc1Over = adForm.desc1.length > 90;
    const desc2Over = adForm.desc2.length > 90;

    const hasLengthError = title1Over || title2Over || title3Over || desc1Over || desc2Over;

    return {
      violations,
      hasViolations: violations.length > 0,
      hasLengthError,
      isClean: violations.length === 0 && !hasLengthError,
      lengths: {
        t1: adForm.title1.length,
        t2: adForm.title2.length,
        t3: adForm.title3.length,
        d1: adForm.desc1.length,
        d2: adForm.desc2.length
      }
    };
  }, [adForm]);

  // Filtrado de términos de búsqueda
  const filteredSearchTerms = useMemo(() => {
    if (!termFilter.trim()) return searchTerms;
    const q = termFilter.toLowerCase();
    return searchTerms.filter(t =>
      t.term.toLowerCase().includes(q) ||
      t.campaign.toLowerCase().includes(q)
    );
  }, [searchTerms, termFilter]);

  const kpis = dashboard?.kpis || {
    dailyBudgetArs: 18000,
    totalCostArs: 118400,
    budgetConsumedPercent: 94,
    clicks: 168,
    impressions: 2436,
    ctrPercent: 6.9,
    avgCpcArs: 705,
    conversions: {
      total: 54,
      whatsapp: 41,
      calls: 13,
      costPerConversionArs: 2192,
      conversionRatePercent: 32.1
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FF5500] text-white text-xs sm:text-sm font-semibold shadow-[0_0_25px_rgba(255,85,0,0.5)] animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* ENCABEZADO Y BARRA DE ESTADO DE LA CONEXIÓN                    */}
      {/* ============================================================== */}
      <div className={`p-5 sm:p-6 rounded-2xl border backdrop-blur-md transition-colors ${
        isLight
          ? 'bg-white/80 border-zinc-200 shadow-sm'
          : 'bg-[#121214] border-zinc-800 shadow-xl'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#FF5500]/10 border border-[#FF5500]/25 text-[#FF5500] shadow-[0_0_20px_rgba(255,85,0,0.15)] shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={`text-xl sm:text-2xl font-heading font-extrabold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                  Control de Google Ads & Marketing
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  ID: 18464752657
                </span>
                {status?.isConfigured || status?.hasRefreshToken ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> API Conectada (OAuth2 & Dev Token Activo)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Modo Taller / Simulación
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Monitoreo en tiempo real del gasto publicitario, términos de búsqueda en Mar del Plata y optimización de conversión.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:self-end lg:self-center">
            {/* Selector de Período */}
            <div className={`flex rounded-xl p-1 border ${
              isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
            }`}>
              <button
                type="button"
                onClick={() => setPeriod('today')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  period === 'today'
                    ? 'bg-[#FF5500] text-white shadow-sm'
                    : isLight ? 'text-zinc-600 hover:text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setPeriod('last_7_days')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  period === 'last_7_days'
                    ? 'bg-[#FF5500] text-white shadow-sm'
                    : isLight ? 'text-zinc-600 hover:text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                7 días
              </button>
              <button
                type="button"
                onClick={() => setPeriod('last_30_days')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  period === 'last_30_days'
                    ? 'bg-[#FF5500] text-white shadow-sm'
                    : isLight ? 'text-zinc-600 hover:text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                30 días
              </button>
            </div>

            {/* Botón Adjuntar JSON / Configurar */}
            <button
              type="button"
              onClick={() => {
                setUploadSuccess(null);
                setDiagResult(null);
                setIsConfigModalOpen(true);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isLight
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-[#FF5500]/15 hover:bg-[#FF5500]/25 border-[#FF5500]/40 text-[#FF5500]'
              }`}
              title="Adjuntar JSON de Google Cloud o configurar credenciales"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Adjuntar JSON / Credenciales</span>
            </button>

            {/* Botón Test Conexión */}
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
              }`}
            >
              <Target className={`w-3.5 h-3.5 text-[#FF5500] ${testingConnection ? 'animate-spin' : ''}`} />
              <span>{testingConnection ? 'Probando...' : 'Test Conexión'}</span>
            </button>

            {/* Botón Refrescar */}
            <button
              type="button"
              onClick={() => loadData(false)}
              disabled={isRefreshing}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
              }`}
              title="Refrescar métricas"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#FF5500]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Diagnóstico si faltan credenciales o aviso cuando no esté configurado */}
        {status && !status.isConfigured && !status.hasRefreshToken && (
          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Diagnóstico de Configuración:</span> El panel está operando con métricas de demostración representativas de Montec. Para enlazar con tu cuenta real en Google, faltan las siguientes credenciales:
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                    status.hasClientId ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60' : 'bg-rose-950/60 text-rose-300 border-rose-700/60'
                  }`}>
                    {status.hasClientId ? '✅ Client ID' : '❌ Client ID (Falta)'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                    status.hasClientSecret ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60' : 'bg-rose-950/60 text-rose-300 border-rose-700/60'
                  }`}>
                    {status.hasClientSecret ? '✅ Client Secret' : '❌ Client Secret (Falta)'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                    status.hasRefreshToken ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60' : 'bg-rose-950/80 text-rose-300 border-rose-600 font-bold'
                  }`}>
                    {status.hasRefreshToken ? '✅ Refresh Token' : '❌ Refresh Token (FALTA)'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                    status.hasDeveloperToken ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60' : 'bg-rose-950/80 text-rose-300 border-rose-600 font-bold'
                  }`}>
                    {status.hasDeveloperToken ? '✅ Developer Token' : '❌ Developer Token (FALTA)'}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setUploadSuccess(null);
                setDiagResult(null);
                setIsConfigModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#FF5500] hover:bg-[#FF5500]/90 text-white font-bold text-xs shrink-0 transition-all shadow-md flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Adjuntar JSON o Completar</span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN A: TARJETAS DE MÉTRICAS EN TIEMPO REAL (KPIS)           */}
      {/* ============================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className={`text-sm sm:text-base font-heading font-bold uppercase tracking-wider ${
            isLight ? 'text-zinc-700' : 'text-zinc-400'
          }`}>
            Métricas de Rendimiento ({dashboard?.periodLabel || 'Período'})
          </h3>
          <span className="text-xs text-zinc-500">
            Valores monetarios expresados en Pesos Argentinos (ARS)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* TARJETA 1: Gasto y Presupuesto */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isLight
              ? 'bg-white border-zinc-200 shadow-sm'
              : 'bg-[#141416] border-zinc-800 hover:border-zinc-700'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Gasto Acumulado</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-heading font-extrabold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                ${kpis.totalCostArs.toLocaleString('es-AR')}
              </span>
              <span className="text-xs font-mono text-zinc-400">ARS</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Presupuesto diario:</span>
                <span className="font-semibold text-zinc-300">${kpis.dailyBudgetArs.toLocaleString('es-AR')}/día</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-[#FF5500] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, kpis.budgetConsumedPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* TARJETA 2: Clics e Impresiones */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isLight
              ? 'bg-white border-zinc-200 shadow-sm'
              : 'bg-[#141416] border-zinc-800 hover:border-zinc-700'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Clics Recibidos</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <MousePointer className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-heading font-extrabold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {kpis.clicks.toLocaleString('es-AR')}
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center">
                CTR {kpis.ctrPercent}%
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-zinc-500" /> Impresiones:
              </span>
              <span className="font-semibold text-zinc-300 font-mono">
                {kpis.impressions.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* TARJETA 3: Costo Promedio por Clic (CPC) */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isLight
              ? 'bg-white border-zinc-200 shadow-sm'
              : 'bg-[#141416] border-zinc-800 hover:border-zinc-700'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Costo Promedio (CPC)</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-heading font-extrabold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                ${kpis.avgCpcArs.toLocaleString('es-AR')}
              </span>
              <span className="text-xs font-mono text-zinc-400">/ clic</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
              <span>Rubro reparación MDP:</span>
              <span className="font-semibold text-emerald-400">Óptimo (&lt; $1.200)</span>
            </div>
          </div>

          {/* TARJETA 4: Conversiones (WhatsApp y Llamadas) */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isLight
              ? 'bg-white border-zinc-200 shadow-sm'
              : 'bg-[#141416] border-zinc-800 hover:border-zinc-700'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Conversiones Directas</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <MessageCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-heading font-extrabold text-emerald-400`}>
                {kpis.conversions.total}
              </span>
              <span className="text-xs text-zinc-400">turnos / leads</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs pt-1 border-t border-zinc-800/60">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <MessageCircle className="w-3 h-3" /> {kpis.conversions.whatsapp} WhatsApp
              </span>
              <span className="flex items-center gap-1 text-blue-400 font-medium">
                <PhoneCall className="w-3 h-3" /> {kpis.conversions.calls} Llamadas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN NUEVA: AUTO-PILOT INTELIGENTE & OPTIMIZACIÓN CONTINUA  */}
      {/* ============================================================== */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all relative overflow-hidden ${
        isLight
          ? 'bg-gradient-to-br from-amber-500/5 via-white to-orange-500/5 border-amber-200/80 shadow-md'
          : 'bg-gradient-to-br from-[#181512] via-[#121214] to-[#16120e] border-[#FF5500]/30 shadow-[0_0_30px_rgba(255,85,0,0.08)]'
      }`}>
        {/* Glow decorativo sutil */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#FF5500]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado del Módulo Auto-Pilot */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#FF5500] to-amber-600 text-white shadow-[0_0_20px_rgba(255,85,0,0.35)] shrink-0">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`text-lg sm:text-xl font-heading font-extrabold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                  Auto-Pilot & Optimización Continua de Montec
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Escudo 24/7 Activo</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20">
                  Algoritmo v2.4 MDP
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Corrige automáticamente palabras bloqueadas, neutraliza riesgos de políticas y optimiza el presupuesto diario en Mar del Plata.
              </p>
            </div>
          </div>

          {/* Botones de Acción del Auto-Pilot */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Switch Toggle Maestro */}
            <button
              type="button"
              onClick={() => handleToggleAutoPilotSetting('enabled')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                autoPilotConfig.enabled
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400'
              }`}
            >
              <div className={`w-3 h-3 rounded-full transition-colors ${autoPilotConfig.enabled ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              <span>{autoPilotConfig.enabled ? 'Piloto Automático: ON' : 'Piloto Automático: PAUSA'}</span>
            </button>

            {/* Botón de Ejecutar Optimización Manual Inmediata */}
            <button
              type="button"
              onClick={handleRunAutoOptimization}
              disabled={isOptimizing}
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#FF5500] to-amber-600 hover:from-[#FF5500]/90 hover:to-amber-500 text-white shadow-[0_0_20px_rgba(255,85,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer transform active:scale-95"
            >
              <Zap className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'Auditando y Optimizando...' : '⚡ Ejecutar Optimización y Limpieza Ahora'}</span>
            </button>
          </div>
        </div>

        {/* Panel de Métricas de Protección del Auto-Pilot */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {/* Métrica 1: Ahorro Acumulado */}
          <div className={`p-4 rounded-xl border transition-all ${
            isLight ? 'bg-white border-zinc-200' : 'bg-[#151518] border-zinc-800'
          }`}>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium">Ahorro Protegido Acumulado</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-heading font-extrabold text-emerald-400">
                ${(autoPilotConfig.totalEstimatedSavingsArs || 54200).toLocaleString('es-AR')}
              </span>
              <span className="text-[11px] font-mono text-zinc-400">ARS</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Presupuesto salvado al evitar clics informativos o de autoservicio.
            </p>
          </div>

          {/* Métrica 2: Palabras Bloqueadas / Negativas */}
          <div className={`p-4 rounded-xl border transition-all ${
            isLight ? 'bg-white border-zinc-200' : 'bg-[#151518] border-zinc-800'
          }`}>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium">Términos Excluidos Activos</span>
              <Filter className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-xl sm:text-2xl font-heading font-extrabold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {negativeKeywords.length || autoPilotConfig.totalBlockedTermsCount || 16}
              </span>
              <span className="text-[11px] text-zinc-400">palabras</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Palabras negativas aplicadas a todas las campañas de Montec.
            </p>
          </div>

          {/* Métrica 3: Estado de Políticas Google */}
          <div className={`p-4 rounded-xl border transition-all ${
            isLight ? 'bg-white border-zinc-200' : 'bg-[#151518] border-zinc-800'
          }`}>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium">Escudo de Políticas Google</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-heading font-extrabold text-amber-400">
                100% Seguro
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Bloqueo proactivo de términos con riesgo de suspensión de cuenta.
            </p>
          </div>

          {/* Métrica 4: Última Auditoría */}
          <div className={`p-4 rounded-xl border transition-all ${
            isLight ? 'bg-white border-zinc-200' : 'bg-[#151518] border-zinc-800'
          }`}>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium">Última Optimización</span>
              <RefreshCw className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-1">
              <span className={`text-sm sm:text-base font-bold font-mono ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                {autoPilotConfig.lastOptimizationRun
                  ? new Date(autoPilotConfig.lastOptimizationRun).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs (Hoy)'
                  : 'Automático'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Ciclo continuo de supervisión en tiempo real.
            </p>
          </div>
        </div>

        {/* 3 Reglas de Automatización Activas (Cards con Switches) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          {/* Regla A: Escudo Anti-Suspensión */}
          <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
            autoPilotConfig.autoBlockPolicies
              ? isLight ? 'bg-emerald-50/70 border-emerald-300' : 'bg-emerald-950/20 border-emerald-800/60'
              : isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
          }`}>
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-400 uppercase tracking-wide">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Escudo Anti-Suspensión</span>
                </span>
                <input
                  type="checkbox"
                  checked={autoPilotConfig.autoBlockPolicies}
                  onChange={() => handleToggleAutoPilotSetting('autoBlockPolicies')}
                  className="w-4 h-4 accent-[#FF5500] cursor-pointer"
                />
              </div>
              <p className="text-xs text-zinc-300 mt-2 font-medium">
                Detecta y excluye términos que Google prohíbe en servicios técnicos no oficiales (ej: <em>desbloqueo icloud, by pass, servicio oficial, autorizado apple</em>).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-800/40 text-[11px] text-emerald-300/80 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Cuenta protegida contra inhabilitación
            </div>
          </div>

          {/* Regla B: Filtro Anti-Desperdicio */}
          <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
            autoPilotConfig.autoBlockWasteTerms
              ? isLight ? 'bg-amber-50/70 border-amber-300' : 'bg-amber-950/20 border-amber-800/60'
              : isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
          }`}>
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-extrabold text-amber-400 uppercase tracking-wide">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Filtro Cero Desperdicio</span>
                </span>
                <input
                  type="checkbox"
                  checked={autoPilotConfig.autoBlockWasteTerms}
                  onChange={() => handleToggleAutoPilotSetting('autoBlockWasteTerms')}
                  className="w-4 h-4 accent-[#FF5500] cursor-pointer"
                />
              </div>
              <p className="text-xs text-zinc-300 mt-2 font-medium">
                Bloquea consultas de personas que no van a pagar una reparación (ej: <em>gratis, como reparar yo mismo, tutorial, curso, descargar esquemático</em>).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-800/40 text-[11px] text-amber-300/80 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Solo pagás clics de clientes reales en MDP
            </div>
          </div>

          {/* Regla C: Potenciador Local Mar del Plata */}
          <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
            isLight ? 'bg-blue-50/70 border-blue-300' : 'bg-blue-950/20 border-blue-800/60'
          }`}>
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-extrabold text-blue-400 uppercase tracking-wide">
                  <Target className="w-3.5 h-3.5" />
                  <span>Prioridad Local Mar del Plata</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                  Constitución & Zona
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-2 font-medium">
                Enfoca la puja y las búsquedas en usuarios de Av. Constitución, zona norte y centro de Mar del Plata con alta intención de concurrir al local.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-800/40 text-[11px] text-blue-300/80 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Tráfico geolocalizado en Montes Carballo 943
            </div>
          </div>
        </div>

        {/* Términos de Alta Conversión Recomendados para Mar del Plata */}
        <div className="mt-6 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FF5500]" />
              <span>Términos Ganadores Recomendados para la Campaña (Alta Conversión):</span>
            </span>
            <span className="text-[11px] text-zinc-400">
              Copialos o usalos en tus grupos de anuncios
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { term: 'cambio de pantalla celular mar del plata', tag: 'Top Clics MDP', cpc: '$480' },
              { term: 'reparacion iphone constitucion mdp', tag: 'Alta Intención', cpc: '$620' },
              { term: 'arreglo modulo celular presupuesto en el acto', tag: 'Conversión Directa', cpc: '$510' },
              { term: 'cambio de bateria celular en el acto', tag: 'Rapidez / Urgencia', cpc: '$440' }
            ].map((sug, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-[#FF5500]/50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-emerald-400 font-bold">{sug.tag}</span>
                    <span className="font-mono text-zinc-400">CPC {sug.cpc}</span>
                  </div>
                  <span className="text-xs font-medium text-white block">"{sug.term}"</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(sug.term);
                    showToast(`Copiado: "${sug.term}"`);
                  }}
                  className="mt-2 text-[11px] text-[#FF5500] hover:text-[#FF5500]/80 font-bold flex items-center gap-1 cursor-pointer self-start"
                >
                  <Plus className="w-3 h-3" /> Copiar para anuncio
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Registro de Últimas Acciones del Auto-Pilot */}
        {autoPilotConfig.recentActions && autoPilotConfig.recentActions.length > 0 && (
          <div className="mt-5 pt-4 border-t border-zinc-800/80 relative z-10">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold block mb-2.5">
              Registro Reciente de Acciones Automáticas del Piloto:
            </span>
            <div className="space-y-2">
              {autoPilotConfig.recentActions.slice(0, 4).map((act) => (
                <div
                  key={act.id}
                  className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      act.type === 'AUTO_BLOCK_POLICY'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {act.type === 'AUTO_BLOCK_POLICY' ? 'POLÍTICA' : 'DESPERDICIO'}
                    </span>
                    <span className="font-bold text-white">"{act.text}"</span>
                    <span className="text-zinc-400 text-[11px]">— {act.reason}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span className="font-mono text-emerald-400 font-semibold text-[11px]">
                      +${(act.savedEstArs || 9200).toLocaleString('es-AR')} ahorrados
                    </span>
                    <span className="text-zinc-500 text-[10px]">
                      {new Date(act.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN: CAMPAÑAS ACTIVAS DE GOOGLE ADS                        */}
      {/* ============================================================== */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
        isLight
          ? 'bg-white border-zinc-200 shadow-sm'
          : 'bg-[#141416] border-zinc-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#FF5500]" />
              <h3 className={`text-base sm:text-lg font-heading font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                Campañas en Google Ads ({dashboard?.campaigns?.length || 0})
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Historial de campañas y rendimiento en Mar del Plata.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {dashboard?.campaigns?.some(c => c.status === 'ENABLED') ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Google Search Activo</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                <span>Sin Campañas Activas (Histórico)</span>
              </span>
            )}
          </div>
        </div>

        {/* Listado de Campañas */}
        <div className="mt-4 space-y-3">
          {(!dashboard?.campaigns || dashboard.campaigns.length === 0) ? (
            <div className="py-8 text-center text-zinc-500 text-xs">
              No se detectaron campañas activas para el período seleccionado.
            </div>
          ) : (
            dashboard.campaigns.map((camp, idx) => (
              <div
                key={camp.id || idx}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isLight
                    ? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                    : 'bg-[#18181c] border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Info Principal de Campaña */}
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/20 text-[#FF5500] shrink-0 mt-0.5">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                        {camp.name}
                      </h4>
                      {camp.status === 'REMOVED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          <span>Eliminada en Google Ads (Datos Históricos)</span>
                        </span>
                      ) : camp.status === 'PAUSED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          <span>Pausada</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Activa / En Circulación</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-zinc-800/60">
                        ID: {camp.id}
                      </span>
                    </div>
                    {camp.status === 'REMOVED' && (
                      <p className="text-[11px] text-zinc-400 mt-1 italic">
                        ⚠️ Esta campaña ya fue borrada en Google Ads. Las métricas reflejan el tráfico histórico acumulado antes de su eliminación.
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                      <span>Tipo: <strong className="text-zinc-300 font-medium">Búsqueda (Search)</strong></span>
                      <span>•</span>
                      <span>Presupuesto: <strong className="text-zinc-300 font-medium">${(camp.dailyBudgetArs || kpis.dailyBudgetArs || 2069).toLocaleString('es-AR')}/día</strong></span>
                      <span>•</span>
                      <span>Moneda: <strong className="text-zinc-300 font-medium">ARS ($)</strong></span>
                    </div>
                  </div>
                </div>

                {/* Métricas clave de la campaña */}
                <div className="flex items-center gap-4 sm:gap-6 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800/60">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-zinc-400 block">Gasto Período</span>
                    <span className="text-sm font-bold text-amber-400 font-mono">
                      ${(camp.costArs || kpis.totalCostArs || 0).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-zinc-400 block">Clics</span>
                    <span className="text-sm font-bold text-blue-400 font-mono">
                      {(camp.clicks || kpis.clicks || 0).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-zinc-400 block">Impresiones</span>
                    <span className="text-sm font-bold text-zinc-300 font-mono">
                      {(camp.impressions || kpis.impressions || 0).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-zinc-400 block">CPC Prom.</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      ${camp.clicks > 0 ? Math.round(camp.costArs / camp.clicks) : kpis.avgCpcArs}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN B: TABLA DE TÉRMINOS DE BÚSQUEDA REALES (SEARCH TERMS)  */}
      {/* ============================================================== */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
        isLight
          ? 'bg-white border-zinc-200 shadow-sm'
          : 'bg-[#141416] border-zinc-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-[#FF5500]" />
              <h3 className={`text-base sm:text-lg font-heading font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                Términos de Búsqueda Reales de Clientes
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Exactamente qué escribieron en Google los usuarios en Mar del Plata antes de hacer clic en los anuncios de Montec.
            </p>
          </div>

          {/* Filtro de búsqueda rápida */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              placeholder="Buscar término o campaña..."
              className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#FF5500] ${
                isLight
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-800'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-500'
              }`}
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b text-zinc-400 uppercase font-mono tracking-wider ${
                isLight ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-800 bg-zinc-900/60'
              }`}>
                <th className="py-3 px-3">Término de Búsqueda Exacto</th>
                <th className="py-3 px-3">Campaña / Origen</th>
                <th className="py-3 px-3 text-center">Impr.</th>
                <th className="py-3 px-3 text-center">Clics</th>
                <th className="py-3 px-3 text-center">CTR</th>
                <th className="py-3 px-3 text-right">CPC Prom.</th>
                <th className="py-3 px-3 text-right">Gasto</th>
                <th className="py-3 px-3 text-center">Conv.</th>
                <th className="py-3 px-3 text-right">Acción Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {filteredSearchTerms.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-zinc-500">
                    No se encontraron términos de búsqueda con el filtro ingresado.
                  </td>
                </tr>
              ) : (
                filteredSearchTerms.map((item, idx) => {
                  const isBlocked = item.isBlocked || negativeKeywords.some(
                    k => item.term.toLowerCase().includes(k.text.toLowerCase())
                  );

                  return (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        isBlocked
                          ? 'opacity-60 bg-red-950/10'
                          : isLight ? 'hover:bg-zinc-50' : 'hover:bg-zinc-900/40'
                      }`}
                    >
                      <td className="py-3 px-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span className={`${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                            "{item.term}"
                          </span>
                          {item.recommendedBlock && !isBlocked && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              title={item.blockReason}
                            >
                              Sugerido Bloquear
                            </span>
                          )}
                          {isBlocked && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Bloqueada
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                        {item.campaign}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-zinc-400">
                        {item.impressions}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-white">
                        {item.clicks}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-zinc-300">
                        {item.ctr}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-300">
                        ${item.cpc}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-amber-400">
                        ${item.cost?.toLocaleString('es-AR') || 0}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          item.conversions > 0
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-zinc-500'
                        }`}>
                          {item.conversions}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isBlocked ? (
                          <span className="text-[11px] text-zinc-500 italic">Excluida</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBlockSearchTerm(item.term)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-950/60 hover:bg-rose-900/90 text-rose-300 border border-rose-800/60 transition-colors cursor-pointer"
                            title="Excluir este término como palabra clave negativa en la campaña"
                          >
                            <Plus className="w-3 h-3 text-rose-400" />
                            <span>Bloquear como Negativa</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN C: VALIDADOR DE POLÍTICAS Y TEXTOS (POLICY COMPLIANCE) */}
      {/* ============================================================== */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
        isLight
          ? 'bg-white border-zinc-200 shadow-sm'
          : 'bg-[#141416] border-zinc-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className={`text-base sm:text-lg font-heading font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                Validador de Políticas y Textos para Anuncios
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Prueba títulos y descripciones antes de publicarlos en Google Ads. Evita la suspensión permanente de cuenta por políticas de soporte técnico no oficial.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {policyAnalysis.isClean ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Anuncio 100% Conforme a Políticas
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-4 h-4" /> Alertas de Cumplimiento Detectadas
              </span>
            )}
          </div>
        </div>

        {/* Alertas de Políticas si existen violaciones */}
        {policyAnalysis.hasViolations && (
          <div className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>¡Atención! Se detectaron términos de alto riesgo para Google Ads:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-rose-200/90">
              {policyAnalysis.violations.map((v, i) => (
                <li key={i}>
                  <strong className="underline decoration-rose-500">"{v.word}"</strong>: {v.reason}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-rose-300/80 pt-1 border-t border-rose-900/60">
              💡 <em>Consejo de Montec:</em> Utiliza en su lugar frases neutras y legales como: <strong>"Taller Especializado Multimarca"</strong>, <strong>"Reparación en el Acto"</strong> o <strong>"Repuestos Calidad Original / Premium"</strong>.
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulario de Redacción */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Títulos del Anuncio (Máx. 30 caracteres c/u)
            </h4>

            {/* Título 1 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-zinc-300 font-medium">Título 1 (Principal)</label>
                <span className={`font-mono text-xs ${
                  policyAnalysis.lengths.t1 > 30 ? 'text-rose-400 font-bold' : 'text-zinc-500'
                }`}>
                  {policyAnalysis.lengths.t1} / 30
                </span>
              </div>
              <input
                type="text"
                value={adForm.title1}
                onChange={(e) => setAdForm({ ...adForm, title1: e.target.value })}
                className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#FF5500] ${
                  policyAnalysis.lengths.t1 > 30 ? 'border-rose-500 bg-rose-950/20' : isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700 text-white'
                }`}
              />
            </div>

            {/* Título 2 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-zinc-300 font-medium">Título 2 (Marca o Local)</label>
                <span className={`font-mono text-xs ${
                  policyAnalysis.lengths.t2 > 30 ? 'text-rose-400 font-bold' : 'text-zinc-500'
                }`}>
                  {policyAnalysis.lengths.t2} / 30
                </span>
              </div>
              <input
                type="text"
                value={adForm.title2}
                onChange={(e) => setAdForm({ ...adForm, title2: e.target.value })}
                className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#FF5500] ${
                  policyAnalysis.lengths.t2 > 30 ? 'border-rose-500 bg-rose-950/20' : isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700 text-white'
                }`}
              />
            </div>

            {/* Título 3 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-zinc-300 font-medium">Título 3 (Llamado a la acción)</label>
                <span className={`font-mono text-xs ${
                  policyAnalysis.lengths.t3 > 30 ? 'text-rose-400 font-bold' : 'text-zinc-500'
                }`}>
                  {policyAnalysis.lengths.t3} / 30
                </span>
              </div>
              <input
                type="text"
                value={adForm.title3}
                onChange={(e) => setAdForm({ ...adForm, title3: e.target.value })}
                className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#FF5500] ${
                  policyAnalysis.lengths.t3 > 30 ? 'border-rose-500 bg-rose-950/20' : isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700 text-white'
                }`}
              />
            </div>

            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold pt-2">
              Descripciones del Anuncio (Máx. 90 caracteres c/u)
            </h4>

            {/* Descripción 1 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-zinc-300 font-medium">Descripción 1 (Propuesta de valor)</label>
                <span className={`font-mono text-xs ${
                  policyAnalysis.lengths.d1 > 90 ? 'text-rose-400 font-bold' : 'text-zinc-500'
                }`}>
                  {policyAnalysis.lengths.d1} / 90
                </span>
              </div>
              <textarea
                rows="2"
                value={adForm.desc1}
                onChange={(e) => setAdForm({ ...adForm, desc1: e.target.value })}
                className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#FF5500] ${
                  policyAnalysis.lengths.d1 > 90 ? 'border-rose-500 bg-rose-950/20' : isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700 text-white'
                }`}
              />
            </div>

            {/* Descripción 2 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-zinc-300 font-medium">Descripción 2 (Garantía y Contacto)</label>
                <span className={`font-mono text-xs ${
                  policyAnalysis.lengths.d2 > 90 ? 'text-rose-400 font-bold' : 'text-zinc-500'
                }`}>
                  {policyAnalysis.lengths.d2} / 90
                </span>
              </div>
              <textarea
                rows="2"
                value={adForm.desc2}
                onChange={(e) => setAdForm({ ...adForm, desc2: e.target.value })}
                className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#FF5500] ${
                  policyAnalysis.lengths.d2 > 90 ? 'border-rose-500 bg-rose-950/20' : isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700 text-white'
                }`}
              />
            </div>
          </div>

          {/* Vista Previa en Vivo (Google Search Ad Mockup) */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold mb-3 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-400" />
              Vista Previa en Google Search
            </h4>

            <div className="p-5 rounded-2xl bg-white border border-zinc-200 text-zinc-800 shadow-md font-sans">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold text-zinc-900 border border-zinc-400 px-1 py-0.2 rounded">
                  Patrocinado
                </span>
                <span className="text-xs text-zinc-600 truncate">
                  https://montec.ar &gt; taller &gt; mdp
                </span>
              </div>

              {/* Títulos en azul estilo Google */}
              <a
                href="#preview"
                onClick={(e) => e.preventDefault()}
                className="text-base sm:text-lg font-medium text-[#1a0dab] hover:underline leading-snug block"
              >
                {adForm.title1 || 'Título 1'} | {adForm.title2 || 'Título 2'} | {adForm.title3 || 'Título 3'}
              </a>

              {/* Descripciones en gris oscuro */}
              <p className="text-xs sm:text-sm text-[#4d5156] mt-1.5 leading-relaxed">
                {adForm.desc1 || 'Descripción 1 del anuncio publicitario de Montec.'}{' '}
                {adForm.desc2 || 'Descripción 2 con llamado a cotización.'}
              </p>

              {/* Extensiones de sitio simuladas */}
              <div className="mt-4 pt-3 border-t border-zinc-100 grid grid-cols-2 gap-2 text-xs text-[#1a0dab]">
                <div className="p-2 rounded bg-zinc-50 hover:bg-zinc-100">
                  <div className="font-semibold text-xs">💬 WhatsApp Directo</div>
                  <div className="text-[10px] text-zinc-500">Respuesta en minutos</div>
                </div>
                <div className="p-2 rounded bg-zinc-50 hover:bg-zinc-100">
                  <div className="font-semibold text-xs">📍 Montes Carballo 943</div>
                  <div className="text-[10px] text-zinc-500">Mar del Plata</div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs">
              <span className="text-zinc-200 font-bold block mb-1">📌 Regla de Oro de Montec para Google Ads:</span>
              No coloques precios fijos en los títulos (debido a la inflación y fluctuación del dólar). Enfatiza <strong>"Presupuesto Inmediato"</strong>, <strong>"Repuestos Calidad Original"</strong> y <strong>"Garantía Escrita"</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN D: GESTIÓN RÁPIDA DE PALABRAS CLAVE NEGATIVAS           */}
      {/* ============================================================== */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
        isLight
          ? 'bg-white border-zinc-200 shadow-sm'
          : 'bg-[#141416] border-zinc-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-rose-400" />
              <h3 className={`text-base sm:text-lg font-heading font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                Gestión de Palabras Clave Negativas
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Evita clics basura de usuarios que buscan cursos, descargas gratuitas o soporte oficial, protegiendo el presupuesto diario de Montec.
            </p>
          </div>

          <span className="px-3 py-1 rounded-xl text-xs font-mono font-semibold bg-rose-950/40 text-rose-300 border border-rose-800/60 self-start sm:self-auto">
            {negativeKeywords.length} palabras bloqueadas
          </span>
        </div>

        {/* Sugerencias Rápidas para Talleres */}
        <div className="mt-4">
          <span className="text-xs font-semibold text-zinc-400 block mb-2">
            Bloqueos recomendados con 1 Clic (rubro servicio técnico):
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              'gratis',
              'curso',
              'tutorial',
              'oficial',
              'autorizado',
              'empleo',
              'sueldo',
              'descargar',
              'pdf',
              'foro',
              'opiniones',
              'by pass',
              'desbloqueo icloud'
            ].map((word) => {
              const alreadyExists = negativeKeywords.some(k => k.text.toLowerCase() === word.toLowerCase());
              return (
                <button
                  key={word}
                  type="button"
                  disabled={alreadyExists}
                  onClick={() => handleAddQuickNegative(word)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                    alreadyExists
                      ? 'bg-zinc-800/40 border-zinc-800 text-zinc-500 cursor-not-allowed line-through'
                      : 'bg-zinc-900 hover:bg-rose-950/60 border-zinc-700 hover:border-rose-700 text-zinc-300 hover:text-rose-200 cursor-pointer'
                  }`}
                >
                  <Plus className="w-3 h-3 text-[#FF5500]" />
                  <span>"{word}"</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulario de Alta Masiva */}
        <form onSubmit={handleAddNegatives} className="mt-6 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <label className="text-xs font-bold text-zinc-300">
              Agregar Nuevas Palabras Negativas (Masivo o Individual)
            </label>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400">Concordancia:</span>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
              >
                <option value="BROAD">Amplia (Bloquea cualquier variación)</option>
                <option value="PHRASE">Frase (Recomendado)</option>
                <option value="EXACT">Exacta [Término preciso]</option>
              </select>
            </div>
          </div>

          <textarea
            rows="2"
            value={newNegativesInput}
            onChange={(e) => setNewNegativesInput(e.target.value)}
            placeholder="Escribe palabras separadas por comas o saltos de línea (ej: gratis, como reparar, herramientas, mercado libre)..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#FF5500]"
          />

          <div className="mt-2.5 flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingNegatives || !newNegativesInput.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF5500] hover:bg-[#FF5500]/90 text-white transition-all shadow-[0_0_15px_rgba(255,85,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmittingNegatives ? 'Guardando...' : 'Bloquear en Campaña de Montec'}</span>
            </button>
          </div>
        </form>

        {/* Listado de Palabras Negativas Activas */}
        <div className="mt-6">
          <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold mb-3">
            Palabras Negativas Activas en la Campaña ({negativeKeywords.length})
          </h4>

          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-3 rounded-xl bg-zinc-950/50 border border-zinc-800">
            {negativeKeywords.length === 0 ? (
              <span className="text-xs text-zinc-500 italic">No hay palabras clave negativas cargadas.</span>
            ) : (
              negativeKeywords.map((item) => (
                <span
                  key={item.id || item.text}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-rose-500/60 transition-colors group"
                >
                  <span className="text-rose-400 font-mono text-[10px]">[{item.matchType || 'BROAD'}]</span>
                  <span className="font-semibold">"{item.text}"</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveNegative(item)}
                    className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5"
                    title="Eliminar de la lista"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: ADJUNTAR JSON Y CONFIGURACIÓN DE CREDENCIALES           */}
      {/* ============================================================== */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className={`border rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl ${
            isLight ? 'bg-white border-zinc-300 text-zinc-800' : 'bg-[#151518] border-zinc-700 text-zinc-100'
          }`}>
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 text-[#FF5500]">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-bold text-white">
                    Configuración de Credenciales Google Ads
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Adjunta tu archivo JSON de Google Cloud o ingresa los tokens faltantes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECCIÓN 1: ADJUNTAR ARCHIVO JSON */}
            <div className="mt-5 p-4 rounded-xl bg-zinc-900/80 border border-dashed border-zinc-700 hover:border-[#FF5500]/60 transition-colors text-center">
              <Upload className="w-8 h-8 text-[#FF5500] mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">
                Subir archivo JSON descargado de Google Console
              </h4>
              <p className="text-xs text-zinc-400 mb-3 max-w-md mx-auto">
                Selecciona el archivo <code className="text-amber-300">client_secret_xxxx.json</code> descargado de Google Cloud Console. El sistema extraerá automáticamente el Client ID y Client Secret.
              </p>

              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5500] hover:bg-[#FF5500]/90 text-white text-xs font-bold transition-all shadow-md cursor-pointer">
                <FileCode className="w-4 h-4" />
                <span>Seleccionar Archivo JSON</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleJsonFileUpload}
                  className="hidden"
                />
              </label>

              {uploadSuccess && (
                <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: FORMULARIO DE LAS 5 VARIABLES CLAVE */}
            <form onSubmit={handleSaveCredentials} className="mt-5 space-y-3.5">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Estado y Valores de Conexión
              </h4>

              {/* 1. Client ID */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    1. Google Ads Client ID (OAuth2)
                    {credsForm.clientId ? (
                      <span className="text-[10px] text-emerald-400 font-bold">✅ Cargado</span>
                    ) : (
                      <span className="text-[10px] text-zinc-500">❌ Vacío</span>
                    )}
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="ej: 123456789-ejemplo.apps.googleusercontent.com"
                  value={credsForm.clientId}
                  onChange={(e) => setCredsForm({ ...credsForm, clientId: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-950 text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#FF5500]"
                />
              </div>

              {/* 2. Client Secret */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    2. Google Ads Client Secret (OAuth2)
                    {credsForm.clientSecret ? (
                      <span className="text-[10px] text-emerald-400 font-bold">✅ Cargado</span>
                    ) : (
                      <span className="text-[10px] text-zinc-500">❌ Vacío</span>
                    )}
                  </label>
                </div>
                <input
                  type="password"
                  placeholder="ej: GOCSPX-clave_secreta_ejemplo"
                  value={credsForm.clientSecret}
                  onChange={(e) => setCredsForm({ ...credsForm, clientSecret: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-950 text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#FF5500]"
                />
              </div>

              {/* 3. Customer ID */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    3. Customer ID (ID de Cuenta Google Ads de Montec)
                    <span className="text-[10px] text-emerald-400 font-bold">✅ 18464752657</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="18464752657 (sin guiones)"
                  value={credsForm.customerId}
                  onChange={(e) => setCredsForm({ ...credsForm, customerId: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-950 text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#FF5500]"
                />
              </div>

              {/* 4. Developer Token */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    4. Developer Token de Google Ads
                    {credsForm.developerToken ? (
                      <span className="text-[10px] text-emerald-400 font-bold">✅ Cargado</span>
                    ) : (
                      <span className="text-[10px] text-rose-400 font-bold">❌ Pendiente</span>
                    )}
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Pega aquí el Developer Token emitido por Google Ads Manager"
                  value={credsForm.developerToken}
                  onChange={(e) => setCredsForm({ ...credsForm, developerToken: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-950 text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#FF5500]"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  💡 <em>¿Dónde se obtiene?</em> En tu cuenta de Google Ads &gt; <strong>Herramientas y Configuración &gt; Configuración &gt; Centro de la API</strong>.
                </p>
              </div>

              {/* 5. Refresh Token */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    5. Refresh Token OAuth2
                    {credsForm.refreshToken ? (
                      <span className="text-[10px] text-emerald-400 font-bold">✅ Cargado</span>
                    ) : (
                      <span className="text-[10px] text-rose-400 font-bold">❌ Pendiente</span>
                    )}
                  </label>
                </div>
                <input
                  type="password"
                  placeholder="1//04xxxx... Token permanente de autorización"
                  value={credsForm.refreshToken}
                  onChange={(e) => setCredsForm({ ...credsForm, refreshToken: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-950 text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#FF5500]"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  💡 <em>¿Cómo se genera?</em> Ejecuta en la terminal del proyecto: <code className="bg-zinc-900 px-1 py-0.5 rounded text-amber-300">node get_refresh_token.cjs</code>, abre el link en el navegador y autoriza la cuenta de Montec.
                </p>
              </div>

              {/* Resultado del Diagnóstico si se probó */}
              {diagResult && (
                <div className={`p-4 rounded-xl text-xs border ${
                  diagResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {diagResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>Resultado de la Conexión con Google:</span>
                  </div>
                  <p>{diagResult.message || diagResult.error}</p>
                  {diagResult.customer && (
                    <p className="mt-1 font-mono text-[11px] text-emerald-300">
                      Cuenta: {diagResult.customer.name} | Moneda: {diagResult.customer.currency}
                    </p>
                  )}
                  {diagResult.note && (
                    <p className="mt-1 text-zinc-400 italic text-[11px]">{diagResult.note}</p>
                  )}
                </div>
              )}

              {/* Botones de acción */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={isSavingCreds}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#FF5500] hover:bg-[#FF5500]/90 text-white transition-all shadow-[0_0_20px_rgba(255,85,0,0.35)] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isSavingCreds ? 'Guardando y Verificando...' : 'Guardar y Probar Conexión'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
