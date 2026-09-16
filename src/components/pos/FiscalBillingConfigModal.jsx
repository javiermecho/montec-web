import React, { useState, useEffect } from 'react';
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
  Calendar,
  Building2,
  FileText
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { activateAfipRobot, deactivateAfip } from '../../services/api';

export default function FiscalBillingConfigModal({ isOpen = true, onClose, isEmbedded = false }) {
  const { businessConfig, updateBusinessConfig } = useData();

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

  useEffect(() => {
    if (businessConfig) {
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
      const updated = {
        business: {
          ...(businessConfig?.business || {}),
          legalName: companyName,
          fantasyName: companyName.split(' ')[0] || companyName,
          cuit: cuit.trim(),
          iibb: iibb.trim(),
          startActivityDate: startActivityDate,
          ivaCondition: ivaCondition
        },
        afip: {
          ...(businessConfig?.afip || {}),
          status: status,
          certificateExpiration: certificateExpiration,
          cuit: cuit.trim(),
          claveFiscalCuit: claveFiscalCuit.trim(),
          claveFiscalPassword: claveFiscalPassword
        }
      };

      await updateBusinessConfig(updated);
      showToastMsg('success', '✅ Configuración fiscal guardada correctamente.');
    } catch (err) {
      showToastMsg('error', 'Error al guardar configuración: ' + err.message);
    }
  };

  // Ejecutar Robot de Activación / Renovación de ARCA
  const handleRunRobot = async () => {
    if (!claveFiscalCuit.replace(/[^0-9]/g, '')) {
      showToastMsg('error', 'Por favor ingresá un CUIT/CUIL válido.');
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

        // Actualizar en contexto
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
    <div className="w-full max-w-4xl mx-auto rounded-xl border border-[#3b1257] shadow-[0_15px_50px_rgba(0,0,0,0.8)] overflow-hidden font-sans text-white"
         style={{ backgroundColor: '#18022a' }}>
      
      {/* BARRA SUPERIOR DE LA VENTANA */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#290547] border-b border-[#3e1363] select-none">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-fuchsia-500/30 flex items-center justify-center border border-fuchsia-400/50">
            <div className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
          </div>
          <span className="font-bold text-sm tracking-wide text-zinc-100 font-mono">
            SistroFix / Montec - Facturacion Electronica (ARCA & ARBA)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="text-xs px-2.5 py-1 rounded bg-[#3b1257] hover:bg-[#4d1970] text-zinc-200 border border-[#521b7a] font-mono flex items-center gap-1 transition-colors cursor-pointer"
            title="Presione F1 para Ayuda"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
            <span>[F1] Ayuda</span>
          </button>

          {typeof onClose === 'function' && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* TOAST FLOTANTE */}
      {toast && (
        <div className={`mx-4 mt-3 px-4 py-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
          toast.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
            : 'bg-red-950/80 border-red-500 text-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* CUERPO EN 2 COLUMNAS (MARCO IZQUIERDO Y MARCO DERECHO) */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* ============================================================== */}
        {/* COLUMNA 1: DATOS FACTURACIÓN ELECTRÓNICA & ARBA                */}
        {/* ============================================================== */}
        <div className="p-4 rounded-lg border border-[#4a186d] bg-[#1f0436]/90 flex flex-col justify-between space-y-4">
          <div>
            <div className="border-b border-[#4a186d] pb-2 mb-3">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                Datos Facturación Electronica
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Nombre de Empresa */}
              <div>
                <label className="block mb-1 text-zinc-300 font-medium">Nombre de Empresa:</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="01tec"
                  className="w-full bg-white text-zinc-900 px-3 py-2 rounded text-xs font-bold outline-none border border-zinc-400 focus:ring-2 focus:ring-fuchsia-400"
                />
              </div>

              {/* ID Fiscal / CUIT */}
              <div>
                <label className="block mb-1 text-zinc-300 font-medium">ID Fiscal:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cuit.startsWith('CUIT:') ? cuit : `CUIT: ${cuit}`}
                    onChange={(e) => {
                      const val = e.target.value.replace('CUIT:', '').trim();
                      setCuit(val);
                      setClaveFiscalCuit(val);
                    }}
                    placeholder="CUIT: 30717561712"
                    className="w-full bg-white text-zinc-900 px-3 py-2 rounded text-xs font-bold font-mono outline-none border border-zinc-400 focus:ring-2 focus:ring-fuchsia-400"
                  />
                </div>
              </div>

              {/* Numero Ingresos Brutos (ARBA) */}
              <div>
                <label className="block mb-1 text-zinc-300 font-medium">Numero Ingresos Brutos (ARBA):</label>
                <input
                  type="text"
                  value={iibb}
                  onChange={(e) => setIibb(e.target.value)}
                  placeholder="30717561712"
                  className="w-full bg-white text-zinc-900 px-3 py-2 rounded text-xs font-bold font-mono outline-none border border-zinc-400 focus:ring-2 focus:ring-fuchsia-400"
                />
              </div>

              {/* Fecha Inicio Actividades */}
              <div>
                <label className="block mb-1 text-zinc-300 font-medium">Fecha Inicio Actividades:</label>
                <input
                  type="date"
                  value={startActivityDate}
                  onChange={(e) => setStartActivityDate(e.target.value)}
                  className="w-full bg-white text-zinc-900 px-3 py-2 rounded text-xs font-bold outline-none border border-zinc-400 focus:ring-2 focus:ring-fuchsia-400"
                />
              </div>

              {/* Responsabilidad ante el IVA */}
              <div>
                <label className="block mb-1 text-zinc-300 font-medium">Responsabilidad ante el IVA:</label>
                <select
                  value={ivaCondition}
                  onChange={(e) => setIvaCondition(e.target.value)}
                  className="w-full bg-white text-zinc-900 px-3 py-2 rounded text-xs font-bold outline-none border border-zinc-400 cursor-pointer focus:ring-2 focus:ring-fuchsia-400"
                >
                  <option value="Responsable Inscripto">Responsable Inscripto</option>
                  <option value="Monotributo">Monotributo</option>
                  <option value="Exento">IVA Exento</option>
                  <option value="No Responsable">No Responsable</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-zinc-400 border-t border-[#4a186d]/60 flex items-center justify-between">
            <span>Jurisdicción: <strong>Buenos Aires (ARBA)</strong></span>
            <span>Mar del Plata</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLUMNA 2: FACTURACIÓN ELECTRÓNICA & ROBOT ARCA                */}
        {/* ============================================================== */}
        <div className="p-4 rounded-lg border border-[#4a186d] bg-[#1f0436]/90 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#4a186d] pb-2 mb-3">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                Facturación Electronica
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {status === 'active' ? 'ARCA Oficial' : 'Inactiva'}
              </span>
            </div>

            {/* ESTADO Y FECHA DE VENCIMIENTO */}
            <div className="mb-3">
              <div className={`text-2xl font-extrabold tracking-tight ${
                status === 'active' ? 'text-emerald-400' : 'text-zinc-400'
              }`}>
                {status === 'active' ? 'Activada' : 'Desactivada'}
              </div>
              <div className="text-xs text-zinc-300 mt-0.5 font-medium">
                {status === 'active' ? (
                  <>El certificado vence el: <strong className="text-white font-mono">{certificateExpiration}</strong></>
                ) : (
                  <span className="text-amber-300">Pendiente de vincular certificado con ARCA</span>
                )}
              </div>
            </div>

            {/* TEXTO EXPLICATIVO DEL ROBOT (IDÉNTICO AL SISTROFIX) */}
            <div className="p-2.5 rounded bg-[#130121] border border-[#3b1257] text-[11px] text-zinc-300 leading-relaxed space-y-1.5 mb-3.5">
              <p>
                Las procedimientos de Facturación Electronica se hacen de forma 100% automatizada, con un robot automatico que realiza los movimientos dentro de tu cuenta de ARCA necesarios para activar la Facturación Electronica, si este metodo no funciona nos pondremos en contacto en las proximas 48 horas para continuar con la instalacion, una vez instalada la Facturacion Electronica ya podrás empezar a emitir comprobantes oficiales de ARCA.
              </p>
              <p className="text-amber-300/90 font-medium">
                El robot puede tardar hasta 5 minutos haciendo la instalacion por favor espere.
              </p>
            </div>

            {/* INPUTS DE CLAVE FISCAL */}
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block mb-1 text-zinc-300 font-medium">CUIT / CUIL clave fiscal:</label>
                <input
                  type="text"
                  value={claveFiscalCuit}
                  onChange={(e) => setClaveFiscalCuit(e.target.value)}
                  placeholder="30717561712"
                  className="w-full bg-white text-zinc-900 px-3 py-2 rounded text-xs font-bold font-mono outline-none border border-zinc-400 focus:ring-2 focus:ring-fuchsia-400"
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-300 font-medium">Contraseña ARCA:</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={claveFiscalPassword}
                    onChange={(e) => setClaveFiscalPassword(e.target.value)}
                    placeholder="Ingresá tu Clave Fiscal..."
                    className="w-full bg-white text-zinc-900 px-3 py-2 rounded text-xs font-bold font-mono outline-none border border-zinc-400 pr-9 focus:ring-2 focus:ring-fuchsia-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-900 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN DE LA COLUMNA DERECHA */}
          <div className="space-y-2 pt-2">
            {isRunningRobot && (
              <div className="p-2 rounded bg-blue-950/80 border border-blue-500 text-blue-200 text-xs flex items-center gap-2 animate-pulse font-mono">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                <span>{robotProgressText}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleDeactivate}
              disabled={isRunningRobot}
              className="w-full py-2.5 px-4 rounded font-bold text-xs bg-[#8b0000] hover:bg-[#a00000] text-white transition-colors cursor-pointer border border-red-900 flex items-center justify-center gap-2 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar Facturación Electronica</span>
            </button>

            <button
              type="button"
              onClick={handleRunRobot}
              disabled={isRunningRobot}
              className="w-full py-2.5 px-4 rounded font-bold text-xs bg-[#2575a7] hover:bg-[#2b86be] text-white transition-colors cursor-pointer border border-blue-400/40 flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Renovar certificados de ARCA</span>
            </button>
          </div>
        </div>

      </div>

      {/* BOTONES DE PIE: SALIR [ESC] Y GUARDAR */}
      <div className="px-4 py-3 bg-[#130121] border-t border-[#3b1257] flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 rounded bg-[#cc0000] hover:bg-[#e60000] text-white font-bold text-xs transition-colors cursor-pointer border border-red-800 flex items-center gap-1.5 shadow-sm"
        >
          <span>Salir [Esc]</span>
        </button>

        <button
          type="button"
          onClick={handleSaveAll}
          className="px-6 py-2 rounded bg-[#008080] hover:bg-[#009999] text-white font-bold text-xs transition-colors cursor-pointer border border-teal-600 flex items-center gap-1.5 shadow-md"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Guardar</span>
        </button>
      </div>

      {/* MODAL DE AYUDA F1 */}
      {showHelpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1f0436] border border-[#521b7a] rounded-xl p-6 max-w-lg w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#521b7a] pb-3">
              <h4 className="font-bold text-sm text-amber-300 flex items-center gap-2">
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

            <div className="text-xs text-zinc-300 space-y-2.5 leading-relaxed">
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
                className="px-4 py-1.5 rounded bg-fuchsia-800 hover:bg-fuchsia-700 text-white font-bold text-xs"
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
