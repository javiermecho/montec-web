import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Activity, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Send, 
  Trash2, 
  RefreshCw, 
  MessageCircle, 
  Smartphone, 
  MapPin, 
  ShoppingBag, 
  TrendingUp, 
  Info,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  getAnalyticsConfig, 
  saveAnalyticsConfig, 
  getRecentEvents, 
  clearRecentEvents, 
  getAnalyticsSummary, 
  sendTestEvent 
} from '../../services/analytics';
import { useData } from '../../context/DataContext';

export default function AnalyticsTab() {
  const { panelTheme } = useData();
  const isLight = panelTheme === 'light';

  const [config, setConfig] = useState(() => getAnalyticsConfig());
  const [saveStatus, setSaveStatus] = useState(null);
  const [testStatus, setTestStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState({
    totalEvents: 0,
    cotizaciones: 0,
    conversionesWhatsapp: 0,
    clicksContacto: 0,
    accesoriosConsultados: 0
  });

  const refreshData = () => {
    setEvents(getRecentEvents());
    setSummary(getAnalyticsSummary());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const ok = saveAnalyticsConfig(config);
    if (ok) {
      setSaveStatus('Configuración guardada y activada exitosamente');
      setTimeout(() => setSaveStatus(null), 4000);
    } else {
      setSaveStatus('Error al guardar la configuración');
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleSendTest = () => {
    const res = sendTestEvent();
    setTestStatus(`Evento de prueba enviado: test_conexion_admin a las ${res.timestamp}`);
    refreshData();
    setTimeout(() => setTestStatus(null), 6000);
  };

  const handleClearHistory = () => {
    if (window.confirm('¿Deseas limpiar el registro local de eventos?')) {
      clearRecentEvents();
      refreshData();
    }
  };

  const isGaConfigured = Boolean(config.gaId && !config.gaId.includes('XXXXX') && config.gaId.startsWith('G-'));

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Encabezado y Estado de Conexión */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-white">
                Google Analytics 4 & Medición de Leads
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Seguimiento de visitas, cotizaciones web y conversiones de turnos por WhatsApp en montec.ar
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 hover:text-slate-900'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700 hover:text-white'
            }`}
          >
            <span>Panel Oficial de GA4</span>
            <ExternalLink className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`} />
          </a>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 hover:text-slate-900'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700 hover:text-white'
            }`}
          >
            <span>Google Search Console</span>
            <ExternalLink className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`} />
          </a>
        </div>
      </div>

      {/* Banner de Estado */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isGaConfigured 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
      }`}>
        <div className="flex items-center gap-3">
          {isGaConfigured ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <div>
            <div className="text-xs sm:text-sm font-bold text-white">
              {isGaConfigured 
                ? `Google Analytics 4 ACTIVO • ID: ${config.gaId}` 
                : 'Google Analytics Pendiente de Configuración'}
            </div>
            <div className="text-xs opacity-80">
              {isGaConfigured 
                ? 'El script de medición gtag.js está inyectado y recopilando eventos en tiempo real.' 
                : 'Ingresá tu ID de Medición (G-XXXXXXXXXX) abajo para comenzar a registrar visitas y conversiones de WhatsApp.'}
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={handleSendTest}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
            }`}
            title="Envía un evento de prueba que podés verificar en la vista 'Tiempo Real' de Google Analytics"
          >
            <Send className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>Enviar Evento de Prueba</span>
          </button>
        </div>
      </div>

      {testStatus && (
        <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>{testStatus}</span>
        </div>
      )}

      {saveStatus && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Grid de Métricas Locales de Conversión */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FF5500]" />
            <span>Actividad Registrada en esta Sesión / Navegador</span>
          </h3>
          <span className="text-xs text-zinc-500">
            Total eventos locales: {summary.totalEvents}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card WhatsApp */}
          <div className="bg-[#121212] border border-emerald-500/30 p-4 rounded-2xl relative overflow-hidden shadow-lg group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-400">Turnos por WhatsApp</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                <MessageCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-heading font-black text-white mt-2">
              {summary.conversionesWhatsapp}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Conversión clave (Clic en pedir turno)
            </span>
          </div>

          {/* Card Cotizaciones */}
          <div className="bg-[#121212] border border-zinc-800 p-4 rounded-2xl relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">Cotizaciones Iniciadas</span>
              <div className="p-1.5 rounded-lg bg-[#FF5500]/15 text-[#FF5500]">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-heading font-black text-white mt-2">
              {summary.cotizaciones}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Equipos y fallas consultadas
            </span>
          </div>

          {/* Card Dirección / Contacto */}
          <div className="bg-[#121212] border border-zinc-800 p-4 rounded-2xl relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">Clics Mapa / Teléfono</span>
              <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-heading font-black text-white mt-2">
              {summary.clicksContacto}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Cómo llegar o llamada directa
            </span>
          </div>

          {/* Card Accesorios */}
          <div className="bg-[#121212] border border-zinc-800 p-4 rounded-2xl relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">Accesorios Consultados</span>
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-heading font-black text-white mt-2">
              {summary.accesoriosConsultados}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Consultas de cables, fundas, etc.
            </span>
          </div>
        </div>
      </div>

      {/* Formulario de Configuración de Cuentas */}
      <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-heading font-bold text-white">
              Configuración de Identificadores (IDs)
            </h3>
            <p className="text-xs text-zinc-400">
              Podés ingresar tus IDs acá mismo. Se guardan en la web y se activan al instante sin necesidad de modificar código.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* ID GA4 */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>ID de Medición Google Analytics 4 (GA4)</span>
                <span className="text-[10px] text-emerald-400 font-mono">Recomendado</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={config.gaId}
                  onChange={(e) => setConfig({ ...config, gaId: e.target.value })}
                  placeholder="G-XXXXXXXXXX (ej: G-W87XN3QP4R)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono placeholder-zinc-600 focus:border-[#FF5500] outline-none"
                />
              </div>
              <span className="text-[11px] text-zinc-500 block mt-1">
                Lo encontrás en Google Analytics → Administrador → Flujos de datos → Tu Web.
              </span>
            </div>

            {/* ID Google Ads */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>ID de Google Ads (Opcional)</span>
                <span className="text-[10px] text-zinc-500 font-mono">Para Campañas</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={config.adsId}
                  onChange={(e) => setConfig({ ...config, adsId: e.target.value })}
                  placeholder="AW-XXXXXXXXXX (ej: AW-1152000000)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono placeholder-zinc-600 focus:border-[#FF5500] outline-none"
                />
              </div>
              <span className="text-[11px] text-zinc-500 block mt-1">
                Para vincular el seguimiento de conversiones con tus campañas de Google Ads.
              </span>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
            <span className="text-xs text-zinc-400">
              💡 Al guardar, tu sitio web comenzará a medir visitas y clics automáticamente.
            </span>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(255,85,0,0.35)] transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar y Activar Seguimiento</span>
            </button>
          </div>
        </form>
      </div>

      {/* Guía Paso a Paso: Cómo Crear y Ver tu Google Analytics */}
      <div className="bg-gradient-to-br from-zinc-900/90 via-[#121212] to-zinc-950 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-[#FF5500]" />
          <h3 className="text-base sm:text-lg font-heading font-bold text-white">
            ¿Cómo creo mi cuenta y veo las estadísticas de montec.ar?
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
          
          <div className="bg-zinc-950/70 border border-zinc-800 p-4 rounded-xl space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF5500]/15 text-[#FF5500] font-bold flex items-center justify-center font-mono">
              1
            </div>
            <h4 className="font-bold text-white">Crear Cuenta en Google Analytics</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Entrá a <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-[#FF5500] underline font-medium">analytics.google.com</a> con tu cuenta de Google. Creá una propiedad llamada <strong>"Montec"</strong> con zona horaria Argentina (GMT-3) y moneda Peso Argentino (ARS).
            </p>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800 p-4 rounded-xl space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF5500]/15 text-[#FF5500] font-bold flex items-center justify-center font-mono">
              2
            </div>
            <h4 className="font-bold text-white">Crear Flujo Web & Copiar ID</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              En "Flujos de datos", seleccioná <strong>Web</strong>, poné la URL <code className="text-zinc-200">montec.ar</code>. Te dará un <strong>ID de Medición</strong> que empieza con <code className="text-emerald-400 font-bold">G-</code>. Pegalo en el campo de arriba y hacé clic en Guardar.
            </p>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800 p-4 rounded-xl space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF5500]/15 text-[#FF5500] font-bold flex items-center justify-center font-mono">
              3
            </div>
            <h4 className="font-bold text-white">¿Dónde veo las estadísticas?</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              En Google Analytics:
              <br />• <strong>Informes → En tiempo real:</strong> Ves cuánta gente está navegando la web ahora mismo desde Mar del Plata.
              <br />• <strong>Interacción → Eventos:</strong> Ves el conteo de <code className="text-zinc-200">click_whatsapp_cotizacion</code> (turnos pedidos) y <code className="text-zinc-200">cotizacion_iniciada</code>.
            </p>
          </div>

        </div>
      </div>

      {/* Feed en Vivo de Eventos Locales */}
      <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-heading font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Registro de Eventos Capturados en Vivo</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Eventos disparados en tu navegador actual mientras interactuás con la web
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Actualizar</span>
            </button>
            {events.length > 0 && (
              <button
                onClick={handleClearHistory}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                    : 'bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 border-zinc-800'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-xs sm:text-sm">
            No hay eventos registrados en esta sesión aún. Abrí el cotizador o hacé clic en "Enviar Evento de Prueba" arriba para ver la actividad.
          </div>
        ) : (
          <div className="divide-y divide-zinc-850 max-h-[400px] overflow-y-auto pr-1">
            {events.map((ev) => {
              const time = new Date(ev.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const isWhatsapp = ev.eventName === 'click_whatsapp_cotizacion';
              const isCotizacion = ev.eventName === 'cotizacion_iniciada';
              const isContact = ev.eventName === 'click_llamada_o_mapa';

              return (
                <div key={ev.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <span className="font-mono text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 shrink-0">
                      {time}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isWhatsapp ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      isCotizacion ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                      isContact ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      'bg-zinc-800 text-zinc-300'
                    }`}>
                      {ev.eventName}
                    </span>
                    <div className="text-zinc-300 truncate max-w-md">
                      {ev.params?.model_name && (
                        <span className="font-semibold text-white">{ev.params.model_name} • </span>
                      )}
                      {ev.params?.issue_name && (
                        <span>{ev.params.issue_name} • </span>
                      )}
                      {ev.params?.contact_label && (
                        <span>{ev.params.contact_label}</span>
                      )}
                      {ev.params?.message && (
                        <span>{ev.params.message}</span>
                      )}
                    </div>
                  </div>

                  {ev.params?.value ? (
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-emerald-400">
                        ${ev.params.value.toLocaleString('es-AR')}
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
