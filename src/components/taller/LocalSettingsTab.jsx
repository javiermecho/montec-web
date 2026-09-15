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
import { useData } from '../../context/DataContext';

export default function LocalSettingsTab() {
  const {
    businessConfig,
    updateBusinessConfig,
    resetBusinessConfig,
    panelTheme,
    serverStatus,
    api
  } = useData();

  const isLight = panelTheme === 'light';

  // Estado local del formulario
  const [formData, setFormData] = useState(() => ({
    business: {
      fantasyName: businessConfig?.business?.fantasyName || 'MONTEC',
      legalName: businessConfig?.business?.legalName || 'MONTEC SERVICIO TÉCNICO',
      cuit: businessConfig?.business?.cuit || '20-38492019-4',
      iibb: businessConfig?.business?.iibb || '20-38492019-4',
      ivaCondition: businessConfig?.business?.ivaCondition || 'Responsable Inscripto',
      startActivityDate: businessConfig?.business?.startActivityDate || '2020-01-15',
      address: businessConfig?.business?.address || 'Montes Carballo 943',
      city: businessConfig?.business?.city || 'Mar del Plata',
      state: businessConfig?.business?.state || 'Buenos Aires',
      zipCode: businessConfig?.business?.zipCode || '7600',
      country: businessConfig?.business?.country || 'Argentina'
    },
    contact: {
      supportPhone: businessConfig?.contact?.supportPhone || '+54 9 223 542-8827',
      technicalWhatsapp: businessConfig?.contact?.technicalWhatsapp || '+54 9 223 542-8827',
      contactEmail: businessConfig?.contact?.contactEmail || 'consultas@montec.ar',
      billingEmail: businessConfig?.contact?.billingEmail || 'facturacion@montec.ar',
      website: businessConfig?.contact?.website || 'https://montec.ar'
    },
    afip: {
      environment: businessConfig?.afip?.environment || 'homologacion',
      cuit: businessConfig?.afip?.cuit || '20-38492019-4',
      puntoVenta: businessConfig?.afip?.puntoVenta || 1,
      tipoComprobanteDefault: businessConfig?.afip?.tipoComprobanteDefault || '11',
      certificate: businessConfig?.afip?.certificate || '',
      privateKey: businessConfig?.afip?.privateKey || '',
      tokenExpiration: businessConfig?.afip?.tokenExpiration || null,
      lastTested: businessConfig?.afip?.lastTested || null,
      status: businessConfig?.afip?.status || 'configured_offline'
    }
  }));

  // Sincronizar formulario si cambia businessConfig externamente
  useEffect(() => {
    if (businessConfig) {
      setFormData({
        business: {
          fantasyName: businessConfig.business?.fantasyName || 'MONTEC',
          legalName: businessConfig.business?.legalName || 'MONTEC SERVICIO TÉCNICO',
          cuit: businessConfig.business?.cuit || '20-38492019-4',
          iibb: businessConfig.business?.iibb || '20-38492019-4',
          ivaCondition: businessConfig.business?.ivaCondition || 'Responsable Inscripto',
          startActivityDate: businessConfig.business?.startActivityDate || '2020-01-15',
          address: businessConfig.business?.address || 'Montes Carballo 943',
          city: businessConfig.business?.city || 'Mar del Plata',
          state: businessConfig.business?.state || 'Buenos Aires',
          zipCode: businessConfig.business?.zipCode || '7600',
          country: businessConfig.business?.country || 'Argentina'
        },
        contact: {
          supportPhone: businessConfig.contact?.supportPhone || '+54 9 223 542-8827',
          technicalWhatsapp: businessConfig.contact?.technicalWhatsapp || '+54 9 223 542-8827',
          contactEmail: businessConfig.contact?.contactEmail || 'consultas@montec.ar',
          billingEmail: businessConfig.contact?.billingEmail || 'facturacion@montec.ar',
          website: businessConfig.contact?.website || 'https://montec.ar'
        },
        afip: {
          environment: businessConfig.afip?.environment || 'homologacion',
          cuit: businessConfig.afip?.cuit || '20-38492019-4',
          puntoVenta: businessConfig.afip?.puntoVenta || 1,
          tipoComprobanteDefault: businessConfig.afip?.tipoComprobanteDefault || '11',
          certificate: businessConfig.afip?.certificate || '',
          privateKey: businessConfig.afip?.privateKey || '',
          tokenExpiration: businessConfig.afip?.tokenExpiration || null,
          lastTested: businessConfig.afip?.lastTested || null,
          status: businessConfig.afip?.status || 'configured_offline'
        }
      });
    }
  }, [businessConfig]);

  const [savingStatus, setSavingStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
  const [testingAfip, setTestingAfip] = useState(false);
  const [afipTestResult, setAfipTestResult] = useState(null);

  // Manejador de cambios generales
  const handleBusinessChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      business: { ...prev.business, [field]: value }
    }));
  };

  const handleContactChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      contact: { ...prev.contact, [field]: value }
    }));
  };

  const handleAfipChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      afip: { ...prev.afip, [field]: value }
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
      await updateBusinessConfig(formData);
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
      if (res.success && res.data) {
        setAfipTestResult(res.data);
        handleAfipChange('lastTested', new Date().toISOString());
        handleAfipChange('status', 'connected');
      } else {
        setAfipTestResult({
          success: false,
          message: res.error || 'No se pudo establecer comunicación con los servidores de ARCA (AFIP).'
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
                Personaliza la identidad de tu negocio, los datos fiscales en tickets de mostrador, el WhatsApp técnico y las credenciales electrónicas de ARCA (ex-AFIP).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Deseas restaurar la configuración del local y AFIP a los valores iniciales de Montec?')) {
                  resetBusinessConfig();
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
                    value={formData.business.fantasyName}
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
                    value={formData.business.legalName}
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
                  value={formData.business.address}
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
                    value={formData.business.city}
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
                    value={formData.business.state}
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
                    value={formData.business.zipCode}
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
                  value={formData.contact.technicalWhatsapp}
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
                  <Phone className="w-3.5 h-3.5 text-sky-400" />
                  <span>Teléfono Fijo / Línea de Mostrador</span>
                </label>
                <input
                  type="text"
                  value={formData.contact.supportPhone}
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
                    value={formData.contact.contactEmail}
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
                    value={formData.contact.billingEmail}
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
                  value={formData.contact.website}
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
        {/* CARD 3: DATOS FISCALES & CONDICIÓN TRIBUTARIA                   */}
        {/* ============================================================== */}
        <div className={`p-5 sm:p-6 rounded-2xl border flex flex-col justify-between ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#121217] border-zinc-800/90'
        }`}>
          <div>
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-zinc-800/60">
              <Receipt className="w-5 h-5 text-blue-400" />
              <h3 className={`font-heading font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                3. Datos Fiscales & Tributarios
              </h3>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    CUIT Emisor
                  </label>
                  <input
                    type="text"
                    value={formData.business.cuit}
                    onChange={(e) => {
                      handleBusinessChange('cuit', e.target.value);
                      handleAfipChange('cuit', e.target.value);
                    }}
                    placeholder="20-38492019-4"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-medium transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-500'
                        : 'bg-zinc-900/90 border-zinc-700 text-blue-300 focus:border-blue-500'
                    }`}
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">Clave Única de Identificación Tributaria.</span>
                </div>

                <div>
                  <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Ingresos Brutos (IIBB)
                  </label>
                  <input
                    type="text"
                    value={formData.business.iibb}
                    onChange={(e) => handleBusinessChange('iibb', e.target.value)}
                    placeholder="20-38492019-4"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-medium transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-500'
                        : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Condición frente al IVA
                  </label>
                  <select
                    value={formData.business.ivaCondition}
                    onChange={(e) => handleBusinessChange('ivaCondition', e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-500'
                        : 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500'
                    }`}
                  >
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                    <option value="Monotributo">Monotributo</option>
                    <option value="Exento">IVA Exento</option>
                    <option value="No Responsable">No Responsable</option>
                  </select>
                </div>

                <div>
                  <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Inicio de Actividades
                  </label>
                  <input
                    type="date"
                    value={formData.business.startActivityDate}
                    onChange={(e) => handleBusinessChange('startActivityDate', e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-500'
                        : 'bg-zinc-900/90 border-zinc-700 text-white focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2">
            <FileText className="w-4 h-4 shrink-0 text-blue-400" />
            <span>Determina el tipo de comprobante que el Punto de Venta seleccionará por defecto (A, B o C).</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CARD 4: ARCA (EX-AFIP) - FACTURACIÓN ELECTRÓNICA                */}
        {/* ============================================================== */}
        <div className={`p-5 sm:p-6 rounded-2xl border flex flex-col justify-between ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#121217] border-zinc-800/90'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800/60">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className={`font-heading font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  4. Conexión ARCA (AFIP) Web Services
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                formData.afip.environment === 'produccion'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {formData.afip.environment === 'produccion' ? 'PRODUCCIÓN REAL' : 'HOMOLOGACIÓN (TEST)'}
              </span>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Entorno y Punto de Venta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Entorno de Facturación
                  </label>
                  <select
                    value={formData.afip.environment}
                    onChange={(e) => handleAfipChange('environment', e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                        : 'bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500'
                    }`}
                  >
                    <option value="homologacion">Homologación (Pruebas y Validación)</option>
                    <option value="produccion">Producción (AFIP Oficial y Fiscal)</option>
                  </select>
                </div>

                <div>
                  <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Punto de Venta Electrónico (WSFE)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={formData.afip.puntoVenta}
                    onChange={(e) => handleAfipChange('puntoVenta', parseInt(e.target.value, 10) || 1)}
                    placeholder="Ej. 1 o 5"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-medium transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                        : 'bg-zinc-900/90 border-zinc-700 text-emerald-300 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* Comprobante por defecto */}
              <div>
                <label className={`block mb-1.5 font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  Tipo de Comprobante por Defecto
                </label>
                <select
                  value={formData.afip.tipoComprobanteDefault}
                  onChange={(e) => handleAfipChange('tipoComprobanteDefault', e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500'
                      : 'bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500'
                  }`}
                >
                  <option value="11">Factura C (Código AFIP 011)</option>
                  <option value="6">Factura B (Código AFIP 006)</option>
                  <option value="1">Factura A (Código AFIP 001)</option>
                </select>
              </div>

              {/* Carga de Certificado Digital X.509 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Certificado Digital X.509 (.crt / .pem)</span>
                  </label>
                  {formData.afip.certificate ? (
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Certificado Cargado ({formData.afip.certificate.length} carácteres)
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-500">Pendiente de carga</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={formData.afip.certificate ? '-----BEGIN CERTIFICATE----- [Cargado correctamente]' : ''}
                    placeholder="Selecciona el archivo .crt o pega el certificado"
                    className={`flex-1 px-3.5 py-2 rounded-xl border text-xs font-mono transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-700'
                        : 'bg-zinc-900/90 border-zinc-700 text-zinc-300'
                    }`}
                  />
                  <label className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-600 text-white'
                  }`}>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Cargar .CRT</span>
                    <input
                      type="file"
                      accept=".crt,.pem,.cer"
                      className="hidden"
                      onChange={(e) => handleFileUpload('certificate', e)}
                    />
                  </label>
                </div>
              </div>

              {/* Carga de Clave Privada */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clave Privada (.key)</span>
                  </label>
                  {formData.afip.privateKey ? (
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Clave Privada Cargada
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-500">Pendiente de carga</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="password"
                    readOnly
                    value={formData.afip.privateKey ? '••••••••••••••••••••••••••••••••••••••••' : ''}
                    placeholder="Selecciona el archivo .key generado con OpenSSL"
                    className={`flex-1 px-3.5 py-2 rounded-xl border text-xs font-mono transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-700'
                        : 'bg-zinc-900/90 border-zinc-700 text-zinc-300'
                    }`}
                  />
                  <label className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-600 text-white'
                  }`}>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Cargar .KEY</span>
                    <input
                      type="file"
                      accept=".key,.pem,.txt"
                      className="hidden"
                      onChange={(e) => handleFileUpload('privateKey', e)}
                    />
                  </label>
                </div>
              </div>

              {/* Botón de Test de Conexión */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestAfip}
                  disabled={testingAfip}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    isLight
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-xs'
                      : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-500/40 hover:border-emerald-500/70 shadow-sm'
                  } disabled:opacity-50`}
                >
                  {testingAfip ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Conectando con servidores de ARCA (WSAA / WSFE)...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Probar Conexión con ARCA / AFIP</span>
                    </>
                  )}
                </button>
              </div>

              {/* Resultado del Test de Conexión */}
              {afipTestResult && (
                <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 animate-fadeIn ${
                  afipTestResult.success
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                    : 'bg-red-950/50 border-red-500/40 text-red-200'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {afipTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span>{afipTestResult.message}</span>
                  </div>

                  {afipTestResult.auth && (
                    <div className="pt-1.5 text-[11px] font-mono opacity-90 border-t border-emerald-500/20 space-y-0.5">
                      <div>Entorno: <strong>{afipTestResult.environment}</strong> (Punto de Venta {afipTestResult.puntoVenta})</div>
                      <div>WSAA Token: <strong>{afipTestResult.auth.token?.slice(0, 24)}...</strong></div>
                      <div>Expiración Ticket: <strong>{afipTestResult.auth.expiration}</strong></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50 text-[11px] text-zinc-400 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 shrink-0 text-zinc-400 mt-0.5" />
            <span>
              Para obtener tu certificado y clave privada, ingresa al portal de ARCA con Clave Fiscal y delega el servicio Web Service de Facturación Electrónica al computador fiscal correspondiente.
            </span>
          </div>
        </div>

      </form>
    </div>
  );
}
