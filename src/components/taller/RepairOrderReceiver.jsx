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
  Info,
  ExternalLink,
  Calculator,
  Wrench,
  Package,
  ShoppingCart,
  Zap,
  Maximize2,
  BatteryCharging,
  Volume2,
  Lightbulb,
  Sun,
  Moon
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { searchPartsForRepair, generateQuickSupplierLinks, detectPartCategory } from '../../services/partsSearchService';
import PatternLockInput from './PatternLockInput';
import OrderTicketModal from './OrderTicketModal';
import RepairOrdersManager from './RepairOrdersManager';
import CostBreakdownModal from './CostBreakdownModal';

export default function RepairOrderReceiver({ forceOpen = false, onClose = null }) {
  const auth = useAuth();
  const { 
    isTallerOpen, 
    setIsTallerOpen, 
    isEmployeeAuthenticated, 
    loginEmployee, 
    logoutEmployee, 
    models, 
    issues,
    createRepairOrder, 
    searchClients,
    calculateCurrentEstimate,
    setIsQuoteModalOpen,
    dolarRate,
    panelTheme,
    togglePanelTheme,
    addModel
  } = useData();

  const isLight = panelTheme === 'light';

  // Helpers de estilos adaptados al tema
  const inputBaseClass = isLight
    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#FF5500]'
    : 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-[#FF5500]';

  const selectBaseClass = isLight
    ? 'bg-white border-slate-300 text-slate-900 focus:bg-white focus:border-[#FF5500]'
    : 'bg-zinc-950 border-zinc-800 text-white focus:border-[#FF5500]';

  const labelTextClass = isLight ? 'text-slate-700' : 'text-zinc-300';
  const labelClass = `block text-[11px] font-bold mb-1 ${labelTextClass}`;
  const subTextClass = isLight ? 'text-slate-500' : 'text-zinc-400';

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

  // Estados para agregar nuevos modelos de teléfonos directamente desde el mostrador
  const [isNewModelModalOpen, setIsNewModelModalOpen] = useState(false);
  const [newModelData, setNewModelData] = useState({
    brand: 'Apple',
    customBrand: '',
    model: '',
    type: 'Smartphone',
    year: new Date().getFullYear().toString()
  });
  const [modelSuccessNotice, setModelSuccessNotice] = useState(null);
  const [customBrandInput, setCustomBrandInput] = useState('');

  // Lista de técnicos configurables y asignación
  const DEFAULT_TECHNICIANS = [
    'Javier (Laboratorio Central)',
    'Operador Mostrador',
    'Técnico 1',
    'Técnico 2',
    'Sin Asignar'
  ];

  const [techniciansList, setTechniciansList] = useState(() => {
    try {
      const saved = localStorage.getItem('montec_technicians_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_TECHNICIANS;
  });

  const [isAddingTechnician, setIsAddingTechnician] = useState(false);
  const [newTechnicianInput, setNewTechnicianInput] = useState('');

  const handleAddTechnician = () => {
    const trimmed = newTechnicianInput.trim();
    if (!trimmed) return;
    if (!techniciansList.includes(trimmed)) {
      const updated = [...techniciansList, trimmed];
      setTechniciansList(updated);
      try {
        localStorage.setItem('montec_technicians_list', JSON.stringify(updated));
      } catch {}
    }
    setFormData(prev => ({
      ...prev,
      service: { ...prev.service, technician: trimmed }
    }));
    setNewTechnicianInput('');
    setIsAddingTechnician(false);
  };

  // Refs para atajos de teclado F9, F10, F12
  const clientInputRef = useRef(null);
  const modelInputRef = useRef(null);
  const modelSuggestionsRef = useRef(null);

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
      warranty: '90 días de garantía escrita',
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

  // --- COTIZADOR EN VIVO & BÚSQUEDA DE REPUESTOS DE TALLER ---
  const [selectedIssueId, setSelectedIssueId] = useState('screen');
  const [selectedModalityKey, setSelectedModalityKey] = useState('compatible_unknown');
  const [showAllParts, setShowAllParts] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);

  const COMMON_REPAIR_ISSUES = [
    { id: 'screen', name: 'Módulo / Pantalla Completa', icon: Maximize2, badge: 'Pantalla' },
    { id: 'battery', name: 'Cambio de Batería', icon: BatteryCharging, badge: 'Batería' },
    { id: 'charging-port', name: 'Pin de Carga / Subplaca', icon: Zap, badge: 'Carga' },
    { id: 'back-glass', name: 'Cambio de Tapa Trasera de Vidrio', icon: Smartphone, badge: 'Tapa' },
    { id: 'motherboard', name: 'Microelectrónica / Placa', icon: Cpu, badge: 'Placa' },
    { id: 'thermal-maintenance', name: 'Limpieza y Mantenimiento Térmico', icon: Wrench, badge: 'Térmico' },
    { id: 'custom', name: 'Otro (Personalizado)', icon: Sparkles, badge: 'Otro' }
  ];

  // Dispositivo activo normalizado para el cotizador
  const currentDeviceType = useMemo(() => {
    const rawType = (formData.device.type || '').toLowerCase();
    const brand = (formData.device.brand || '').toLowerCase();
    if (rawType.includes('iphone') || brand === 'apple') return 'iphone';
    if (rawType.includes('notebook') || rawType.includes('laptop') || rawType.includes('mac')) return 'notebook';
    return 'android';
  }, [formData.device.type, formData.device.brand]);

  // Modelo coincidente en el catálogo de modelos
  const matchedModel = useMemo(() => {
    if (!formData.device.model) return null;
    const cleanInput = formData.device.model.trim().toLowerCase();
    return models.find(m => m.model.toLowerCase() === cleanInput) ||
           models.find(m => m.model.toLowerCase().includes(cleanInput)) || null;
  }, [formData.device.model, models]);

  // Cotización calculada en vivo con el motor oficial de Montec
  const liveEstimate = useMemo(() => {
    if (selectedIssueId === 'custom') return null;
    if (!formData.device.model || formData.device.model.trim().length < 2) return null;
    if (typeof calculateCurrentEstimate !== 'function') return null;

    try {
      const activeModelId = matchedModel ? matchedModel.id : null;
      return calculateCurrentEstimate(
        currentDeviceType,
        activeModelId,
        selectedIssueId,
        formData.device.model,
        { iphoneOptionKey: selectedModalityKey }
      );
    } catch (err) {
      console.error('Error calculando cotización en taller:', err);
      return null;
    }
  }, [currentDeviceType, matchedModel, selectedIssueId, selectedModalityKey, formData.device.model, calculateCurrentEstimate]);

  // Cálculo de fecha/hora de entrega estimada según matriz de tiempos
  const getSuggestedDeliveryISO = (issueId, modalityKey, devType) => {
    let hours = 3; // Estándar de 2 a 3 horas
    if (issueId === 'motherboard') {
      hours = 48; // Microelectrónica y diagnóstico complejo 24 a 48 hs
    } else if (devType === 'iphone' && (issueId === 'back-glass' || issueId === 'battery' || modalityKey === 'ic_transplant')) {
      hours = 24; // Reparaciones de precisión o láser 24 hs
    } else if (issueId === 'custom') {
      hours = 24;
    }
    const date = new Date(Date.now() + hours * 3600 * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${h}:${m}`;
  };

  // Generación automática de descripción técnica solicitada
  const getSuggestedDescription = (issueId, devType, estimate, modelName) => {
    if (issueId === 'screen') {
      if (devType === 'iphone') {
        const quality = estimate?.qualityLabel || 'Calidad Original / Premium';
        return `Cambio de Módulo Pantalla (${quality}) + Reprogramación True Tone`;
      }
      const opt = estimate?.qualityLabel ? `(${estimate.qualityLabel})` : '';
      return `Cambio de Módulo / Pantalla Completa ${opt}`.trim();
    }
    if (issueId === 'battery') {
      if (devType === 'iphone') {
        if (estimate?.selectedModality?.key === 'bms_transplant') {
          return 'Cambio de Batería con Traspaso Flex BMS & Reprogramación 100% (Sin Aviso Apple)';
        }
        return 'Cambio de Batería Calidad Original / Premium';
      }
      return 'Cambio de Batería Original / Premium (Celdas Nuevas 100%)';
    }
    if (issueId === 'charging-port') {
      return 'Reparación de Puerto de Carga / Subplaca de Alimentación';
    }
    if (issueId === 'back-glass') {
      return devType === 'iphone' 
        ? 'Cambio de Tapa Trasera de Vidrio con Remoción Láser (Conserva MagSafe)'
        : 'Cambio de Tapa Trasera / Carcasa Original';
    }
    if (issueId === 'motherboard') {
      return 'Diagnóstico y Reparación en Placa Madre (Microelectrónica)';
    }
    if (issueId === 'thermal-maintenance') {
      return 'Limpieza Integral y Mantenimiento Térmico (Cambio de Pasta Térmica)';
    }
    if (issueId === 'custom') {
      return '';
    }
    return estimate?.issueName || 'Reparación técnica';
  };

  // Manejar selección de modelo y autocompletar cotización en vivo en 1 clic
  const handleSelectModel = (modelObj) => {
    const devType = modelObj.type === 'iphone' ? 'iphone' : (modelObj.type === 'notebook' ? 'notebook' : 'android');
    const modelName = modelObj.model;
    const brandName = modelObj.brand || formData.device.brand;

    setModelSearchQuery(modelName);
    setShowModelSuggestions(false);

    let estimate = null;
    if (selectedIssueId !== 'custom' && typeof calculateCurrentEstimate === 'function') {
      estimate = calculateCurrentEstimate(
        devType,
        modelObj.id,
        selectedIssueId,
        modelName,
        { iphoneOptionKey: selectedModalityKey }
      );
    }

    const suggestedPrice = estimate?.minPrice ? estimate.minPrice.toString() : '';
    const suggestedDesc = selectedIssueId !== 'custom' 
      ? getSuggestedDescription(selectedIssueId, devType, estimate, modelName)
      : formData.service.requestedRepair;
    const suggestedTime = getSuggestedDeliveryISO(selectedIssueId, selectedModalityKey, devType);
    const suggestedWarranty = estimate?.warranty || '90 días de garantía escrita';

    setFormData(prev => ({
      ...prev,
      device: {
        ...prev.device,
        model: modelName,
        brand: brandName,
        type: modelObj.type === 'iphone' ? 'iPhone' : (modelObj.type === 'notebook' ? 'Notebook' : 'Smartphone')
      },
      service: {
        ...prev.service,
        requestedRepair: suggestedDesc,
        budgetTotal: suggestedPrice !== '' ? suggestedPrice : prev.service.budgetTotal,
        estimatedDeliveryDate: suggestedTime,
        warranty: prev.service.warranty || suggestedWarranty
      }
    }));
  };

  // Notificación flotante de modelo guardado
  const showModelNotice = (text) => {
    setModelSuccessNotice(text);
    setTimeout(() => setModelSuccessNotice(null), 3500);
  };

  // Guardar rápidamente el modelo tipeado en el mostrador
  const handleQuickSaveModel = (modelName) => {
    if (!modelName || !modelName.trim()) return;
    const cleanName = modelName.trim();
    let brandToUse = formData.device.brand;
    if (brandToUse === 'Otra' && customBrandInput.trim()) {
      brandToUse = customBrandInput.trim();
    }
    const devType = brandToUse.toLowerCase() === 'apple' ? 'iphone' : (formData.device.type === 'Notebook' ? 'notebook' : 'android');
    const saved = addModel({
      brand: brandToUse,
      model: cleanName,
      type: devType,
      year: new Date().getFullYear()
    });
    handleSelectModel(saved);
    showModelNotice(`Modelo "${cleanName}" (${brandToUse}) guardado en el catálogo.`);
    setShowModelSuggestions(false);
  };

  // Guardar modelo desde el modal detallado
  const handleSaveNewModelModal = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newModelData.model.trim()) return;
    const brandToUse = newModelData.brand === 'Otra' && newModelData.customBrand.trim()
      ? newModelData.customBrand.trim()
      : newModelData.brand;
    const devType = brandToUse.toLowerCase() === 'apple' ? 'iphone' : (newModelData.type === 'Notebook' ? 'notebook' : 'android');
    const saved = addModel({
      brand: brandToUse,
      model: newModelData.model.trim(),
      type: devType,
      year: parseInt(newModelData.year, 10) || new Date().getFullYear()
    });
    handleSelectModel(saved);
    showModelNotice(`Modelo "${newModelData.model.trim()}" (${brandToUse}) guardado y seleccionado.`);
    setIsNewModelModalOpen(false);
    setNewModelData({
      brand: 'Apple',
      customBrand: '',
      model: '',
      type: 'Smartphone',
      year: new Date().getFullYear().toString()
    });
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

  // Repuestos compatibles encontrados en catálogos de proveedores
  const matchingParts = useMemo(() => {
    if (!formData.device.model || formData.device.model.trim().length < 2) return [];
    return searchPartsForRepair(
      formData.device.model,
      formData.device.brand,
      selectedIssueId,
      formData.service.requestedRepair
    );
  }, [formData.device.model, formData.device.brand, selectedIssueId, formData.service.requestedRepair]);

  // Categoría detectada y enlaces de búsqueda rápida directa
  const detectedCategory = useMemo(() => {
    return detectPartCategory(selectedIssueId, formData.service.requestedRepair);
  }, [selectedIssueId, formData.service.requestedRepair]);

  const quickSupplierLinks = useMemo(() => {
    return generateQuickSupplierLinks(formData.device.model, detectedCategory.label);
  }, [formData.device.model, detectedCategory.label]);

  // Aplicar precio del cotizador directamente al presupuesto total
  const handleApplyEstimatePrice = (price) => {
    if (!price) return;
    setFormData(prev => ({
      ...prev,
      service: {
        ...prev.service,
        budgetTotal: price.toString()
      }
    }));
  };

  // Manejar selección de falla con autocompletado total en 1 clic
  const handleSelectIssueType = (issue, forcedModalityKey = null) => {
    const issueId = issue.id;
    setSelectedIssueId(issueId);

    if (issueId === 'custom') {
      setFormData(prev => ({
        ...prev,
        service: {
          ...prev.service,
          requestedRepair: '',
          budgetTotal: '',
          warranty: prev.service.warranty || '90 días de garantía escrita',
          estimatedDeliveryDate: getSuggestedDeliveryISO('custom', null, currentDeviceType)
        }
      }));
      return;
    }

    const activeModelId = matchedModel ? matchedModel.id : null;
    const modalityToUse = forcedModalityKey || selectedModalityKey;
    let estimate = null;

    if (typeof calculateCurrentEstimate === 'function') {
      estimate = calculateCurrentEstimate(
        currentDeviceType,
        activeModelId,
        issueId,
        formData.device.model,
        { iphoneOptionKey: modalityToUse }
      );
    }

    const suggestedPrice = estimate?.minPrice ? estimate.minPrice.toString() : '';
    const suggestedDesc = getSuggestedDescription(issueId, currentDeviceType, estimate, formData.device.model);
    const suggestedTime = getSuggestedDeliveryISO(issueId, modalityToUse, currentDeviceType);
    const suggestedWarranty = estimate?.warranty || '90 días de garantía escrita';

    setFormData(prev => ({
      ...prev,
      service: {
        ...prev.service,
        requestedRepair: suggestedDesc,
        budgetTotal: suggestedPrice || prev.service.budgetTotal,
        estimatedDeliveryDate: suggestedTime,
        warranty: prev.service.warranty || suggestedWarranty
      }
    }));
  };

  // Cambiar modalidad de calidad (ej: iPhone Original vs Premium, o con/sin BMS)
  const handleSelectModality = (mod) => {
    setSelectedModalityKey(mod.key);
    handleSelectIssueType({ id: selectedIssueId }, mod.key);
  };

  // Estado de envío a base de datos
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Validar y Crear Orden
  const handleSubmitOrder = async (e) => {
    e?.preventDefault();

    if (isSubmittingOrder) return;

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

    const totalNum = parseFloat(formData.service.budgetTotal) || 0;
    const depositNum = parseFloat(formData.service.deposit) || 0;

    setIsSubmittingOrder(true);

    try {
      // Guardar orden (sincroniza con PostgreSQL en Railway y obtiene #MON-XXXX oficial)
      const savedOrder = await createRepairOrder({
        customer: formData.customer,
        device: formData.device,
        service: {
          ...formData.service,
          budgetTotal: totalNum,
          deposit: depositNum,
          balanceDue: Math.max(0, totalNum - depositNum),
          warranty: formData.service.warranty || '90 días de garantía escrita'
        }
      });

      // Abrir ticket de impresión y comprobante
      setActiveTicketOrder(savedOrder);
      setActiveSubModal('ticket_view');

      // Resetear formulario a nuevo
      setFormData(initialFormState);
      setModelSearchQuery('');
    } catch (err) {
      console.error('Error al generar orden:', err);
      alert('Ocurrió un inconveniente al generar la orden. Se guardó localmente.');
    } finally {
      setIsSubmittingOrder(false);
    }
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

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsTallerOpen(false);
    }
  };

  if (!isTallerOpen && !forceOpen) return null;

  // Si ya está autenticado en la sesión (por PIN 1234 o Admin) o se invoca desde el Cockpit, NUNCA pedir clave
  const isAlreadyAuthenticated = Boolean(auth?.isAuthenticated || isEmployeeAuthenticated || forceOpen);

  // 1. PANTALLA DE LOGIN SI NO ESTÁ AUTENTICADO
  if (!isAlreadyAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
        <div className="bg-[#141416] border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(255,85,0,0.3)] relative">
          
          <button
            onClick={handleClose}
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
                  Clave incorrecta. Verificá los caracteres ingresados.
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
    <div className={`fixed inset-0 z-50 flex flex-col overflow-hidden animate-fade-in ${
      isLight ? 'montec-panel-light' : 'bg-[#0E0E10] text-zinc-200'
    }`}>
      
      {/* BARRA SUPERIOR DE TERMINAL (SIEMPRE NEGRO PARA PRESERVAR EL LOGO) */}
      <header className="bg-zinc-950 border-b border-zinc-800 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0">
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
          {/* Botón Minimalista de Cambio de Tema (Claro / Oscuro) */}
          <button
            type="button"
            onClick={togglePanelTheme}
            className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700 hover:border-zinc-500"
            title={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Modo Oscuro</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Modo Claro</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubModal('orders_list')}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
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
            className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Bloquear Terminal"
          >
            <Lock className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
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
          <section className={`border rounded-2xl p-4 flex flex-col gap-3 shadow-lg transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#141416] border-zinc-800/90'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2.5 ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
              <h2 className="text-xs uppercase font-black tracking-wider text-[#FF5500] flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>Columna 1: Datos del Cliente</span>
              </h2>
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
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
                  className={`w-full border rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none focus:border-[#FF5500] ${inputBaseClass}`}
                />
              </div>

              {/* Sugerencias de clientes históricos */}
              {clientSuggestions.length > 0 && (
                <div className={`absolute top-full left-0 right-0 z-30 mt-1 border rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto ${
                  isLight ? 'bg-white border-slate-300' : 'bg-zinc-900 border-zinc-700'
                }`}>
                  {clientSuggestions.map((c, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectClient(c)}
                      className={`p-2.5 border-b cursor-pointer flex items-center justify-between text-xs transition-colors ${
                        isLight ? 'hover:bg-slate-100 border-slate-200 text-slate-800' : 'hover:bg-zinc-800 border-zinc-800/60 text-white'
                      }`}
                    >
                      <div>
                        <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{c.name}</div>
                        <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
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
              <label className={labelClass}>
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
                className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] ${inputBaseClass}`}
              />
            </div>

            {/* Documento (Tipo & Número) */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelClass}>
                  Tipo
                </label>
                <select
                  value={formData.customer.docType}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, docType: e.target.value }
                  }))}
                  className={`w-full border rounded-xl px-2 py-2 text-xs outline-none focus:border-[#FF5500] ${selectBaseClass}`}
                >
                  <option value="DNI">DNI</option>
                  <option value="CUIT">CUIT</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className={labelClass}>
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
                  className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] font-mono ${inputBaseClass}`}
                />
              </div>
            </div>

            {/* Teléfono / WhatsApp */}
            <div>
              <label className={labelClass}>
                Teléfono / WhatsApp <span className="text-[#FF5500]">*</span>
              </label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono select-none ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
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
                  className={`w-full border rounded-xl pl-16 pr-3 py-2 text-xs outline-none focus:border-[#FF5500] font-mono ${inputBaseClass}`}
                />
              </div>
            </div>

            {/* Condición ante IVA & Email */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>
                  Condición IVA
                </label>
                <select
                  value={formData.customer.taxCondition}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, taxCondition: e.target.value }
                  }))}
                  className={`w-full border rounded-xl px-2 py-2 text-xs outline-none focus:border-[#FF5500] ${selectBaseClass}`}
                >
                  <option value="Consumidor Final">Consumidor Final</option>
                  <option value="Monotributo">Monotributo</option>
                  <option value="Responsable Inscripto">Resp. Inscripto</option>
                  <option value="Exento">Exento</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>
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
                  className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] ${inputBaseClass}`}
                />
              </div>
            </div>

            {/* Checkboxes de Notificación */}
            <div className={`pt-2 border-t flex items-center justify-between text-xs ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
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
                <span className={`text-[11px] ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>Enviar comprobante por WhatsApp</span>
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
                  className={`w-full border rounded-xl p-2.5 text-xs outline-none focus:border-[#FF5500] ${inputBaseClass}`}
                />
              </div>
            )}
          </section>


          {/* ========================================================================= */}
          {/* COLUMNA 2: DATOS DEL EQUIPO & SEGURIDAD */}
          {/* ========================================================================= */}
          <section className={`border rounded-2xl p-4 flex flex-col gap-3 shadow-lg transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#141416] border-zinc-800/90'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2.5 ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
              <h2 className="text-xs uppercase font-black tracking-wider text-[#FF5500] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                <span>Columna 2: Equipo & Seguridad</span>
              </h2>
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                [Atajo F10]
              </span>
            </div>

            {/* Marca y Tipo */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
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
                  className={`w-full border rounded-xl px-2.5 py-2 text-xs outline-none focus:border-[#FF5500] font-semibold transition-colors ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-950 border-zinc-800 text-white'
                  }`}
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
                <label className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  Tipo de Dispositivo
                </label>
                <select
                  value={formData.device.type}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    device: { ...prev.device, type: e.target.value }
                  }))}
                  className={`w-full border rounded-xl px-2.5 py-2 text-xs outline-none focus:border-[#FF5500] transition-colors ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-950 border-zinc-800 text-white'
                  }`}
                >
                  <option value="Smartphone">Smartphone Android</option>
                  <option value="iPhone">iPhone / Apple</option>
                  <option value="Tablet">Tablet / iPad</option>
                  <option value="Notebook">Notebook / Mac</option>
                  <option value="Smartwatch">Smartwatch</option>
                </select>
              </div>
            </div>

            {/* Campo adicional si la marca es "Otra" */}
            {formData.device.brand === 'Otra' && (
              <div className={`p-2.5 rounded-xl border animate-fade-in ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/60 border-zinc-800'
              }`}>
                <label className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  Especificar Nombre de la Marca <span className="text-[#FF5500]">*</span>
                </label>
                <input
                  type="text"
                  value={customBrandInput}
                  onChange={(e) => setCustomBrandInput(e.target.value)}
                  placeholder="ej: Infinix, Huawei, OnePlus, Sony, Honor, Alcatel..."
                  className={`w-full border rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-[#FF5500] ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-950 border-zinc-700 text-white'
                  }`}
                />
              </div>
            )}

            {/* Modelo Exacto (Predictivo vinculado a modelos de Montec) */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  Modelo Exacto <span className="text-[#FF5500]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setNewModelData(prev => ({
                      ...prev,
                      brand: formData.device.brand === 'Otra' ? (customBrandInput.trim() || 'Otra') : formData.device.brand,
                      customBrand: customBrandInput.trim(),
                      model: formData.device.model || '',
                      type: formData.device.type
                    }));
                    setIsNewModelModalOpen(true);
                  }}
                  className="text-[10px] text-[#FF5500] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  title="Agregar un nuevo modelo a la base de datos"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Agregar a la lista</span>
                </button>
              </div>

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
                className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] transition-colors ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white' 
                    : 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600'
                }`}
              />

              {/* Menú desplegable predictivo & Añadir si no está */}
              {showModelSuggestions && (
                <div 
                  ref={modelSuggestionsRef}
                  className={`absolute top-full left-0 right-0 z-30 mt-1 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto border ${
                    isLight ? 'bg-white border-slate-300' : 'bg-zinc-900 border-zinc-700'
                  }`}
                >
                  {filteredModelsList.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleSelectModel(m)}
                      className={`px-3 py-2 border-b cursor-pointer text-xs flex items-center justify-between transition-colors ${
                        isLight 
                          ? 'border-slate-100 hover:bg-orange-50/80 text-slate-800' 
                          : 'border-zinc-800/60 hover:bg-[#FF5500]/20 hover:text-white text-zinc-200'
                      }`}
                    >
                      <span className="font-semibold">{m.model}</span>
                      <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                        {m.brand} • {m.year || ''}
                      </span>
                    </div>
                  ))}

                  {/* Mensaje de no encontrado */}
                  {filteredModelsList.length === 0 && (
                    <div className={`p-3 text-xs text-center ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                      No se encontró este modelo en el catálogo de <strong>{formData.device.brand}</strong>.
                    </div>
                  )}

                  {/* Opción rápida para guardar el modelo escrito en 1 clic */}
                  {formData.device.model && formData.device.model.trim().length >= 1 && (
                    <div
                      onClick={() => handleQuickSaveModel(formData.device.model.trim())}
                      className={`px-3 py-2.5 border-t cursor-pointer flex items-center justify-between text-xs font-bold transition-colors ${
                        isLight 
                          ? 'bg-orange-50/90 hover:bg-orange-100 text-[#FF5500] border-slate-200' 
                          : 'bg-[#FF5500]/15 hover:bg-[#FF5500]/25 text-[#FF5500] border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span>Guardar <strong>"{formData.device.model.trim()}"</strong> en la lista</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#FF5500] text-white font-semibold shadow-sm">
                        + Guardar
                      </span>
                    </div>
                  )}
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
                className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] font-mono ${inputBaseClass}`}
              />
            </div>

            {/* Color & Estado Estético Exterior */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelClass}>
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
                  className={`w-full border rounded-xl px-2.5 py-2 text-xs outline-none focus:border-[#FF5500] ${inputBaseClass}`}
                />
              </div>

              <div className="col-span-2">
                <label className={labelClass}>
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
                  className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] ${inputBaseClass}`}
                />
              </div>
            </div>

            {/* BLOQUE INTERACTIVO DE SEGURIDAD / DESBLOQUEO */}
            <div className={`pt-2 border-t space-y-2.5 ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
              <div className="flex items-center justify-between">
                <label className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                  Desbloqueo / Seguridad:
                </label>
                
                {/* Selector de tipo de bloqueo */}
                <div className={`flex items-center gap-1 p-0.5 rounded-lg border text-[10px] ${
                  isLight ? 'bg-slate-100 border-slate-300' : 'bg-zinc-950 border-zinc-800'
                }`}>
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
                          ? 'bg-[#FF5500] text-white font-bold shadow-xs' 
                          : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white')
                      }`}
                    >
                      {t === 'pattern' ? 'Patrón 3×3' : (t === 'pin' ? 'PIN' : (t === 'password' ? 'Clave' : 'Sin Clave'))}
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
                    className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] font-mono text-center tracking-widest text-sm ${inputBaseClass}`}
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
                    className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] ${inputBaseClass}`}
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
                  className={`w-full border rounded-xl px-3 py-1.5 text-[11px] outline-none focus:border-[#FF5500] ${inputBaseClass}`}
                />
              </div>
            </div>
          </section>


          {/* ========================================================================= */}
          {/* COLUMNA 3: REPARACIÓN, REPUESTOS & CONDICIONES */}
          {/* ========================================================================= */}
          <section className={`border rounded-2xl p-4 flex flex-col gap-3 shadow-lg transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#141416] border-zinc-800/90'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2.5 ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
              <h2 className="text-xs uppercase font-black tracking-wider text-[#FF5500] flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>Columna 3: Reparación & Condiciones</span>
              </h2>
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-zinc-300">
                    Asignado a Técnico
                  </label>
                  {!isAddingTechnician && (
                    <button
                      type="button"
                      onClick={() => setIsAddingTechnician(true)}
                      className="text-[10px] text-[#FF5500] hover:underline cursor-pointer font-semibold"
                    >
                      + Nuevo
                    </button>
                  )}
                </div>

                {isAddingTechnician ? (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <input
                      type="text"
                      autoFocus
                      value={newTechnicianInput}
                      onChange={(e) => setNewTechnicianInput(e.target.value)}
                      placeholder="Nombre del técnico..."
                      className="flex-1 bg-zinc-950 border border-[#FF5500] rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTechnician();
                        } else if (e.key === 'Escape') {
                          setIsAddingTechnician(false);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddTechnician}
                      className="px-2.5 py-1.5 bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingTechnician(false)}
                      className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs rounded-xl cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.service.technician}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setIsAddingTechnician(true);
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          service: { ...prev.service, technician: e.target.value }
                        }));
                      }
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-[#FF5500] cursor-pointer font-medium"
                  >
                    {techniciansList.map(t => (
                      <option key={t} value={t}>
                        👨‍🔧 {t}
                      </option>
                    ))}
                    <option value="__add_new__" className="text-[#FF5500] font-bold">
                      ➕ Agregar nuevo técnico...
                    </option>
                  </select>
                )}
              </div>
            </div>

            {/* Selector Rápido de Tipo de Reparación / Falla */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-[11px] font-bold flex items-center gap-1.5 ${labelTextClass}`}>
                  <Wrench className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>Tipo de Reparación Frecuente:</span>
                </label>
                <span className={`text-[10px] font-mono ${subTextClass}`}>1-Clic</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                {COMMON_REPAIR_ISSUES.map((issue) => {
                  const IconComponent = issue.icon;
                  const isSelected = selectedIssueId === issue.id;
                  return (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => handleSelectIssueType(issue)}
                      className={`p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        isSelected
                          ? (isLight
                              ? 'bg-orange-50 border-[#FF5500] text-[#FF5500] font-bold shadow-xs'
                              : 'bg-[#FF5500]/20 border-[#FF5500] text-white shadow-[0_0_12px_rgba(255,85,0,0.3)]')
                          : (isLight
                              ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                              : 'bg-zinc-950/90 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700')
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-[#FF5500]' : (isLight ? 'text-slate-500' : 'text-zinc-400')}`} />
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />}
                      </div>
                      <span className="text-[10px] font-bold leading-tight truncate">{issue.badge}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-selector de Calidades / Modalidades (iPhone True Tone / BMS o Calidades alternativas) */}
              {liveEstimate?.modalities && liveEstimate.modalities.length > 1 && (
                <div className={`mb-2.5 p-2 rounded-xl border space-y-1.5 ${
                  isLight ? 'bg-orange-50/50 border-orange-200' : 'bg-zinc-950 border-[#FF5500]/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5500] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Calidad / Opciones de Repuesto:</span>
                    </span>
                    <span className={`text-[9px] font-mono ${subTextClass}`}>1-Clic</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {liveEstimate.modalities.map((mod) => {
                      const isModActive = (liveEstimate.selectedModality?.key === mod.key) || (selectedModalityKey === mod.key);
                      return (
                        <button
                          key={mod.key}
                          type="button"
                          onClick={() => handleSelectModality(mod)}
                          className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isModActive
                              ? (isLight
                                  ? 'bg-orange-100/70 border-[#FF5500] text-[#FF5500] shadow-xs'
                                  : 'bg-[#FF5500]/25 border-[#FF5500] text-white shadow-[0_0_10px_rgba(255,85,0,0.25)]')
                              : (isLight
                                  ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                  : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700')
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-0.5">
                            <span className="text-[10px] font-bold truncate">{mod.name}</span>
                            {isModActive && <Check className="w-3 h-3 text-[#FF5500]" />}
                          </div>
                          <div className={`text-[11px] font-mono font-bold ${isLight ? 'text-slate-900' : 'text-zinc-200'}`}>
                            ${mod.finalPrice?.toLocaleString('es-AR')} ARS
                          </div>
                          {mod.badge && (
                            <span className={`text-[9px] mt-0.5 truncate ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>{mod.badge}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Falla Solicitada por el Cliente */}
            <div>
              <label className={labelClass}>
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
                className={`w-full border rounded-xl p-2.5 text-xs outline-none focus:border-[#FF5500] ${inputBaseClass}`}
              />
            </div>

            {/* TARJETA DE COTIZACIÓN EN VIVO DEL PRESUPUESTADOR */}
            <div className={`rounded-xl border p-3 shadow-md space-y-2 transition-colors ${
              isLight
                ? 'bg-orange-50/70 border-orange-200 text-slate-800'
                : 'border-[#FF5500]/40 bg-gradient-to-br from-[#1C120B] via-zinc-950 to-zinc-950 text-zinc-200'
            }`}>
              <div className={`flex items-center justify-between border-b pb-1.5 ${isLight ? 'border-orange-200' : 'border-zinc-800/80'}`}>
                <div className="flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-[#FF5500]" />
                  <span className={`text-xs font-bold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Presupuestador Montec</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isLight ? 'bg-white border border-slate-300 text-slate-700' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                  }`}>
                    Dólar ${dolarRate || 1545}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsQuoteModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#FF5500] hover:text-[#FF6600] hover:underline cursor-pointer"
                  title="Abrir cotizador interactivo para el cliente"
                >
                  <span>Abrir Cotizador</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {liveEstimate ? (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-zinc-400">
                        Precio Sugerido ({liveEstimate.qualityLabel ? (liveEstimate.qualityLabel.length > 30 ? liveEstimate.qualityLabel.substring(0, 30) + '...' : liveEstimate.qualityLabel) : 'Calidad Premium'}):
                      </div>
                      <div className="text-xl font-black font-mono text-[#FF5500] flex items-center gap-1.5">
                        <span>
                          {liveEstimate.minPrice === liveEstimate.maxPrice 
                            ? `$${liveEstimate.minPrice.toLocaleString('es-AR')}`
                            : `$${liveEstimate.minPrice.toLocaleString('es-AR')} - $${liveEstimate.maxPrice.toLocaleString('es-AR')}`}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-normal">ARS</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyEstimatePrice(liveEstimate.minPrice)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs font-bold shadow-[0_0_10px_rgba(255,85,0,0.4)] transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <Zap className="w-3 h-3 fill-white" />
                      <span>Aplicar Precio</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400 border-t border-zinc-850 pt-1.5">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{liveEstimate.duration || 'De 2 a 3 horas'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>{liveEstimate.warranty || '30 días de garantía escrita'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 py-1">
                  <Info className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                  <span>
                    {formData.device.model && formData.device.model.trim().length >= 2 
                      ? 'Falla estándar sin precio de lista automático. Usa el cotizador completo o ingresa el presupuesto manual.' 
                      : 'Seleccioná o escribí el Modelo en la Columna 2 para cotizar automáticamente en vivo con repuestos reales.'}
                  </span>
                </div>
              )}
            </div>

            {/* BLOQUE DE REPUESTOS DISPONIBLES & ENLACES DIRECTOS A PROVEEDORES */}
            <div className={`rounded-xl border p-3 space-y-2.5 shadow-sm transition-colors ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800'
                : 'border-zinc-800/90 bg-zinc-950/90 text-zinc-200 shadow-md'
            }`}>
              <div className={`flex items-center justify-between border-b pb-1.5 ${isLight ? 'border-slate-200' : 'border-zinc-850'}`}>
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-500" />
                  <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                    Repuestos Disponibles ({matchingParts.length})
                  </span>
                </div>
                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                  {detectedCategory.label}
                </span>
              </div>

              {/* Repuestos encontrados en catálogo local con link de compra */}
              {matchingParts.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(showAllParts ? matchingParts : matchingParts.slice(0, 4)).map((part, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border flex items-center justify-between gap-2 text-xs transition-colors ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold font-mono ${
                            part.provider_key === 'cellstore' ? (isLight ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-blue-950 text-blue-300 border border-blue-800/60') :
                            part.provider_key === 'smartsupply' ? (isLight ? 'bg-orange-100 text-[#FF5500] border border-orange-200' : 'bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/40') :
                            part.provider_key === 'soulfix' ? (isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60') :
                            (isLight ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-purple-950 text-purple-300 border border-purple-800/60')
                          }`}>
                            {part.provider}
                          </span>
                          <span className={`text-[9px] font-semibold ${part.in_stock ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : (isLight ? 'text-slate-400' : 'text-zinc-500')}`}>
                            {part.in_stock ? '🟢 En Stock' : '⚪ Consultar'}
                          </span>
                        </div>
                        <div className={`text-[11px] font-medium truncate ${isLight ? 'text-slate-900' : 'text-zinc-200'}`} title={part.name}>
                          {part.name}
                        </div>
                        <div className={`text-[11px] font-bold font-mono ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                          Costo: ${(part.price_cash_ars || 0).toLocaleString('es-AR')} ARS
                        </div>
                      </div>

                      {part.url ? (
                        <a
                          href={part.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`shrink-0 px-2 py-1.5 rounded-lg border transition-all text-[11px] flex items-center gap-1 font-semibold cursor-pointer ${
                            isLight
                              ? 'bg-white hover:bg-[#FF5500] text-slate-700 hover:text-white border-slate-300 shadow-xs'
                              : 'bg-zinc-800 hover:bg-[#FF5500] text-zinc-200 hover:text-white border-zinc-700'
                          }`}
                          title="Abrir ficha del producto en proveedor"
                        >
                          <span>Ver</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className={`text-[10px] italic ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Sin link</span>
                      )}
                    </div>
                  ))}

                  {matchingParts.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setShowAllParts(!showAllParts)}
                      className={`w-full text-center text-[11px] py-1 cursor-pointer transition-colors ${
                        isLight ? 'text-slate-600 hover:text-[#FF5500]' : 'text-zinc-400 hover:text-[#FF5500]'
                      }`}
                    >
                      {showAllParts ? '▲ Mostrar menos repuestos' : `▼ Ver ${matchingParts.length - 4} repuestos más...`}
                    </button>
                  )}
                </div>
              ) : (
                <div className={`text-[11px] italic py-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                  {formData.device.model && formData.device.model.trim().length >= 2
                    ? 'No se encontraron repuestos catalogados exactos con este nombre. Podés buscarlo con los accesos directos abajo:'
                    : 'Escribe el modelo en la Columna 2 para ver repuestos disponibles y links directos.'}
                </div>
              )}

              {/* Enlaces de Búsqueda Rápida en Proveedores */}
              <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-zinc-850'}`}>
                <div className={`text-[10px] uppercase font-bold mb-1.5 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                  Buscar repuesto en tiendas de repuestos:
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {quickSupplierLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-2 py-1 rounded-lg border flex items-center justify-between text-[10px] font-semibold transition-colors group cursor-pointer ${
                        isLight
                          ? 'bg-slate-50 hover:bg-orange-50 border-slate-200 hover:border-orange-300 text-slate-700 hover:text-[#FF5500]'
                          : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{link.name}</span>
                      <ExternalLink className={`w-3 h-3 shrink-0 ml-1 transition-colors ${
                        isLight ? 'text-slate-400 group-hover:text-[#FF5500]' : 'text-zinc-500 group-hover:text-[#FF5500]'
                      }`} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Diagnóstico Previo de Entrada */}
            <div>
              <label className={labelClass}>
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
                className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] ${inputBaseClass}`}
              />
            </div>

            {/* Checklist Rápido de Entrada */}
            <div className={`p-2.5 rounded-xl border space-y-1.5 transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950/80 border-zinc-800/80'
            }`}>
              <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
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
                    <span className={`text-[11px] font-medium ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* COSTOS, SEÑA Y SALDO RESTANTE */}
            <div className={`p-3 rounded-xl border space-y-2 transition-colors ${
              isLight
                ? 'bg-white border-orange-200/80 shadow-xs'
                : 'bg-gradient-to-r from-zinc-950 via-[#1C120C] to-zinc-950 border-[#FF5500]/40 shadow-inner'
            }`}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`block text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                      Presupuesto Total ($)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCostModalOpen(true)}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                        isLight
                          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-300'
                          : 'text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border-amber-400/30'
                      }`}
                      title="Ver desglose de costo de repuesto proveedor vs mano de obra"
                    >
                      <Lightbulb className={`w-3 h-3 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                      <span>💡 Ver Cotización / Costos</span>
                    </button>
                  </div>
                  <input
                    type="number"
                    value={formData.service.budgetTotal}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      service: { ...prev.service, budgetTotal: e.target.value }
                    }))}
                    placeholder="0"
                    className={`w-full border rounded-xl px-3 py-1.5 text-sm font-mono font-bold outline-none focus:border-[#FF5500] ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
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
                    className={`w-full border rounded-xl px-3 py-1.5 text-sm font-mono font-bold outline-none ${
                      isLight
                        ? 'bg-slate-50 border-emerald-400 text-emerald-800 focus:border-emerald-600'
                        : 'bg-zinc-900 border-emerald-500/50 text-emerald-400 focus:border-emerald-400'
                    }`}
                  />
                </div>
              </div>

              {/* Saldo Calculado Automáticamente */}
              <div className={`pt-2 border-t flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-zinc-800/80'}`}>
                <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                  Saldo a Pagar al Retirar:
                </span>
                <span className="text-lg font-black font-mono text-[#FF5500]">
                  ${(formData.service.balanceDue || 0).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Garantía Escrita Acordada */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`text-[11px] font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Garantía Escrita Acordada:</span>
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  {['30 días', '60 días', '90 días', '180 días'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        service: { ...prev.service, warranty: `${d} de garantía escrita` }
                      }))}
                      className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        formData.service.warranty?.startsWith(d)
                          ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold')
                          : (isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800')
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={formData.service.warranty || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  service: { ...prev.service, warranty: e.target.value }
                }))}
                placeholder="ej: 90 días de garantía escrita..."
                className={`w-full border rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#FF5500] ${inputBaseClass}`}
              />
            </div>

            {/* Fecha y Hora de Entrega Pactada */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  Fecha y Hora de Entrega Estimada:
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  {['3', '24', '48'].map((hs) => (
                    <button
                      key={hs}
                      type="button"
                      onClick={() => setQuickDeliveryTime(Number(hs))}
                      className={`px-1.5 py-0.5 rounded border cursor-pointer transition-colors ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                      }`}
                    >
                      +{hs}hs
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="datetime-local"
                value={formData.service.estimatedDeliveryDate}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  service: { ...prev.service, estimatedDeliveryDate: e.target.value }
                }))}
                className={`w-full border rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#FF5500] font-mono ${inputBaseClass}`}
              />
            </div>

            {/* BOTÓN PRINCIPAL GENERAR ORDEN */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingOrder}
                className={`w-full py-3.5 bg-gradient-to-r from-[#FF5500] to-[#E64D00] hover:from-[#FF6600] hover:to-[#FF5500] text-white font-heading font-black rounded-xl text-sm shadow-[0_0_30px_rgba(255,85,0,0.5)] transition-all transform flex items-center justify-center gap-2 ${
                  isSubmittingOrder ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-98 cursor-pointer'
                }`}
              >
                {isSubmittingOrder ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>SINCRONIZANDO CON BASE DE DATOS...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 fill-white" />
                    <span>GENERAR ORDEN DE SERVICIO (F12)</span>
                  </>
                )}
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

      {/* SUB-MODAL 2: GESTOR INTEGRAL DE ÓRDENES Y TALLER (SISTROFIX STYLE) */}
      {activeSubModal === 'orders_list' && (
        <RepairOrdersManager
          onSelectOrder={(order) => {
            setActiveTicketOrder(order);
            setActiveSubModal('ticket_view');
          }}
          onNewOrder={() => setActiveSubModal(null)}
          onClose={() => setActiveSubModal(null)}
        />
      )}

      {/* SUB-MODAL 3: DESGLOSE DE COSTOS Y COTIZADOR POPUP */}
      <CostBreakdownModal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        device={formData.device}
        issue={COMMON_REPAIR_ISSUES.find(i => i.id === selectedIssueId)}
        liveEstimate={liveEstimate}
        matchingParts={matchingParts}
        dolarRate={dolarRate}
        onApplyPrice={(price) => handleApplyEstimatePrice(price)}
        onOpenFullQuoter={() => setIsQuoteModalOpen(true)}
      />

      {/* SUB-MODAL 4: AGREGAR NUEVO MODELO DE DISPOSITIVO */}
      {isNewModelModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`border rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#141416] border-zinc-700 text-zinc-100'
          }`}>
            <div className={`flex items-center justify-between pb-3 mb-4 border-b ${
              isLight ? 'border-slate-200' : 'border-zinc-800'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">Agregar Nuevo Modelo</h3>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Se guardará en el catálogo de Montec
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModelModalOpen(false)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewModelModal} className="space-y-3.5">
              {/* Marca */}
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Marca
                </label>
                <select
                  value={newModelData.brand}
                  onChange={(e) => setNewModelData(prev => ({ ...prev, brand: e.target.value }))}
                  className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] font-semibold ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
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

              {/* Si es Otra marca */}
              {newModelData.brand === 'Otra' && (
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Nombre de la Marca
                  </label>
                  <input
                    type="text"
                    required
                    value={newModelData.customBrand}
                    onChange={(e) => setNewModelData(prev => ({ ...prev, customBrand: e.target.value }))}
                    placeholder="ej: Huawei, Infinix, OnePlus, Sony..."
                    className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  />
                </div>
              )}

              {/* Nombre del Modelo */}
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Nombre Exacto del Modelo <span className="text-[#FF5500]">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newModelData.model}
                  onChange={(e) => setNewModelData(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="ej: iPhone 16 Pro, Galaxy S24 FE, Moto G84..."
                  className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>

              {/* Tipo y Año */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Tipo de Dispositivo
                  </label>
                  <select
                    value={newModelData.type}
                    onChange={(e) => setNewModelData(prev => ({ ...prev, type: e.target.value }))}
                    className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  >
                    <option value="Smartphone">Smartphone Android</option>
                    <option value="iPhone">iPhone / Apple</option>
                    <option value="Tablet">Tablet / iPad</option>
                    <option value="Notebook">Notebook / Laptop</option>
                    <option value="Smartwatch">Smartwatch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Año (aprox)
                  </label>
                  <input
                    type="number"
                    value={newModelData.year}
                    onChange={(e) => setNewModelData(prev => ({ ...prev, year: e.target.value }))}
                    className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] font-mono ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className={`flex items-center justify-end gap-2 pt-3 border-t ${
                isLight ? 'border-slate-200' : 'border-zinc-800'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsNewModelModalOpen(false)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white shadow-md shadow-[#FF5500]/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Guardar y Usar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN TOAST FLOTANTE */}
      {modelSuccessNotice && (
        <div className="fixed bottom-5 right-5 z-[80] bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce border border-emerald-400">
          <Check className="w-4 h-4" />
          <span>{modelSuccessNotice}</span>
        </div>
      )}

    </div>
  );
}
