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
  Server,
  Lock,
  Clock
} from 'lucide-react';
import { useData, DEFAULT_BUSINESS_CONFIG } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
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
  const { isAdmin, updateCredentials } = useAuth();

  const isLight = panelTheme === 'light';

  // Helper para asegurar que la estructura esté 100% poblada desde DEFAULT_BUSINESS_CONFIG
  const buildCleanState = (config) => {
    const c = config || {};
    const b = c.business || {};
    const ct = c.contact || {};
    const h = c.hours || {};
    const a = c.afip || {};
    const def = DEFAULT_BUSINESS_CONFIG || { business: {}, contact: {}, hours: {}, afip: {} };

    return {
      business: {
        fantasyName: b.fantasyName ?? def.business.fantasyName ?? '',
        legalName: b.legalName ?? def.business.legalName ?? '',
        cuit: b.cuit ?? def.business.cuit ?? '',
        iibb: b.iibb ?? def.business.iibb ?? '',
        ivaCondition: b.ivaCondition ?? def.business.ivaCondition ?? 'Responsable Inscripto',
        startActivityDate: b.startActivityDate ?? def.business.startActivityDate ?? '',
        address: b.address ?? def.business.address ?? '',
        city: b.city ?? def.business.city ?? '',
        state: b.state ?? def.business.state ?? '',
        zipCode: b.zipCode ?? def.business.zipCode ?? '',
        country: b.country ?? def.business.country ?? 'Argentina'
      },
      contact: {
        supportPhone: ct.supportPhone ?? def.contact.supportPhone ?? '',
        technicalWhatsapp: ct.technicalWhatsapp ?? def.contact.technicalWhatsapp ?? '',
        quotationWhatsapp: ct.quotationWhatsapp ?? def.contact.quotationWhatsapp ?? '',
        contactEmail: ct.contactEmail ?? def.contact.contactEmail ?? '',
        billingEmail: ct.billingEmail ?? def.contact.billingEmail ?? '',
        website: ct.website ?? def.contact.website ?? ''
      },
      hours: {
        weekdaysLabel: h.weekdaysLabel ?? def.hours?.weekdaysLabel ?? 'Lunes a Viernes',
        weekdaysTime: h.weekdaysTime ?? def.hours?.weekdaysTime ?? '09:30 a 19:00 hs',
        saturdayLabel: h.saturdayLabel ?? def.hours?.saturdayLabel ?? 'Sábados',
        saturdayTime: h.saturdayTime ?? def.hours?.saturdayTime ?? '10:00 a 14:00 hs',
        holidaysText: h.holidaysText ?? def.hours?.holidaysText ?? 'Domingos y Feriados: Guardia WhatsApp',
        summaryShort: h.summaryShort ?? def.hours?.summaryShort ?? 'Lun a Vie 09:30 a 19:00 | Sáb 10:00 a 14:00'
      },
      afip: {
        status: a.status ?? def.afip.status ?? 'inactive',
        certificateExpiration: a.certificateExpiration ?? def.afip.certificateExpiration ?? '',
        environment: a.environment ?? def.afip.environment ?? 'produccion',
        cuit: a.cuit ?? def.afip.cuit ?? '',
        puntoVenta: a.puntoVenta ?? def.afip.puntoVenta ?? 1,
        tipoComprobanteDefault: a.tipoComprobanteDefault ?? def.afip.tipoComprobanteDefault ?? '11',
        claveFiscalCuit: a.claveFiscalCuit ?? def.afip.claveFiscalCuit ?? '',
        claveFiscalPassword: a.claveFiscalPassword ?? '',
        lastTested: a.lastTested ?? null
      }
    };
  };

  const [formData, setFormData] = useState(() => buildCleanState(businessConfig));
  const [savingStatus, setSavingStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
  const [testingAfip, setTestingAfip] = useState(false);
  const [afipTestResult, setAfipTestResult] = useState(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newOperatorPin, setNewOperatorPin] = useState('');
  const [credFeedback, setCredFeedback] = useState(null);

  const handleUpdateCredentials = async () => {
    setCredFeedback(null);
    if (!newAdminPassword.trim() && !newOperatorPin.trim()) {
      setCredFeedback({ type: 'error', text: 'Ingresá una nueva contraseña de Administrador y/o PIN de Operador.' });
      return;
    }
    const res = await updateCredentials({
      newAdminPassword: newAdminPassword.trim() || undefined,
      newOperatorPin: newOperatorPin.trim() || undefined
    });
    if (res?.success) {
      setCredFeedback({ type: 'success', text: res.message || 'Credenciales actualizadas con cifrado seguro en PostgreSQL.' });
      setNewAdminPassword('');
      setNewOperatorPin('');
    } else {
      setCredFeedback({ type: 'error', text: res?.error || 'No se pudieron actualizar las credenciales.' });
    }
  };

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

  const handleHoursChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      hours: { ...(prev?.hours || {}), [field]: value }
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
                  placeholder="+54 9 223 544-4991"
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
                  placeholder="+54 9 223 544-4991"
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
                  placeholder="+54 9 223 544-4991"
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
        {/* CARD 2.5: HORARIOS DE ATENCIÓN AL PÚBLICO                       */}
        {/* ============================================================== */}
        <div className={`lg:col-span-2 p-5 sm:p-6 rounded-2xl border ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#121217] border-zinc-800/90'
        }`}>
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-zinc-800/60">
            <Clock className="w-5 h-5 text-[#FF5500]" />
            <div>
              <h3 className={`font-heading font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                3. Horarios de Atención al Público
              </h3>
              <p className="text-[11px] text-zinc-500">
                Se reflejan automáticamente en la web principal, tienda, seguimiento de órdenes y mensajes de WhatsApp.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
            <div>
              <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                Lunes a Viernes
              </label>
              <input
                type="text"
                value={formData?.hours?.weekdaysTime || ''}
                onChange={(e) => handleHoursChange('weekdaysTime', e.target.value)}
                placeholder="09:30 a 19:00 hs"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#FF5500]'
                    : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-[#FF5500]'
                }`}
              />
            </div>

            <div>
              <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                Sábados
              </label>
              <input
                type="text"
                value={formData?.hours?.saturdayTime || ''}
                onChange={(e) => handleHoursChange('saturdayTime', e.target.value)}
                placeholder="10:00 a 14:00 hs"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#FF5500]'
                    : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-[#FF5500]'
                }`}
              />
            </div>

            <div>
              <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                Domingos y Feriados
              </label>
              <input
                type="text"
                value={formData?.hours?.holidaysText || ''}
                onChange={(e) => handleHoursChange('holidaysText', e.target.value)}
                placeholder="Domingos y Feriados: Guardia WhatsApp"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#FF5500]'
                    : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-[#FF5500]'
                }`}
              />
            </div>

            <div>
              <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                Resumen Corto (WhatsApp / Footer)
              </label>
              <input
                type="text"
                value={formData?.hours?.summaryShort || ''}
                onChange={(e) => handleHoursChange('summaryShort', e.target.value)}
                placeholder="Lun a Vie 09:30 a 19:00 | Sáb 10:00 a 14:00"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#FF5500]'
                    : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-[#FF5500]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECCIÓN 3: FACTURACIÓN ELECTRÓNICA AUTOMÁTICA (ARCA & ARBA)    */}
        {/* ============================================================== */}
        <div className="lg:col-span-2 pt-4">
          <FiscalBillingConfigModal isEmbedded={true} />
        </div>

        {/* ============================================================== */}
        {/* SECCIÓN 4: SEGURIDAD Y CLAVES DE ACCESO (ADMIN / OPERADOR)     */}
        {/* ============================================================== */}
        {isAdmin && (
          <div className={`lg:col-span-2 rounded-2xl border p-5 sm:p-6 transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#121215] border-zinc-800/80'
          }`}>
            <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-zinc-800/40">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Seguridad y Claves de Acceso al Sistema
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Se guardan cifradas con Scrypt en PostgreSQL. Dejá vacío el campo que no quieras modificar.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  Nueva Contraseña de Administrador (mín. 6 caracteres)
                </label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#FF5500]'
                      : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-[#FF5500]'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  Nuevo PIN de Operador de Mostrador (mín. 4 caracteres)
                </label>
                <input
                  type="password"
                  value={newOperatorPin}
                  onChange={(e) => setNewOperatorPin(e.target.value)}
                  placeholder="••••"
                  autoComplete="new-password"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#FF5500]'
                      : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-[#FF5500]'
                  }`}
                />
              </div>
            </div>

            {credFeedback && (
              <div className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                credFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                {credFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{credFeedback.text}</span>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleUpdateCredentials}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Key className="w-4 h-4" />
                <span>Actualizar Claves en Base de Datos</span>
              </button>
            </div>
          </div>
        )}

      </form>
    </div>
  );
}
