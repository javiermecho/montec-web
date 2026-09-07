import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Lock, 
  Key, 
  Smartphone, 
  User, 
  Phone, 
  FileText, 
  DollarSign, 
  CheckSquare, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  Search, 
  Plus, 
  List, 
  Save, 
  RotateCcw, 
  Printer, 
  MessageSquare, 
  Check, 
  AlertCircle,
  Hash,
  Laptop,
  Cpu,
  Sparkles,
  Info
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import PatternLockInput from './PatternLockInput';
import OrderTicketModal from './OrderTicketModal';
import OrdersListModal from './OrdersListModal';

export default function RepairOrderReceiver() {
  const { 
    isTallerOpen, 
    setIsTallerOpen, 
    isEmployeeAuthenticated, 
    loginEmployee, 
    logoutEmployee, 
    models, 
    createRepairOrder, 
    searchClients 
  } = useData();

  // Estados de control de pantallas
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeSubModal, setActiveSubModal] = useState(null); // 'orders_list', 'ticket_view'
  const [activeTicketOrder, setActiveTicketOrder] = useState(null);

  // Estados de búsqueda predictiva de clientes
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [showInternalNotes, setShowInternalNotes] = useState(false);

  // Estados de búsqueda predictiva de modelos
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);

  // Refs para atajos de teclado F9, F10, F12
  const clientInputRef = useRef(null);
  const modelInputRef = useRef(null);

  // FORMULARIO PRINCIPAL DE ORDEN
  const initialFormState = {
    // Columna 1: Cliente
    customer: {
      docType: 'DNI',
      docNumber: '',
      name: '',
      taxCondition: 'Consumidor Final',
      phone: '',
      email: '',
      sendWhatsApp: true,
      sendEmail: false,
      internalNotes: ''
    },
    // Columna 2: Equipo & Seguridad
    device: {
      type: 'Smartphone',
      brand: 'Apple',
      model: '',
      imei: '',
      color: '',
      aestheticCondition: '',
      security: {
        type: 'pin', // 'pattern', 'pin', 'password', 'none'
        pin: '',
        patternSequence: [],
        accountInfo: ''
      }
    },
    // Columna 3: Reparación & Costos
    service: {
      location: 'En Taller (Montes Carballo)',
      requestedRepair: '',
      preliminaryDiagnosis: '',
      checklist: {
        turnsOn: true,
        touchOk: true,
        camerasOk: true,
        audioOk: true,
        chargingOk: true,
        biometricsOk: true,
        simTrayPresent: true
      },
      budgetTotal: '',
      deposit: '',
      balanceDue: 0,
      estimatedDeliveryDate: '',
      status: 'received',
      technician: 'Taller Montec'
    }
  };

  const [formData, setFormData] = useState(initialFormState);

  // Bloquear scroll de página cuando esté abierto
  useEffect(() => {
    if (isTallerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isTallerOpen]);

  // Atajos de Teclado (F9: Cliente, F10: Modelo, F12: Guardar, Esc: Salir)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isTallerOpen) return;

      if (e.key === 'F9') {
        e.preventDefault();
        clientInputRef.current?.focus();
      } else if (e.key === 'F10') {
        e.preventDefault();
        modelInputRef.current?.focus();
      } else if (e.key === 'F12') {
        e.preventDefault();
        handleSubmitOrder();
      } else if (e.key === 'Escape') {
        if (activeSubModal) {
          setActiveSubModal(null);
        } else {
          setIsTallerOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Cálculo automático del Saldo a Pagar (Presupuesto - Seña)
  useEffect(() => {
    const total = parseFloat(formData.service.budgetTotal) || 0;
    const deposit = parseFloat(formData.service.deposit) || 0;
    const balance = Math.max(0, total - deposit);

    setFormData(prev => ({
      ...prev,
      service: {
        ...prev.service,
        balanceDue: balance
      }
    }));
  }, [formData.service.budgetTotal, formData.service.deposit]);

  // Manejo de búsqueda de clientes históricos
  const handleClientSearchChange = (val) => {
    setClientSearchQuery(val);
    if (val.trim().length >= 2) {
      const results = searchClients(val);
      setClientSuggestions(results);
    } else {
      setClientSuggestions([]);
    }
  };

  const handleSelectClient = (c) => {
    setFormData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        docType: c.docType || 'DNI',
        docNumber: c.docNumber || '',
        name: c.name || '',
        taxCondition: c.taxCondition || 'Consumidor Final',
        phone: c.phone || '',
        email: c.email || '',
        internalNotes: c.internalNotes || ''
      }
    }));
    setClientSearchQuery('');
    setClientSuggestions([]);
  };

  // Modelos filtrados según marca seleccionada
  const filteredModelsList = useMemo(() => {
    const brand = formData.device.brand.toLowerCase();
    const query = modelSearchQuery.toLowerCase().trim();

    return models.filter(m => {
      const matchesBrand = (m.brand || '').toLowerCase() === brand;
      if (!matchesBrand && brand !== 'otra') return false;
      if (query && !m.model.toLowerCase().includes(query)) return false;
      return true;
    }).slice(0, 15);
  }, [models, formData.device.brand, modelSearchQuery]);

  const handleSelectModel = (modelObj) => {
    setFormData(prev => ({
      ...prev,
      device: {
        ...prev.device,
        model: modelObj.model,
        brand: modelObj.brand || prev.device.brand,
        type: modelObj.type === 'iphone' ? 'iPhone' : (modelObj.type === 'notebook' ? 'Notebook' : 'Smartphone')
      }
    }));
    setModelSearchQuery(modelObj.model);
    setShowModelSuggestions(false);
  };

  // Generar Tag ID interno si no tiene IMEI
  const handleGenerateImeiTag = () => {
    const randomTag = `MON-${Math.floor(10000 + Math.random() * 90000)}`;
    setFormData(prev => ({
      ...prev,
      device: {
        ...prev.device,
        imei: randomTag
      }
    }));
  };

  // Atajos rápidos de fecha estimada de entrega
  const setQuickDeliveryTime = (hoursFromNow) => {
    const date = new Date(Date.now() + hoursFromNow * 3600 * 1000);
    // Formatear para input datetime-local: YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;

    setFormData(prev => ({
      ...prev,
      service: {
        ...prev.service,
        estimatedDeliveryDate: formatted
      }
    }));
  };

  // Validar y Crear Orden
  const handleSubmitOrder = (e) => {
    e?.preventDefault();

    if (!formData.customer.name.trim()) {
      alert('Por favor, ingresá el nombre del cliente.');
      clientInputRef.current?.focus();
      return;
    }

    if (!formData.customer.phone.trim()) {
      alert('Por favor, ingresá un teléfono o WhatsApp de contacto.');
      return;
    }

    if (!formData.device.model.trim()) {
      alert('Por favor, seleccioná o escribí el modelo del equipo.');
      modelInputRef.current?.focus();
      return;
    }

    if (!formData.service.requestedRepair.trim()) {
      alert('Por favor, especificá la reparación o falla solicitada.');
      return;
    }

    // Guardar orden
    const savedOrder = createRepairOrder({
      customer: formData.customer,
      device: formData.device,
      service: {
        ...formData.service,
        budgetTotal: parseFloat(formData.service.budgetTotal) || 0,
        deposit: parseFloat(formData.service.deposit) || 0
      }
    });

    // Abrir ticket de impresión y comprobante
    setActiveTicketOrder(savedOrder);
    setActiveSubModal('ticket_view');

    // Resetear formulario a nuevo
    setFormData(initialFormState);
    setModelSearchQuery('');
  };

  // Login de empleados
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginEmployee(pinInput)) {
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  if (!isTallerOpen) return null;

  // 1. PANTALLA DE LOGIN SI NO ESTÁ AUTENTICADO COMO EMPLEADO
  if (!isEmployeeAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
        <div className="bg-[#141416] border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(255,85,0,0.3)] relative">
          
          <button
            onClick={() => setIsTallerOpen(false)}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_25px_rgba(255,85,0,0.3)]">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-heading font-bold text-white">
              Terminal de Mostrador & Taller
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Ingresá tu clave de empleado para acceder al sistema de recepción de órdenes.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Clave de Acceso Taller
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="Clave de mostrador..."
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-[#FF5500] text-sm font-mono"
                  autoFocus
                />
              </div>
              {pinError && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Clave incorrecta. Intentá con montec2026 o 2026.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#FF5500] hover:bg-[#FF6600] text-white font-heading font-bold rounded-xl text-sm shadow-[0_0_20px_rgba(255,85,0,0.4)] transition-all cursor-pointer"
            >
              Iniciar Turno en Mostrador
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. INTERFAZ PRINCIPAL POS DE RECEPCIÓN (LAYOUT EN 3 COLUMNAS MONTEC DARK)
  return (
    <div className="fixed inset-0 z-50 bg-[#0E0E10] text-zinc-200 flex flex-col overflow-hidden animate-fade-in">
      
      {/* BARRA SUPERIOR DE TERMINAL */}
      <header className="bg-zinc-950 border-b border-zinc-800/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF5500] text-white font-black flex items-center justify-center text-sm shadow-md">
            M
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-heading font-black text-white leading-tight flex items-center gap-2">
              <span>MONTEC TALLER</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                MOSTRADOR ACTIVO
              </span>
            </h1>
            <p className="text-[10px] text-zinc-400">
              Montes Carballo 943 • Recepción de Equipos & Órdenes de Servicio
            </p>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubModal('orders_list')}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ver listado de órdenes registradas"
          >
            <List className="w-3.5 h-3.5 text-[#FF5500]" />
            <span className="hidden sm:inline">Ver Órdenes Guardadas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Deseas bloquear la terminal de taller?')) {
                logoutEmployee();
              }
            }}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors cursor-pointer"
            title="Bloquear Terminal"
          >
            <Lock className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsTallerOpen(false)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors cursor-pointer"
            title="Cerrar ventana de mostrador"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ÁREA DE TRABAJO EN 3 COLUMNAS (SCROLLABLE INDEPENDIENTE) */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
        <form onSubmit={handleSubmitOrder} className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* ========================================================================= */}
          {/* COLUMNA 1: DATOS DEL CLIENTE */}
          {/* ========================================================================= */}
          <section className="bg-[#141416] border border-zinc-800/90 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h2 className="text-xs uppercase font-black tracking-wider text-[#FF5500] flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>Columna 1: Datos del Cliente</span>
              </h2>
              <span className="text-[10px] text-zinc-500 font-mono">
                [Atajo F9]
              </span>
            </div>

            {/* Buscador Rápido de Clientes Previos */}
            <div className="relative">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={clientSearchQuery}
                  onChange={(e) => handleClientSearchChange(e.target.value)}
                  placeholder="Buscar cliente previo por DNI, nombre o tel..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FF5500]"
                />
              </div>

              {/* Sugerencias de clientes históricos */}
              {clientSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {clientSuggestions.map((c, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectClient(c)}
                      className="p-2.5 hover:bg-zinc-800 border-b border-zinc-800/60 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{c.name}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {c.docType}: {c.docNumber} • Tel: {c.phone}
                        </div>
                      </div>
                      <span className="text-[10px] text-[#FF5500] font-bold">Usar</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nombre Completo */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Nombre Completo <span className="text-[#FF5500]">*</span>
              </label>
              <input
                ref={clientInputRef}
                type="text"
                required
                value={formData.customer.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  customer: { ...prev.customer, name: e.target.value }
                }))}
                placeholder="ej: Juan Carlos Pérez"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#FF5500]"
              />
            </div>

            {/* Documento (Tipo & Número) */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.customer.docType}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, docType: e.target.value }
                  }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                >
                  <option value="DNI">DNI</option>
                  <option value="CUIT">CUIT</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Número de Documento
                </label>
                <input
                  type="text"
                  value={formData.customer.docNumber}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, docNumber: e.target.value }
                  }))}
                  placeholder="ej: 38492019"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#FF5500] font-mono"
                />
              </div>
            </div>

            {/* Teléfono / WhatsApp */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Teléfono / WhatsApp <span className="text-[#FF5500]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 select-none">
                  +54 9
                </span>
                <input
                  type="text"
                  required
                  value={formData.customer.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, phone: e.target.value }
                  }))}
                  placeholder="223 512-3456"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-16 pr-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#FF5500] font-mono"
                />
              </div>
            </div>

            {/* Condición ante IVA & Email */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Condición IVA
                </label>
                <select
                  value={formData.customer.taxCondition}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, taxCondition: e.target.value }
                  }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                >
                  <option value="Consumidor Final">Consumidor Final</option>
                  <option value="Monotributo">Monotributo</option>
                  <option value="Responsable Inscripto">Resp. Inscripto</option>
                  <option value="Exento">Exento</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={formData.customer.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, email: e.target.value }
                  }))}
                  placeholder="cliente@email.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#FF5500]"
                />
              </div>
            </div>

            {/* Checkboxes de Notificación */}
            <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.customer.sendWhatsApp}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, sendWhatsApp: e.target.checked }
                  }))}
                  className="accent-[#FF5500] w-3.5 h-3.5 rounded"
                />
                <span className="text-zinc-300 text-[11px]">Enviar comprobante por WhatsApp</span>
              </label>

              <button
                type="button"
                onClick={() => setShowInternalNotes(!showInternalNotes)}
                className="text-[10px] text-[#FF5500] hover:underline cursor-pointer"
              >
                {showInternalNotes ? 'Ocultar notas' : '+ Notas del Cliente'}
              </button>
            </div>

            {/* Notas Internas del Cliente (opcional) */}
            {showInternalNotes && (
              <div className="pt-1">
                <textarea
                  rows="2"
                  value={formData.customer.internalNotes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, internalNotes: e.target.value }
                  }))}
                  placeholder="Notas internas privadas (ej: cliente exigente, retirará su hermano...)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:border-[#FF5500]"
                />
              </div>
            )}
          </section>


          {/* ========================================================================= */}
          {/* COLUMNA 2: DATOS DEL EQUIPO & SEGURIDAD */}
          {/* ========================================================================= */}
          <section className="bg-[#141416] border border-zinc-800/90 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h2 className="text-xs uppercase font-black tracking-wider text-[#FF5500] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                <span>Columna 2: Equipo & Seguridad</span>
              </h2>
              <span className="text-[10px] text-zinc-500 font-mono">
                [Atajo F10]
              </span>
            </div>

            {/* Marca y Tipo */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Marca
                </label>
                <select
                  value={formData.device.brand}
                  onChange={(e) => {
                    const b = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      device: { 
                        ...prev.device, 
                        brand: b,
                        type: b === 'Apple' ? 'iPhone' : prev.device.type
                      }
                    }));
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-[#FF5500] font-semibold"
                >
                  <option value="Apple">Apple (iPhone / iPad)</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Motorola">Motorola</option>
                  <option value="Xiaomi">Xiaomi</option>
                  <option value="LG">LG</option>
                  <option value="TCL">TCL</option>
                  <option value="ZTE">ZTE</option>
                  <option value="Lenovo">Lenovo</option>
                  <option value="HP">HP</option>
                  <option value="Dell">Dell</option>
                  <option value="Asus">Asus</option>
                  <option value="Otra">Otra marca...</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Tipo de Dispositivo
                </label>
                <select
                  value={formData.device.type}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    device: { ...prev.device, type: e.target.value }
                  }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                >
                  <option value="Smartphone">Smartphone Android</option>
                  <option value="iPhone">iPhone / Apple</option>
                  <option value="Tablet">Tablet / iPad</option>
                  <option value="Notebook">Notebook / Mac</option>
                  <option value="Smartwatch">Smartwatch</option>
                </select>
              </div>
            </div>

            {/* Modelo Exacto (Predictivo vinculado a modelos de Montec) */}
            <div className="relative">
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Modelo Exacto <span className="text-[#FF5500]">*</span>
              </label>
              <input
                ref={modelInputRef}
                type="text"
                required
                value={formData.device.model}
                onFocus={() => setShowModelSuggestions(true)}
                onChange={(e) => {
                  const val = e.target.value;
                  setModelSearchQuery(val);
                  setFormData(prev => ({
                    ...prev,
                    device: { ...prev.device, model: val }
                  }));
                  setShowModelSuggestions(true);
                }}
                placeholder="ej: iPhone 13, Galaxy A54 5G, Moto G22..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#FF5500]"
              />

              {/* Menú desplegable predictivo */}
              {showModelSuggestions && filteredModelsList.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-44 overflow-y-auto">
                  {filteredModelsList.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleSelectModel(m)}
                      className="px-3 py-2 hover:bg-[#FF5500]/20 hover:text-white border-b border-zinc-800/60 cursor-pointer text-xs flex items-center justify-between"
                    >
                      <span className="font-semibold text-zinc-200">{m.model}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{m.brand} • {m.year || ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* IMEI / Serie & Tag ID automático */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-zinc-300">
                  IMEI / Número de Serie
                </label>
                <button
                  type="button"
                  onClick={handleGenerateImeiTag}
                  className="text-[10px] text-[#FF5500] hover:underline font-mono cursor-pointer"
                >
                  ⚡ Autogenerar Tag
                </button>
              </div>
              <input
                type="text"
                value={formData.device.imei}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  device: { ...prev.device, imei: e.target.value }
                }))}
                placeholder="358920... o Tag #MON-XXXX"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#FF5500] font-mono"
              />
            </div>

            {/* Color & Estado Estético Exterior */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  value={formData.device.color}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    device: { ...prev.device, color: e.target.value }
                  }))}
                  placeholder="ej: Negro"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#FF5500]"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Estado Estético Externo
                </label>
                <input
                  type="text"
                  value={formData.device.aestheticCondition}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    device: { ...prev.device, aestheticCondition: e.target.value }
                  }))}
                  placeholder="ej: Rayas en bisel, vidrio templado roto..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#FF5500]"
                />
              </div>
            </div>

            {/* BLOQUE INTERACTIVO DE SEGURIDAD / DESBLOQUEO */}
            <div className="pt-2 border-t border-zinc-850 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Desbloqueo / Seguridad:
                </label>
                
                {/* Selector de tipo de bloqueo */}
                <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
                  {['pattern', 'pin', 'password', 'none'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        device: {
                          ...prev.device,
                          security: { ...prev.device.security, type: t }
                        }
                      }))}
                      className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                        formData.device.security.type === t 
                          ? 'bg-[#FF5500] text-white font-bold' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t === 'pattern' ? 'Patrón 3x3' : (t === 'pin' ? 'PIN' : (t === 'password' ? 'Clave' : 'Sin clave'))}
                    </button>
                  ))}
                </div>
              </div>

              {/* Render condicional según tipo de bloqueo */}
              {formData.device.security.type === 'pattern' && (
                <PatternLockInput
                  value={formData.device.security.patternSequence}
                  onChange={(seq) => setFormData(prev => ({
                    ...prev,
                    device: {
                      ...prev.device,
                      security: { ...prev.device.security, patternSequence: seq }
                    }
                  }))}
                />
              )}

              {formData.device.security.type === 'pin' && (
                <div className="relative">
                  <input
                    type="text"
                    value={formData.device.security.pin}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      device: {
                        ...prev.device,
                        security: { ...prev.device.security, pin: e.target.value }
                      }
                    }))}
                    placeholder="PIN numérico (ej: 1234, 0000)..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#FF5500] font-mono text-center tracking-widest text-sm"
                  />
                </div>
              )}

              {formData.device.security.type === 'password' && (
                <div>
                  <input
                    type="text"
                    value={formData.device.security.pin}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      device: {
                        ...prev.device,
                        security: { ...prev.device.security, pin: e.target.value }
                      }
                    }))}
                    placeholder="Contraseña alfanumérica..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#FF5500]"
                  />
                </div>
              )}

              {/* Cuenta Apple / Google opcional */}
              <div>
                <input
                  type="text"
                  value={formData.device.security.accountInfo}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    device: {
                      ...prev.device,
                      security: { ...prev.device.security, accountInfo: e.target.value }
                    }
                  }))}
                  placeholder="Cuenta Apple ID / Google / Clave (solo si requiere restauración)..."
                  className="w-full bg-zinc-950/60 border border-zinc-850 rounded-xl px-3 py-1.5 text-[11px] text-zinc-300 placeholder-zinc-600 outline-none focus:border-[#FF5500]"
                />
              </div>
            </div>
          </section>


          {/* ========================================================================= */}
          {/* COLUMNA 3: REPARACIÓN, REPUESTOS & CONDICIONES */}
          {/* ========================================================================= */}
          <section className="bg-[#141416] border border-zinc-800/90 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h2 className="text-xs uppercase font-black tracking-wider text-[#FF5500] flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>Columna 3: Reparación & Condiciones</span>
              </h2>
              <span className="text-[10px] text-zinc-500 font-mono">
                [Atajo F12]
              </span>
            </div>

            {/* Ubicación y Técnico */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Ubicación de Trabajo
                </label>
                <select
                  value={formData.service.location}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    service: { ...prev.service, location: e.target.value }
                  }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                >
                  <option value="En Taller (Montes Carballo)">En Taller (Montes Carballo)</option>
                  <option value="Derivado a Laboratorio">Derivado a Laboratorio</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Asignado a Técnico
                </label>
                <input
                  type="text"
                  value={formData.service.technician}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    service: { ...prev.service, technician: e.target.value }
                  }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                />
              </div>
            </div>

            {/* Falla Solicitada por el Cliente */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Reparación Solicitada por el Cliente <span className="text-[#FF5500]">*</span>
              </label>
              <textarea
                required
                rows="2"
                value={formData.service.requestedRepair}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  service: { ...prev.service, requestedRepair: e.target.value }
                }))}
                placeholder="ej: Cambio de Módulo OLED por pantalla rota, sin imagen..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#FF5500]"
              />
            </div>

            {/* Diagnóstico Previo de Entrada */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Diagnóstico Previo / Observaciones de Entrada
              </label>
              <input
                type="text"
                value={formData.service.preliminaryDiagnosis}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  service: { ...prev.service, preliminaryDiagnosis: e.target.value }
                }))}
                placeholder="ej: Vibra al enchufar, chasis doblado levemente..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#FF5500]"
              />
            </div>

            {/* Checklist Rápido de Entrada */}
            <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800/80 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-zinc-400">
                Checklist Rápido de Entrada:
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                {[
                  { key: 'turnsOn', label: 'Enciende' },
                  { key: 'touchOk', label: 'Táctil OK' },
                  { key: 'camerasOk', label: 'Cámaras OK' },
                  { key: 'audioOk', label: 'Audio / Mic OK' },
                  { key: 'chargingOk', label: 'Carga OK' },
                  { key: 'biometricsOk', label: 'Huella / Face ID' },
                  { key: 'simTrayPresent', label: 'Bandeja SIM' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.service.checklist[item.key]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        service: {
                          ...prev.service,
                          checklist: {
                            ...prev.service.checklist,
                            [item.key]: e.target.checked
                          }
                        }
                      }))}
                      className="accent-[#FF5500] w-3.5 h-3.5 rounded"
                    />
                    <span className="text-zinc-300 text-[11px]">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* COSTOS, SEÑA Y SALDO RESTANTE */}
            <div className="bg-gradient-to-r from-zinc-950 via-[#1C120C] to-zinc-950 p-3 rounded-xl border border-[#FF5500]/40 space-y-2 shadow-inner">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Presupuesto Total ($)
                  </label>
                  <input
                    type="number"
                    value={formData.service.budgetTotal}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      service: { ...prev.service, budgetTotal: e.target.value }
                    }))}
                    placeholder="0"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm text-white font-mono font-bold outline-none focus:border-[#FF5500]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-400 mb-1">
                    Seña / Anticipo ($)
                  </label>
                  <input
                    type="number"
                    value={formData.service.deposit}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      service: { ...prev.service, deposit: e.target.value }
                    }))}
                    placeholder="0"
                    className="w-full bg-zinc-900 border border-emerald-500/50 rounded-xl px-3 py-1.5 text-sm text-emerald-400 font-mono font-bold outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Saldo Calculado Automáticamente */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Saldo a Pagar al Retirar:
                </span>
                <span className="text-lg font-black font-mono text-[#FF5500]">
                  ${(formData.service.balanceDue || 0).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Fecha y Hora de Entrega Pactada */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-zinc-300">
                  Fecha y Hora de Entrega Estimada:
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setQuickDeliveryTime(3)}
                    className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
                  >
                    +3hs
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeliveryTime(24)}
                    className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
                  >
                    +24hs
                  </button>
                </div>
              </div>

              <input
                type="datetime-local"
                value={formData.service.estimatedDeliveryDate}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  service: { ...prev.service, estimatedDeliveryDate: e.target.value }
                }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#FF5500] font-mono"
              />
            </div>

            {/* BOTÓN PRINCIPAL GENERAR ORDEN */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#FF5500] to-[#E64D00] hover:from-[#FF6600] hover:to-[#FF5500] text-white font-heading font-black rounded-xl text-sm shadow-[0_0_30px_rgba(255,85,0,0.5)] transition-all transform hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4 fill-white" />
                <span>GENERAR ORDEN DE SERVICIO (F12)</span>
              </button>
            </div>

          </section>

        </form>
      </main>

      {/* SUB-MODAL 1: TICKET DE IMPRESIÓN Y WHATSAPP */}
      {activeSubModal === 'ticket_view' && activeTicketOrder && (
        <OrderTicketModal
          order={activeTicketOrder}
          onClose={() => setActiveSubModal(null)}
        />
      )}

      {/* SUB-MODAL 2: GESTOR Y LISTA DE ÓRDENES REGISTRADAS */}
      {activeSubModal === 'orders_list' && (
        <OrdersListModal
          onSelectOrder={(order) => {
            setActiveTicketOrder(order);
            setActiveSubModal('ticket_view');
          }}
          onNewOrder={() => setActiveSubModal(null)}
          onClose={() => setActiveSubModal(null)}
        />
      )}

    </div>
  );
}
