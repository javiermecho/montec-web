import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  HelpCircle, 
  Save,
  Trash2,
  Cpu,
  Building2,
  Receipt,
  Check,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { activateAfipRobot, deactivateAfip } from '../../services/api';

export default function FiscalBillingConfigModal({ isOpen = true, onClose, isEmbedded = false }) {
  const { businessConfig, updateBusinessConfig, panelTheme } = useData();
  const isLight = panelTheme === 'light';

  const business = businessConfig?.business || {};
  const afip = businessConfig?.afip || {};

  // Estados locales del formulario
  const [companyName, setCompanyName] = useState(business.legalName || business.fantasyName || 'MONTEC SERVICIO TÉCNICO');
  const [cuit, setCuit] = useState(business.cuit || '20-38492019-4');
  const [iibb, setIibb] = useState(business.iibb || '20-38492019-4');
  const [startActivityDate, setStartActivityDate] = useState(business.startActivityDate || '2020-01-15');
  const [ivaCondition, setIvaCondition] = useState(business.ivaCondition || 'Responsable Inscripto');

  // Estados de Facturación Electrónica ARCA (Robot automático)
  const [claveFiscalCuit, setClaveFiscalCuit] = useState(afip.claveFiscalCuit || business.cuit || '20-38492019-4');
  const [claveFiscalPassword, setClaveFiscalPassword] = useState(afip.claveFiscalPassword || '');
  const [showPassword, setShowPassword] = useState(false);
  
  const [status, setStatus] = useState(afip.status || 'active'); // 'active' | 'inactive' | 'pending'
  const [certificateExpiration, setCertificateExpiration] = useState(afip.certificateExpiration || '5/1/2028');

  // Estados de feedback
  const [isRunningRobot, setIsRunningRobot] = useState(false);
  const [robotProgressText, setRobotProgressText] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success'|'error', text: '' }
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Evitar que useEffect sobreescriba lo que el usuario está tipeando
  const isInitialized = useRef(false);

  useEffect(() => {
    if (businessConfig && !isInitialized.current) {
      isInitialized.current = true;
      setCompanyName(businessConfig.business?.legalName || businessConfig.business?.fantasyName || 'MONTEC SERVICIO TÉCNICO');
      setCuit(businessConfig.business?.cuit || '20-38492019-4');
      setIibb(businessConfig.business?.iibb || '20-38492019-4');
      setStartActivityDate(businessConfig.business?.startActivityDate || '2020-01-15');
      setIvaCondition(businessConfig.business?.ivaCondition || 'Responsable Inscripto');
      
      setClaveFiscalCuit(businessConfig.afip?.claveFiscalCuit || businessConfig.business?.cuit || '20-38492019-4');
      setClaveFiscalPassword(businessConfig.afip?.claveFiscalPassword || '');
      setStatus(businessConfig.afip?.status || 'active');
      setCertificateExpiration(businessConfig.afip?.certificateExpiration || '5/1/2028');
    }
  }, [businessConfig]);

  // Manejo de la tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && typeof onClose === 'function') {
        onClose();
      } else if (e.key === 'F1') {
        e.preventDefault();
        setShowHelpModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const showToastMsg = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Guardar configuración general
  const handleSaveAll = async () => {
    try {
      const cleanCuit = cuit.trim();
      const updated = {
        business: {
          ...(businessConfig?.business || {}),
          legalName: companyName,
          fantasyName: companyName.split(' ')[0] || companyName,
          cuit: cleanCuit,
          iibb: iibb.trim(),
          startActivityDate: startActivityDate,
          ivaCondition: ivaCondition
        },
        afip: {
          ...(businessConfig?.afip || {}),
          status: status,
          certificateExpiration: certificateExpiration,
          cuit: cleanCuit,
          claveFiscalCuit: claveFiscalCuit.trim(),
          claveFiscalPassword: claveFiscalPassword
        }
      };

      await updateBusinessConfig(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      showToastMsg('success', '✅ Configuración fiscal guardada correctamente.');
    } catch (err) {
      showToastMsg('error', 'Error al guardar configuración: ' + err.message);
    }
  };

  // Ejecutar Robot de Activación / Renovación de ARCA
  const handleRunRobot = async () => {
    const cleanNum = claveFiscalCuit.replace(/[^0-9]/g, '');
    if (!cleanNum || cleanNum.length !== 11) {
      showToastMsg('error', 'Por favor ingresá un CUIT/CUIL válido de 11 dígitos.');
      return;
    }
    if (!claveFiscalPassword || claveFiscalPassword.trim().length < 4) {
      showToastMsg('error', 'Ingresá tu Contraseña / Clave Fiscal de ARCA para que el robot pueda operar.');
      return;
    }

    setIsRunningRobot(true);
    setRobotProgressText('Iniciando sesión segura en ARCA con Clave Fiscal...');

    try {
      setTimeout(() => setRobotProgressText('Validando facultades fiscales y punto de venta...'), 1200);
      setTimeout(() => setRobotProgressText('Generando y firmando nuevo Certificado Digital X.509...'), 2400);
      setTimeout(() => setRobotProgressText('Delegando Web Services WSAA y WSFE Facturación Electrónica...'), 3500);

      const res = await activateAfipRobot({
        cuit: claveFiscalCuit,
        claveFiscalPassword: claveFiscalPassword,
        puntoVenta: afip.puntoVenta || 1,
        environment: afip.environment || 'produccion'
      });

      if (res.success) {
        setStatus('active');
        if (res.certificateExpiration) {
          setCertificateExpiration(res.certificateExpiration);
        }

        updateBusinessConfig({
          business: {
            ...(businessConfig?.business || {}),
            cuit: cuit.trim(),
            iibb: iibb.trim(),
            legalName: companyName
          },
          afip: {
            ...(businessConfig?.afip || {}),
            status: 'active',
            certificateExpiration: res.certificateExpiration || '5/1/2028',
            cuit: claveFiscalCuit.trim(),
            claveFiscalCuit: claveFiscalCuit.trim(),
            claveFiscalPassword: claveFiscalPassword
          }
        });

        showToastMsg('success', '🎉 ¡Certificados de ARCA renovados con éxito! Facturación Electrónica Activa.');
      } else {
        showToastMsg('error', res.error || 'No se pudo completar la activación automática.');
      }
    } catch (e) {
      showToastMsg('error', 'Error de comunicación con el robot: ' + e.message);
    } finally {
      setIsRunningRobot(false);
      setRobotProgressText('');
    }
  };

  // Eliminar Facturación Electrónica
  const handleDeactivate = async () => {
    if (!window.confirm('¿Seguro que deseás desactivar la Facturación Electrónica oficial de ARCA?')) {
      return;
    }

    try {
      await deactivateAfip();
      setStatus('inactive');
      setClaveFiscalPassword('');

      updateBusinessConfig({
        afip: {
          ...(businessConfig?.afip || {}),
          status: 'inactive',
          claveFiscalPassword: ''
        }
      });

      showToastMsg('success', 'Facturación Electrónica desactivada.');
    } catch (e) {
      showToastMsg('error', 'Error al desactivar: ' + e.message);
    }
  };

  if (!isOpen) return null;

  const content = (
    <div className={`w-full max-w-5xl mx-auto rounded-2xl border shadow-2xl overflow-hidden transition-all ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#101014] border-zinc-800 text-zinc-100'
    }`}>
      
      {/* BARRA SUPERIOR DE LA VENTANA */}
      <div className={`flex items-center justify-between px-6 py-4 border-b select-none ${
        isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-zinc-900/80 border-zinc-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 flex items-center justify-center shadow-md">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-heading font-bold text-base flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <span>Facturación Electrónica & Datos Fiscales</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-sans font-semibold">
                ARCA & ARBA
              </span>
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Configuración de emisor fiscal y vinculación automática para emisión de comprobantes oficiales
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className={`text-xs px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLight 
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' 
                : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
            }`}
            title="Presione F1 para Ayuda"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>[F1] Ayuda</span>
          </button>

          {typeof onClose === 'function' && (
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'hover:bg-slate-200 text-slate-500 border-slate-200'
                  : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* TOAST FLOTANTE */}
      {toast && (
        <div className={`mx-6 mt-4 px-4 py-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-fadeIn ${
          toast.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
            : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* CUERPO EN 2 COLUMNAS (MARCO IZQUIERDO Y MARCO DERECHO) */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ============================================================== */}
        {/* COLUMNA 1: DATOS FACTURACIÓN ELECTRÓNICA & ARBA                */}
        {/* ============================================================== */}
        <div className={`lg:col-span-6 p-5 sm:p-6 rounded-2xl border flex flex-col justify-between space-y-5 ${
          isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#15151b] border-zinc-800/90'
        }`}>
          <div>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-zinc-800/60">
              <Building2 className="w-4 h-4 text-[#FF5500]" />
              <span className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-700' : 'text-zinc-300'
              }`}>
                Datos Facturación Electrónica & ARBA
              </span>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Nombre de Empresa */}
              <div>
                <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  Nombre de Empresa / Razón Social:
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="MONTEC SERVICIO TÉCNICO"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors outline-none ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-[#FF5500]' 
                      : 'bg-zinc-950/80 border-zinc-700/80 text-white focus:border-[#FF5500]'
                  }`}
                />
              </div>

              {/* ID Fiscal / CUIT */}
              <div>
                <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  ID Fiscal (CUIT):
                </label>
                <input
                  type="text"
                  name="fiscal_cuit"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  placeholder="20-38492019-4"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold transition-colors outline-none ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-[#FF5500]' 
                      : 'bg-zinc-950/80 border-zinc-700/80 text-white focus:border-[#FF5500]'
                  }`}
                />
              </div>

              {/* Numero Ingresos Brutos (ARBA) */}
              <div>
                <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  Número Ingresos Brutos (ARBA / IIBB):
                </label>
                <input
                  type="text"
                  name="fiscal_iibb"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={iibb}
                  onChange={(e) => setIibb(e.target.value)}
                  placeholder="20-38492019-4"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold transition-colors outline-none ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-[#FF5500]' 
                      : 'bg-zinc-950/80 border-zinc-700/80 text-white focus:border-[#FF5500]'
                  }`}
                />
                <span className={`text-[11px] block mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                  Inscripción en ARBA (Provincia de Buenos Aires).
                </span>
              </div>

              {/* Fecha Inicio Actividades */}
              <div>
                <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  Fecha Inicio Actividades:
                </label>
                <input
                  type="date"
                  value={startActivityDate}
                  onChange={(e) => setStartActivityDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors outline-none ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-[#FF5500]' 
                      : 'bg-zinc-950/80 border-zinc-700/80 text-white focus:border-[#FF5500]'
                  }`}
                />
              </div>

              {/* Responsabilidad ante el IVA */}
              <div>
                <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  Responsabilidad ante el IVA:
                </label>
                <select
                  value={ivaCondition}
                  onChange={(e) => setIvaCondition(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer outline-none ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-[#FF5500]' 
                      : 'bg-zinc-950 border-zinc-700/80 text-white focus:border-[#FF5500]'
                  }`}
                >
                  <option value="Responsable Inscripto">Responsable Inscripto</option>
                  <option value="Monotributo">Monotributo</option>
                  <option value="Exento">IVA Exento</option>
                  <option value="No Responsable">No Responsable</option>
                </select>
              </div>
            </div>
          </div>

          <div className={`pt-3 text-[11px] border-t flex items-center justify-between ${
            isLight ? 'border-slate-200 text-slate-500' : 'border-zinc-800/80 text-zinc-500'
          }`}>
            <span>Jurisdicción: <strong className={isLight ? 'text-slate-700' : 'text-zinc-300'}>Buenos Aires (ARBA)</strong></span>
            <span>Mar del Plata</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLUMNA 2: FACTURACIÓN ELECTRÓNICA & ROBOT ARCA                */}
        {/* ============================================================== */}
        <div className={`lg:col-span-6 p-5 sm:p-6 rounded-2xl border flex flex-col justify-between space-y-5 ${
          isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#15151b] border-zinc-800/90'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-700' : 'text-zinc-300'
                }`}>
                  Facturación Electrónica
                </span>
              </div>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                status === 'active'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {status === 'active' ? 'Activada' : 'Inactiva'}
              </span>
            </div>

            {/* ESTADO Y FECHA DE VENCIMIENTO */}
            <div className="mb-4">
              <div className={`text-2xl sm:text-3xl font-heading font-black tracking-tight ${
                status === 'active' ? 'text-emerald-400' : 'text-zinc-400'
              }`}>
                {status === 'active' ? 'Activada' : 'Desactivada'}
              </div>
              <div className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                {status === 'active' ? (
                  <>El certificado vence el: <strong className={isLight ? 'text-slate-900 font-mono' : 'text-white font-mono'}>{certificateExpiration}</strong></>
                ) : (
                  <span className="text-amber-400">Pendiente de vincular certificado con ARCA</span>
                )}
              </div>
            </div>

            {/* TEXTO EXPLICATIVO DEL ROBOT */}
            <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 mb-4 ${
              isLight 
                ? 'bg-white border-slate-200 text-slate-600' 
                : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300'
            }`}>
              <p>
                Los procedimientos de Facturación Electrónica se hacen de forma 100% automatizada con un robot que realiza los movimientos dentro de tu cuenta de ARCA necesarios para activar la Facturación Electrónica. Una vez instalada ya podrás empezar a emitir comprobantes oficiales de ARCA.
              </p>
              <p className="text-amber-400 font-medium text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>El robot puede tardar hasta 5 minutos haciendo la instalación. Por favor espere.</span>
              </p>
            </div>

            {/* INPUTS DE CLAVE FISCAL */}
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  CUIT / CUIL clave fiscal:
                </label>
                <input
                  type="text"
                  name="fiscal_afip_cuit"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={claveFiscalCuit}
                  onChange={(e) => setClaveFiscalCuit(e.target.value)}
                  placeholder="20384920194"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold transition-colors outline-none ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-[#FF5500]' 
                      : 'bg-zinc-950/80 border-zinc-700/80 text-white focus:border-[#FF5500]'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  Contraseña ARCA:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={claveFiscalPassword}
                    onChange={(e) => setClaveFiscalPassword(e.target.value)}
                    placeholder="Ingresá tu Clave Fiscal..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold transition-colors outline-none pr-10 ${
                      isLight 
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-[#FF5500]' 
                        : 'bg-zinc-950/80 border-zinc-700/80 text-white focus:border-[#FF5500]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                      isLight ? 'text-slate-400 hover:text-slate-700' : 'text-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN DE LA COLUMNA DERECHA */}
          <div className="space-y-2.5 pt-2">
            {isRunningRobot && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-center gap-2.5 animate-pulse font-mono">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                <span>{robotProgressText}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleDeactivate}
              disabled={isRunningRobot}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer border border-rose-500/30 flex items-center justify-center gap-2 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar Facturación Electrónica</span>
            </button>

            <button
              type="button"
              onClick={handleRunRobot}
              disabled={isRunningRobot}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer border border-blue-500/40 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 disabled:opacity-50"
            >
              <Cpu className="w-4 h-4" />
              <span>Renovar certificados de ARCA</span>
            </button>
          </div>
        </div>

      </div>

      {/* BOTONES DE PIE: SALIR [ESC] Y GUARDAR */}
      <div className={`px-6 py-4 border-t flex items-center justify-between ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/60 border-zinc-800'
      }`}>
        <button
          type="button"
          onClick={onClose}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-colors cursor-pointer border flex items-center gap-2 ${
            isLight
              ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border-zinc-700'
          }`}
        >
          <span>Salir [Esc]</span>
        </button>

        <button
          type="button"
          onClick={handleSaveAll}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-lg ${
            savedSuccess
              ? 'bg-emerald-600 text-white shadow-emerald-600/30'
              : 'bg-[#FF5500] hover:bg-[#FF6600] text-white shadow-[0_0_20px_rgba(255,85,0,0.4)] hover:shadow-[0_0_30px_rgba(255,85,0,0.6)] hover:-translate-y-0.5'
          }`}
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>¡Guardado!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </>
          )}
        </button>
      </div>

      {/* MODAL DE AYUDA F1 */}
      {showHelpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className={`border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#15151b] border-zinc-800 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-zinc-800">
              <h4 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Guía de Activación - Facturación Electrónica ARCA
              </h4>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`text-xs space-y-3 leading-relaxed ${isLight ? 'text-slate-600' : 'text-zinc-300'}`}>
              <p>
                <strong>1. ¿Qué hace el robot automático?</strong><br />
                Ingresa con tu CUIT y Clave Fiscal al portal oficial de ARCA (ex-AFIP), genera un computador fiscal seguro para Montec y suscribe el servicio de Web Services de Facturación Electrónica (WSFE).
              </p>
              <p>
                <strong>2. ¿Qué vigencia tiene el certificado?</strong><br />
                Los certificados digitales de ARCA se emiten con una validez legal de <strong>2 años</strong>. Cuando esté próximo a vencer, presioná <em>"Renovar certificados de ARCA"</em> para renovarlo automáticamente sin interrumpir la emisión de comprobantes.
              </p>
              <p>
                <strong>3. ARBA (Ingresos Brutos):</strong><br />
                Para contribuyentes en la Provincia de Buenos Aires, el número de Ingresos Brutos suele coincidir con el CUIT. Se incluye en el encabezado de las Facturas A, B y C emitidas desde el Punto de Venta.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white font-bold text-xs shadow-md"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      {content}
    </div>
  );
}
