import React, { useState, useEffect } from 'react';
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Receipt,
  ShieldCheck,
  Building,
  Key,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  RotateCcw,
  Upload,
  Globe,
  MessageSquare,
  FileText,
  BadgeCheck,
  Server
} from 'lucide-react';
import { useData, DEFAULT_BUSINESS_CONFIG } from '../../context/DataContext';
import { api } from '../../services/api';
import FiscalBillingConfigModal from '../pos/FiscalBillingConfigModal';

export default function LocalSettingsTab() {
  const {
    businessConfig,
    updateBusinessConfig,
    resetBusinessConfig,
    panelTheme,
    serverStatus
  } = useData();

  const isLight = panelTheme === 'light';

  // Helper para asegurar que la estructura esté 100% poblada sin riesgo de undefined
  const buildCleanState = (config) => {
    const c = config || {};
    const b = c.business || {};
    const ct = c.contact || {};
    const a = c.afip || {};
    const def = DEFAULT_BUSINESS_CONFIG || { business: {}, contact: {}, afip: {} };

    return {
      business: {
        fantasyName: b.fantasyName ?? def.business.fantasyName ?? 'MONTEC',
        legalName: b.legalName ?? def.business.legalName ?? 'MONTEC SERVICIO TÉCNICO',
        cuit: b.cuit ?? def.business.cuit ?? '20-38492019-4',
        iibb: b.iibb ?? def.business.iibb ?? '20-38492019-4',
        ivaCondition: b.ivaCondition ?? def.business.ivaCondition ?? 'Responsable Inscripto',
        startActivityDate: b.startActivityDate ?? def.business.startActivityDate ?? '2020-01-15',
        address: b.address ?? def.business.address ?? 'Montes Carballo 943',
        city: b.city ?? def.business.city ?? 'Mar del Plata',
        state: b.state ?? def.business.state ?? 'Buenos Aires',
        zipCode: b.zipCode ?? def.business.zipCode ?? '7600',
        country: b.country ?? def.business.country ?? 'Argentina'
      },
      contact: {
        supportPhone: ct.supportPhone ?? def.contact.supportPhone ?? '+54 9 223 542-8827',
        technicalWhatsapp: ct.technicalWhatsapp ?? def.contact.technicalWhatsapp ?? '+54 9 223 542-8827',
        quotationWhatsapp: ct.quotationWhatsapp ?? def.contact.quotationWhatsapp ?? '+54 9 223 542-8827',
        contactEmail: ct.contactEmail ?? def.contact.contactEmail ?? 'consultas@montec.ar',
        billingEmail: ct.billingEmail ?? def.contact.billingEmail ?? 'facturacion@montec.ar',
        website: ct.website ?? def.contact.website ?? 'https://montec.ar'
      },
      afip: {
        status: a.status ?? def.afip.status ?? 'active',
        certificateExpiration: a.certificateExpiration ?? def.afip.certificateExpiration ?? '5/1/2028',
        environment: a.environment ?? def.afip.environment ?? 'produccion',
        cuit: a.cuit ?? def.afip.cuit ?? '20-38492019-4',
        puntoVenta: a.puntoVenta ?? def.afip.puntoVenta ?? 1,
        tipoComprobanteDefault: a.tipoComprobanteDefault ?? def.afip.tipoComprobanteDefault ?? '11',
        claveFiscalCuit: a.claveFiscalCuit ?? def.afip.claveFiscalCuit ?? '20-38492019-4',
        claveFiscalPassword: a.claveFiscalPassword ?? '',
        lastTested: a.lastTested ?? null
      }
    };
  };

  const [formData, setFormData] = useState(() => buildCleanState(businessConfig));
  const [savingStatus, setSavingStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
  const [testingAfip, setTestingAfip] = useState(false);
  const [afipTestResult, setAfipTestResult] = useState(null);

  // Sincronizar formulario si cambia businessConfig externamente
  useEffect(() => {
    if (businessConfig) {
      setFormData(buildCleanState(businessConfig));
    }
  }, [businessConfig]);

  // Manejadores seguros de cambio
  const handleBusinessChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      business: { ...(prev?.business || {}), [field]: value }
    }));
  };

  const handleContactChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      contact: { ...(prev?.contact || {}), [field]: value }
    }));
  };

  const handleAfipChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      afip: { ...(prev?.afip || {}), [field]: value }
    }));
  };

  // Carga de certificado o clave desde archivo
  const handleFileUpload = (type, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const content = uploadEvent.target?.result;
      if (typeof content === 'string') {
        handleAfipChange(type, content);
      }
    };
    reader.readAsText(file);
  };

  // Guardar configuración completa
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSavingStatus('saving');
    try {
      if (typeof updateBusinessConfig === 'function') {
        await updateBusinessConfig(formData);
      }
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus(null), 3500);
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      setSavingStatus('error');
      setTimeout(() => setSavingStatus(null), 4000);
    }
  };

  // Probar conexión y autenticación con ARCA (AFIP)
  const handleTestAfip = async () => {
    setTestingAfip(true);
    setAfipTestResult(null);
    try {
      const payload = {
        environment: formData.afip.environment,
        cuit: formData.afip.cuit || formData.business.cuit,
        puntoVenta: formData.afip.puntoVenta,
        certificate: formData.afip.certificate,
        privateKey: formData.afip.privateKey
      };

      const res = await api.testAfipConnection(payload);
      if (res && res.success && res.data) {
        setAfipTestResult(res.data);
        handleAfipChange('lastTested', new Date().toISOString());
        handleAfipChange('status', 'connected');
      } else {
        setAfipTestResult({
          success: false,
          message: res?.error || res?.data?.message || 'No se pudo establecer comunicación con el servidor central de ARCA (AFIP).'
        });
      }
    } catch (err) {
      setAfipTestResult({
        success: false,
        message: err.message || 'Error de conexión con el backend o AFIP.'
      });
    } finally {
      setTestingAfip(false);
    }
  };

  // Variables seguras para el render (nunca undefined)
  const business = formData?.business || DEFAULT_BUSINESS_CONFIG.business;
  const contact = formData?.contact || DEFAULT_BUSINESS_CONFIG.contact;
  const afip = formData?.afip || DEFAULT_BUSINESS_CONFIG.afip;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. ENCABEZADO Y ACCIONES PRINCIPALES */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
        isLight
          ? 'bg-white border-slate-200 shadow-sm'
          : 'bg-[#121217] border-zinc-800/90 shadow-xl'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              isLight ? 'bg-orange-50 text-[#FF5500]' : 'bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30'
            }`}>
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`font-heading font-black text-xl sm:text-2xl ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Configuración del Local & Facturación ARCA
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  serverStatus === 'online'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}>
                  <Server className="w-3 h-3" />
                  <span>{serverStatus === 'online' ? 'PostgreSQL Sincronizado' : 'Modo Offline / Local'}</span>
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Personalizá la identidad de tu negocio, los datos fiscales en tickets de mostrador, el WhatsApp técnico y las credenciales electrónicas de ARCA (ex-AFIP).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Deseas restaurar la configuración del local y AFIP a los valores predeterminados?')) {
                  if (typeof resetBusinessConfig === 'function') resetBusinessConfig();
                  setFormData(buildCleanState(DEFAULT_BUSINESS_CONFIG));
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
              title="Restablecer valores predeterminados"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={savingStatus === 'saving'}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 bg-[#FF5500] hover:bg-[#FF6600] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)] transition-all cursor-pointer disabled:opacity-50"
            >
              {savingStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : savingStatus === 'saved' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>¡Guardado con éxito!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ============================================================== */}
        {/* CARD 1: DATOS DEL LOCAL & UBICACIÓN                            */}
        {/* ============================================================== */}
        <div className={`p-5 sm:p-6 rounded-2xl border flex flex-col justify-between ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#121217] border-zinc-800/90'
        }`}>
          <div>
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-zinc-800/60">
              <Building className="w-5 h-5 text-[#FF5500]" />
              <h3 className={`font-heading font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                1. Identidad del Local & Domicilio
              </h3>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Nombre de Fantasía (Comercial)
                  </label>
                  <input
                    type="text"
                    value={business.fantasyName || ''}
                    onChange={(e) => handleBusinessChange('fantasyName', e.target.value)}
                    placeholder="Ej. MONTEC"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#FF5500]'
                        : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-[#FF5500]'
                    }`}
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">Aparece en la cabecera de tickets y órdenes.</span>
                </div>

                <div>
                  <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Razón Social / Titular
                  </label>
                  <input
                    type="text"
                    value={business.legalName || ''}
                    onChange={(e) => handleBusinessChange('legalName', e.target.value)}
                    placeholder="Ej. MONTEC SERVICIO TÉCNICO"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#FF5500]'
                        : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-[#FF5500]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-1.5 font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  <MapPin className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>Dirección del Local / Taller</span>
                </label>
                <input
                  type="text"
                  value={business.address || ''}
                  onChange={(e) => handleBusinessChange('address', e.target.value)}
                  placeholder="Ej. Montes Carballo 943"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#FF5500]'
                      : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-[#FF5500]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Ciudad / Localidad
                  </label>
                  <input
                    type="text"
                    value={business.city || ''}
                    onChange={(e) => handleBusinessChange('city', e.target.value)}
                    placeholder="Mar del Plata"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#FF5500]'
                        : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-[#FF5500]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Provincia
                  </label>
                  <input
                    type="text"
                    value={business.state || ''}
                    onChange={(e) => handleBusinessChange('state', e.target.value)}
                    placeholder="Buenos Aires"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#FF5500]'
                        : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-[#FF5500]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={business.zipCode || ''}
                    onChange={(e) => handleBusinessChange('zipCode', e.target.value)}
                    placeholder="7600"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#FF5500]'
                        : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-[#FF5500]'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300 flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 shrink-0 text-[#FF5500]" />
            <span>Esta dirección se inserta automáticamente en los comprobantes de mostrador y mensajes de retiro.</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CARD 2: CANALES DE CONTACTO & WHATSAPP TÉCNICO                 */}
        {/* ============================================================== */}
        <div className={`p-5 sm:p-6 rounded-2xl border flex flex-col justify-between ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#121217] border-zinc-800/90'
        }`}>
          <div>
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-zinc-800/60">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <h3 className={`font-heading font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                2. Canales de Atención & WhatsApp Técnico
              </h3>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className={`block mb-1.5 font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp para Consultas Técnicas y Estado de Reparaciones</span>
                </label>
                <input
                  type="text"
                  value={contact.technicalWhatsapp || ''}
                  onChange={(e) => handleContactChange('technicalWhatsapp', e.target.value)}
                  placeholder="+54 9 223 542-8827"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-medium transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                      : 'bg-zinc-900/90 border-zinc-700 text-emerald-300 focus:border-emerald-500'
                  }`}
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">Número oficial al que se redirigen los clientes para consultas de soporte técnico.</span>
              </div>

              <div>
                <label className={`block mb-1.5 font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp Receptor del Presupuestador Web</span>
                </label>
                <input
                  type="text"
                  value={contact.quotationWhatsapp || ''}
                  onChange={(e) => handleContactChange('quotationWhatsapp', e.target.value)}
                  placeholder="+54 9 223 542-8827"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-medium transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                      : 'bg-zinc-900/90 border-zinc-700 text-emerald-300 focus:border-emerald-500'
                  }`}
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">Número que recibe los presupuestos pedidos desde la web. Podés configurar los textos en la pestaña <strong>WhatsApp & Plantillas</strong>.</span>
              </div>

              <div>
                <label className={`block mb-1.5 font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  <Phone className="w-3.5 h-3.5 text-sky-400" />
                  <span>Teléfono Fijo / Línea de Mostrador</span>
                </label>
                <input
                  type="text"
                  value={contact.supportPhone || ''}
                  onChange={(e) => handleContactChange('supportPhone', e.target.value)}
                  placeholder="+54 9 223 542-8827"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-medium transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-sky-500'
                      : 'bg-zinc-900/90 border-zinc-700 text-sky-300 focus:border-sky-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block mb-1.5 font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    <span>Email de Consultas</span>
                  </label>
                  <input
                    type="email"
                    value={contact.contactEmail || ''}
                    onChange={(e) => handleContactChange('contactEmail', e.target.value)}
                    placeholder="consultas@montec.ar"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-500'
                        : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-purple-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-1.5 font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    <Receipt className="w-3.5 h-3.5 text-amber-400" />
                    <span>Email de Facturación</span>
                  </label>
                  <input
                    type="email"
                    value={contact.billingEmail || ''}
                    onChange={(e) => handleContactChange('billingEmail', e.target.value)}
                    placeholder="facturacion@montec.ar"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-amber-500'
                        : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-amber-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-1.5 font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  <Globe className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Sitio Web / Enlace Público</span>
                </label>
                <input
                  type="text"
                  value={contact.website || ''}
                  onChange={(e) => handleContactChange('website', e.target.value)}
                  placeholder="https://montec.ar"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-zinc-500'
                      : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-zinc-500'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Al presionar "Enviar por WhatsApp", el mensaje incluirá este canal oficial verificado.</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECCIÓN 3: FACTURACIÓN ELECTRÓNICA AUTOMÁTICA (ARCA & ARBA)    */}
        {/* ============================================================== */}
        <div className="lg:col-span-2 pt-4">
          <FiscalBillingConfigModal isEmbedded={true} />
        </div>

      </form>
    </div>
  );
}
