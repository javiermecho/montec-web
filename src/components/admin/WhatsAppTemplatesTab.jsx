import React, { useState, useRef, useMemo } from 'react';
import { 
  MessageSquare, 
  PhoneCall, 
  Check, 
  RotateCcw, 
  Save, 
  Sparkles, 
  Smartphone, 
  Send, 
  Info, 
  CheckCheck,
  Tag,
  HelpCircle
} from 'lucide-react';
import { useData, DEFAULT_BUSINESS_CONFIG, formatWhatsAppTemplate } from '../../context/DataContext';

export default function WhatsAppTemplatesTab() {
  const { businessConfig, updateBusinessConfig } = useData();

  // Número receptor del presupuestador
  const [quotationWhatsapp, setQuotationWhatsapp] = useState(() => {
    return businessConfig?.contact?.quotationWhatsapp || businessConfig?.contact?.technicalWhatsapp || '+54 9 223 544-4991';
  });

  // Plantillas cargadas localmente
  const [templates, setTemplates] = useState(() => {
    return {
      ...DEFAULT_BUSINESS_CONFIG.whatsappTemplates,
      ...(businessConfig?.whatsappTemplates || {})
    };
  });

  // Clave de plantilla actualmente seleccionada
  const [activeTemplateKey, setActiveTemplateKey] = useState('quotationWeb');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const textareaRef = useRef(null);

  // Catálogo y metadatos de las 8 plantillas
  const TEMPLATE_SPECS = [
    {
      key: 'quotationWeb',
      title: 'Presupuestador Web',
      category: 'Web',
      badge: 'Mensaje del Cliente',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      description: 'Mensaje predeterminado que envía el cliente desde la página web al tocar "Consultar por WhatsApp".',
      availableVars: [
        { tag: '{local}', label: 'Nombre del Local', example: businessConfig?.business?.fantasyName || 'MONTEC' },
        { tag: '{equipo}', label: 'Modelo del Equipo', example: 'iPhone 13 Pro' },
        { tag: '{falla}', label: 'Tipo de Reparación / Falla', example: 'Cambio de Módulo OLED' },
        { tag: '{detalles_repuesto}', label: 'Calidad / Detalles', example: ' (Original OLED)' },
        { tag: '{precio}', label: 'Presupuesto Estimativo', example: '$145.000' },
        { tag: '{tiempo}', label: 'Tiempo Estimado', example: '3 a 5 horas' },
        { tag: '{garantia}', label: 'Garantía del Servicio', example: '90 días escrita' },
        { tag: '{direccion}', label: 'Dirección del Local', example: businessConfig?.business?.address || 'Montes Carballo 943' }
      ]
    },
    {
      key: 'orderReceived',
      title: 'Equipo Recibido (Ingreso)',
      category: 'Taller',
      badge: 'Comprobante',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      description: 'Comprobante digital enviado al cliente al ingresar su equipo al taller técnico.',
      availableVars: [
        { tag: '{cliente}', label: 'Nombre Cliente', example: 'Juan Pérez' },
        { tag: '{orden}', label: 'N° de Orden', example: 'ORD-1042' },
        { tag: '{equipo}', label: 'Equipo', example: 'iPhone 12' },
        { tag: '{falla}', label: 'Falla Declarada / Motivo', example: 'Pantalla partida no da imagen' },
        { tag: '{total}', label: 'Presupuesto Total', example: '$95.000' },
        { tag: '{sena}', label: 'Seña / Pago a cuenta', example: '$20.000' },
        { tag: '{saldo}', label: 'Saldo al Retirar', example: '$75.000' },
        { tag: '{fecha_entrega}', label: 'Plazo Estimado', example: '24 a 48 hs' },
        { tag: '{direccion}', label: 'Dirección Local', example: businessConfig?.business?.address || 'Montes Carballo 943' },
        { tag: '{ciudad}', label: 'Ciudad', example: businessConfig?.business?.city || 'Mar del Plata' },
        { tag: '{garantia}', label: 'Garantía', example: '90 días escrita' },
        { tag: '{local}', label: 'Nombre Local', example: businessConfig?.business?.fantasyName || 'MONTEC' }
      ]
    },
    {
      key: 'orderReady',
      title: 'Reparado OK / Listo para Retirar',
      category: 'Taller',
      badge: 'Éxito',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      description: 'Aviso al cliente notificando que el equipo fue reparado exitosamente y ya puede ser retirado.',
      availableVars: [
        { tag: '{cliente}', label: 'Nombre Cliente', example: 'María González' },
        { tag: '{orden}', label: 'N° de Orden', example: 'ORD-1038' },
        { tag: '{equipo}', label: 'Equipo', example: 'Samsung Galaxy A54' },
        { tag: '{saldo}', label: 'Saldo Pendiente', example: '$42.000' },
        { tag: '{total}', label: 'Total Reparación', example: '$62.000' },
        { tag: '{direccion}', label: 'Dirección Local', example: businessConfig?.business?.address || 'Montes Carballo 943' },
        { tag: '{ciudad}', label: 'Ciudad', example: businessConfig?.business?.city || 'Mar del Plata' },
        { tag: '{garantia}', label: 'Garantía', example: '90 días' },
        { tag: '{local}', label: 'Nombre Local', example: businessConfig?.business?.fantasyName || 'MONTEC' }
      ]
    },
    {
      key: 'orderWaitingAuth',
      title: 'Espera Autorización / Presupuesto',
      category: 'Taller',
      badge: 'Diagnóstico',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      description: 'Mensaje con el diagnóstico técnico y presupuesto para que el cliente confirme la reparación.',
      availableVars: [
        { tag: '{cliente}', label: 'Nombre Cliente', example: 'Lucas Romero' },
        { tag: '{orden}', label: 'N° de Orden', example: 'ORD-1055' },
        { tag: '{equipo}', label: 'Equipo', example: 'Motorola Moto G84' },
        { tag: '{informe_tecnico}', label: 'Informe Técnico', example: 'Se detectó integrado de carga dañado por sobretensión.' },
        { tag: '{total}', label: 'Presupuesto Total', example: '$55.000' },
        { tag: '{local}', label: 'Nombre Local', example: businessConfig?.business?.fantasyName || 'MONTEC' }
      ]
    },
    {
      key: 'orderWaitingPart',
      title: 'Faltante de Repuesto',
      category: 'Taller',
      badge: 'En Espera',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      description: 'Notificación cuando se aguarda la llegada del repuesto desde el distribuidor o proveedor.',
      availableVars: [
        { tag: '{cliente}', label: 'Nombre Cliente', example: 'Martín Suárez' },
        { tag: '{orden}', label: 'N° de Orden', example: 'ORD-1060' },
        { tag: '{equipo}', label: 'Equipo', example: 'iPad Air 4' },
        { tag: '{local}', label: 'Nombre Local', example: businessConfig?.business?.fantasyName || 'MONTEC' }
      ]
    },
    {
      key: 'orderInProgress',
      title: 'En Mesa de Trabajo',
      category: 'Taller',
      badge: 'Taller',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      description: 'Notificación cuando el equipo pasa a desarme y reparación activa por el técnico asignado.',
      availableVars: [
        { tag: '{cliente}', label: 'Nombre Cliente', example: 'Estela Benítez' },
        { tag: '{orden}', label: 'N° de Orden', example: 'ORD-1062' },
        { tag: '{equipo}', label: 'Equipo', example: 'iPhone 14 Pro Max' },
        { tag: '{local}', label: 'Nombre Local', example: businessConfig?.business?.fantasyName || 'MONTEC' }
      ]
    },
    {
      key: 'orderNoRepair',
      title: 'Devolución / Sin Reparar',
      category: 'Taller',
      badge: 'Sin Reparación',
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      description: 'Notificación cuando el equipo no tuvo solución viable o el presupuesto fue rechazado.',
      availableVars: [
        { tag: '{cliente}', label: 'Nombre Cliente', example: 'Diego Gómez' },
        { tag: '{orden}', label: 'N° de Orden', example: 'ORD-1049' },
        { tag: '{equipo}', label: 'Equipo', example: 'MacBook Air M1' },
        { tag: '{informe_tecnico}', label: 'Informe Técnico', example: 'Placa con sulfato avanzado en líneas de alimentación no recuperables.' },
        { tag: '{direccion}', label: 'Dirección Local', example: businessConfig?.business?.address || 'Montes Carballo 943' },
        { tag: '{ciudad}', label: 'Ciudad', example: businessConfig?.business?.city || 'Mar del Plata' },
        { tag: '{local}', label: 'Nombre Local', example: businessConfig?.business?.fantasyName || 'MONTEC' }
      ]
    },
    {
      key: 'orderDelivered',
      title: 'Equipo Entregado',
      category: 'Taller',
      badge: 'Finalizado',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      description: 'Mensaje de agradecimiento post-entrega y recordatorio de garantía activa.',
      availableVars: [
        { tag: '{cliente}', label: 'Nombre Cliente', example: 'Camila Rossi' },
        { tag: '{orden}', label: 'N° de Orden', example: 'ORD-1033' },
        { tag: '{equipo}', label: 'Equipo', example: 'iPhone 11' },
        { tag: '{garantia}', label: 'Garantía Otorgada', example: '90 días por escrito' },
        { tag: '{local}', label: 'Nombre Local', example: businessConfig?.business?.fantasyName || 'MONTEC' }
      ]
    }
  ];

  const activeSpec = useMemo(() => {
    return TEMPLATE_SPECS.find(s => s.key === activeTemplateKey) || TEMPLATE_SPECS[0];
  }, [activeTemplateKey]);

  // Manejador para insertar una variable en la posición del cursor
  const handleInsertVariable = (tag) => {
    const el = textareaRef.current;
    const currentText = templates[activeTemplateKey] || '';
    if (!el) {
      setTemplates(prev => ({
        ...prev,
        [activeTemplateKey]: currentText + ' ' + tag
      }));
      return;
    }

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const newText = currentText.substring(0, start) + tag + currentText.substring(end);

    setTemplates(prev => ({
      ...prev,
      [activeTemplateKey]: newText
    }));

    // Reubicar cursor justo después de la etiqueta insertada
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  // Restaurar plantilla activa a su valor por defecto
  const handleResetCurrentTemplate = () => {
    const defaultText = DEFAULT_BUSINESS_CONFIG.whatsappTemplates[activeTemplateKey];
    if (defaultText) {
      setTemplates(prev => ({
        ...prev,
        [activeTemplateKey]: defaultText
      }));
    }
  };

  // Guardar todo
  const handleSaveAll = () => {
    updateBusinessConfig({
      contact: {
        ...(businessConfig?.contact || {}),
        quotationWhatsapp: quotationWhatsapp.trim()
      },
      whatsappTemplates: templates
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Generar vista previa con variables de ejemplo
  const previewText = useMemo(() => {
    const templateText = templates[activeTemplateKey] || '';
    const sampleVars = {};
    activeSpec.availableVars.forEach(v => {
      sampleVars[v.tag.replace(/[{}]/g, '')] = v.example;
    });
    return formatWhatsAppTemplate(templateText, sampleVars);
  }, [templates, activeTemplateKey, activeSpec]);

  // Formato de hora simulada
  const currentHour = useMemo(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn text-zinc-100">
      {/* ENCABEZADO & ACCIONES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80 backdrop-blur-sm shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                WhatsApp & Plantillas de Mensajes
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Automatizado
                </span>
              </h2>
              <p className="text-sm text-zinc-400">
                Personalizá el número receptor de cotizaciones de la web y el formato de cada mensaje de taller.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all shadow-lg text-sm ${
            savedSuccess
              ? 'bg-emerald-600 text-white shadow-emerald-600/30'
              : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5'
          }`}
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              ¡Cambios Guardados!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar Plantillas y Número
            </>
          )}
        </button>
      </div>

      {/* SECCIÓN 1: NÚMERO DE WHATSAPP RECEPTOR DEL PRESUPUESTADOR */}
      <div className="bg-zinc-900/80 rounded-2xl p-6 border border-zinc-800/90 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Número Receptor del Presupuestador Web</h3>
              <p className="text-xs text-zinc-400">
                A este número de WhatsApp llegarán los presupuestos que soliciten los clientes desde la web.
              </p>
            </div>
          </div>

          <a
            href={`https://wa.me/${quotationWhatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Probar chat directo con este número
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Número Telefónico (Formato Internacional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={quotationWhatsapp}
                onChange={(e) => setQuotationWhatsapp(e.target.value)}
                placeholder="+54 9 223 544-4991"
                className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
              />
              <span className="absolute right-3 top-3 text-xs text-zinc-500">E.164</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Ejemplo para Argentina: <span className="font-mono text-zinc-400">+54 9 223 544-4991</span> (se limpiarán espacios automáticamente para el enlace).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80 text-xs text-zinc-400 flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-zinc-200">¿Cómo funciona?</span>
              <p className="leading-relaxed">
                Cuando un usuario selecciona su modelo y falla en el presupuestador web de Montec y presiona "Consultar por WhatsApp", la web genera un enlace automático hacia este número con el texto de la plantilla seleccionada a continuación.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: SELECTOR DE PLANTILLAS Y EDITOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LISTA DE PLANTILLAS (COLUMNA IZQUIERDA) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="px-1 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Seleccionar Plantilla ({TEMPLATE_SPECS.length})
            </span>
          </div>

          <div className="space-y-2">
            {TEMPLATE_SPECS.map((spec) => {
              const isSelected = activeTemplateKey === spec.key;
              return (
                <button
                  key={spec.key}
                  onClick={() => setActiveTemplateKey(spec.key)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-zinc-800/90 border-emerald-500/60 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/40'
                      : 'bg-zinc-900/60 hover:bg-zinc-800/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                      {spec.title}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${spec.badgeColor}`}>
                      {spec.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 line-clamp-1">
                    {spec.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* EDITOR Y VISTA PREVIA (COLUMNA DERECHA) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* TARJETA EDITOR */}
          <div className="bg-zinc-900/80 rounded-2xl p-6 border border-zinc-800/90 shadow-xl space-y-5">
            
            {/* Header de plantilla activa */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{activeSpec.title}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-md border ${activeSpec.badgeColor}`}>
                    {activeSpec.badge}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{activeSpec.description}</p>
              </div>

              <button
                type="button"
                onClick={handleResetCurrentTemplate}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 px-3 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-amber-500/10 border border-zinc-700/60 transition-colors self-start"
                title="Restaurar el texto predeterminado original de esta plantilla"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restablecer plantilla
              </button>
            </div>

            {/* CHIPS DE VARIABLES DISPONIBLES */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Variables disponibles (Hacé click sobre cualquiera para insertarla en el texto):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeSpec.availableVars.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertVariable(v.tag)}
                    className="group text-xs bg-zinc-950/80 hover:bg-emerald-500/15 border border-zinc-700/80 hover:border-emerald-500/40 rounded-lg px-2.5 py-1 text-emerald-400 font-mono transition-all flex items-center gap-1.5"
                    title={`Insertar ${v.tag} (Ejemplo: ${v.example})`}
                  >
                    <span>{v.tag}</span>
                    <span className="text-[10px] text-zinc-500 group-hover:text-emerald-300 font-sans">
                      • {v.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ÁREA DE TEXTO */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Cuerpo del Mensaje (Soporta negrita con <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">*texto*</code>)</span>
                <span>{(templates[activeTemplateKey] || '').length} caracteres</span>
              </div>
              <textarea
                ref={textareaRef}
                rows={9}
                value={templates[activeTemplateKey] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setTemplates(prev => ({
                    ...prev,
                    [activeTemplateKey]: val
                  }));
                }}
                className="w-full bg-zinc-950/90 border border-zinc-700/90 rounded-xl p-4 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono leading-relaxed"
                placeholder="Escribí aquí la plantilla del mensaje..."
              />
            </div>
          </div>

          {/* VISTA PREVIA EN VIVO ESTILO CHAT DE WHATSAPP */}
          <div className="bg-zinc-900/80 rounded-2xl p-6 border border-zinc-800/90 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-semibold text-white">
                  Vista Previa en Vivo (Simulación en WhatsApp)
                </h4>
              </div>
              <span className="text-xs text-zinc-500">Datos simulados en tiempo real</span>
            </div>

            {/* MOCKUP BURBUJA DE WHATSAPP */}
            <div 
              className="p-4 sm:p-6 rounded-2xl border border-zinc-800 shadow-inner relative overflow-hidden"
              style={{
                backgroundColor: '#0c1317', // Fondo modo oscuro clásico de WhatsApp
                backgroundImage: 'radial-gradient(#1f2c34 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            >
              {/* Header de chat simulado */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                    M
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                      {businessConfig?.business?.fantasyName || 'MONTEC Servicio Técnico'}
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                    </div>
                    <div className="text-[10px] text-zinc-400">en línea</div>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <span>Cifrado de extremo a extremo</span>
                </div>
              </div>

              {/* Burbuja de mensaje */}
              <div className="flex justify-end">
                <div 
                  className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm p-3.5 text-[13px] leading-relaxed shadow-lg relative"
                  style={{
                    backgroundColor: '#005c4b', // Verde de mensaje enviado de WhatsApp
                    color: '#e9edef'
                  }}
                >
                  <p className="whitespace-pre-wrap select-text font-sans">
                    {previewText}
                  </p>

                  <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-200/70 mt-1">
                    <span>{currentHour}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
