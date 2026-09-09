import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Printer,
  FileText,
  User,
  Users,
  Phone,
  Mail,
  MapPin,
  HelpCircle,
  X,
  Check,
  CheckCircle2,
  DollarSign,
  Receipt,
  Percent,
  Tag,
  Store,
  Wallet,
  CreditCard,
  QrCode,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  Calendar,
  AlertCircle,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { useData } from '../../context/DataContext';

const DOCUMENT_DEFINITIONS = {
  PRESUPUESTO: {
    label: 'PRESUPUESTO',
    prefix: 'PRE',
    description: 'Los Presupuestos son documentos que se guardan en el sistema para dar fe de un precio en un determinado rango de días, no descuenta de inventario, tampoco afecta la cuenta de caja... (No descuenta productos al inventario)',
    affectsStock: false,
    affectsCash: false,
    badgeColor: 'bg-zinc-700/40 text-zinc-300 border-zinc-600'
  },
  FACTURA_B: {
    label: 'FACTURA B',
    prefix: '0001-B',
    description: 'Comprobante comercial emitido a Consumidores Finales o Exentos. Descuenta inventario y asienta el cobro en la Caja Diaria del local.',
    affectsStock: true,
    affectsCash: true,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  FACTURA_A: {
    label: 'FACTURA A',
    prefix: '0001-A',
    description: 'Comprobante con discriminación de IVA emitido a Responsables Inscriptos con CUIT. Descuenta inventario y asienta el ingreso en Caja Diaria.',
    affectsStock: true,
    affectsCash: true,
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  },
  FACTURA_C: {
    label: 'FACTURA C',
    prefix: '0001-C',
    description: 'Comprobante de venta y servicios emitido por Monotributo. Descuenta inventario y asienta el cobro en Caja Diaria.',
    affectsStock: true,
    affectsCash: true,
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  },
  REMITO: {
    label: 'REMITO DE ENTREGA',
    prefix: 'REM',
    description: 'Documento comercial de respaldo y constancia de mercadería entregada al cliente. Descuenta stock del inventario y respalda la entrega física.',
    affectsStock: true,
    affectsCash: true,
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  TICKET_X: {
    label: 'TICKET X (NO FISCAL)',
    prefix: 'TCK',
    description: 'Nota interna de venta y comprobante de mostrador para control rápido de caja. Descuenta stock y asienta en el arqueo diario.',
    affectsStock: true,
    affectsCash: true,
    badgeColor: 'bg-zinc-600/30 text-zinc-300 border-zinc-500'
  },
  RECIBO: {
    label: 'RECIBO OFICIAL',
    prefix: 'REC',
    description: 'Comprobante de cobranza, seña a cuenta de reparación o pago diferido. Asienta el ingreso monetario en la Caja Diaria.',
    affectsStock: false,
    affectsCash: true,
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
  }
};

const TAX_CONDITIONS = [
  'CONSUMIDOR FINAL',
  'RESPONSABLE INSCRIPTO',
  'MONOTRIBUTISTA',
  'EXENTO',
  'NO RESPONSABLE'
];

const PAYMENT_METHODS = [
  { id: 'Efectivo', label: 'Efectivo', icon: Wallet, color: 'text-emerald-400' },
  { id: 'Transferencia / Alias', label: 'Transferencia / Alias', icon: ArrowRight, color: 'text-sky-400' },
  { id: 'Tarjeta Débito/Crédito', label: 'Tarjeta Débito/Crédito', icon: CreditCard, color: 'text-purple-400' },
  { id: 'Mercado Pago QR', label: 'Mercado Pago QR', icon: QrCode, color: 'text-amber-400' }
];

export default function CommercialInvoicePOS({ onOpenDailyCash, onClose }) {
  const {
    inventory = [],
    sales = [],
    orders = [],
    recordSale,
    updateProductStock,
    searchClients,
    panelTheme
  } = useData();

  const isLight = panelTheme === 'light';

  // --- DATOS DEL CLIENTE ---
  const [docType, setDocType] = useState('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [clientName, setClientName] = useState('CONSUMIDOR FINAL');
  const [taxCondition, setTaxCondition] = useState('CONSUMIDOR FINAL');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientInternalNotes, setClientInternalNotes] = useState('');
  const [isClientNotesModalOpen, setIsClientNotesModalOpen] = useState(false);

  // Modal selector de clientes
  const [isSearchClientsModalOpen, setIsSearchClientsModalOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  // --- COMPROBANTE ---
  const [selectedDocType, setSelectedDocType] = useState('PRESUPUESTO');
  const [docNumberCustom, setDocNumberCustom] = useState('');
  const [optionPrint, setOptionPrint] = useState(true);
  const [optionSendEmail, setOptionSendEmail] = useState(true);

  // Numeración correlativa automática si no se ingresó una manual
  const currentDocNumber = useMemo(() => {
    if (docNumberCustom.trim()) return docNumberCustom.trim();
    const countType = sales.filter(s => {
      const typeStr = (s.documentType || '').toUpperCase();
      return typeStr === selectedDocType || typeStr.includes(selectedDocType);
    }).length;
    const num = (countType + 1).toString().padStart(8, '0');
    return `0001-${num}`;
  }, [sales, selectedDocType, docNumberCustom]);

  // --- PRODUCTOS Y SERVICIOS DEL COMPROBANTE ---
  const [skuInput, setSkuInput] = useState('');
  const [items, setItems] = useState([]); // [{ id, sku, name, color, quantity, price, ivaPercent, discountPercent }]
  const [isSearchProductsModalOpen, setIsSearchProductsModalOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // Modal para agregar ítem o servicio libre (mano de obra, reparación especial)
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [customItemForm, setCustomItemForm] = useState({
    sku: 'SERV-01',
    name: '',
    color: '',
    quantity: 1,
    price: '',
    ivaPercent: 21,
    discountPercent: 0
  });

  // --- DESCUENTOS GLOBALES ---
  const [discountsList, setDiscountsList] = useState([]); // [{ id, name, percent }]
  const [isAddDiscountModalOpen, setIsAddDiscountModalOpen] = useState(false);
  const [newDiscountName, setNewDiscountName] = useState('Descuento Comercial');
  const [newDiscountPercent, setNewDiscountPercent] = useState(10);

  // --- NOTAS DEL COMPROBANTE ---
  const [voucherNotes, setVoucherNotes] = useState('');

  // --- MEDIO DE PAGO & ADELANTOS ---
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [advancePayment, setAdvancePayment] = useState(0); // Adelantos / señas

  // --- MODAL POST-EMISIÓN Y VISTA PREVIA ---
  const [emittedVoucher, setEmittedVoucher] = useState(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Referencias para atajos
  const skuInputRef = useRef(null);
  const docNumberInputRef = useRef(null);

  // ATAJOS DE TECLADO GLOBALES
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) && e.key !== 'F1' && e.key !== 'F9' && e.key !== 'F10' && e.key !== 'F11' && e.key !== 'F12' && e.key !== 'Escape') {
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        setIsHelpModalOpen(true);
      } else if (e.key === 'F9') {
        e.preventDefault();
        setIsSearchProductsModalOpen(true);
      } else if (e.key === 'F10') {
        e.preventDefault();
        handleEmitVoucher();
      } else if (e.key === 'F11') {
        e.preventDefault();
        docNumberInputRef.current?.focus();
      } else if (e.key === 'F12') {
        e.preventDefault();
        skuInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (isSearchProductsModalOpen) setIsSearchProductsModalOpen(false);
        else if (isSearchClientsModalOpen) setIsSearchClientsModalOpen(false);
        else if (isCustomItemModalOpen) setIsCustomItemModalOpen(false);
        else if (isAddDiscountModalOpen) setIsAddDiscountModalOpen(false);
        else if (isClientNotesModalOpen) setIsClientNotesModalOpen(false);
        else if (isHelpModalOpen) setIsHelpModalOpen(false);
        else if (emittedVoucher) setEmittedVoucher(null);
        else if (onClose) onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedDocType, advancePayment, paymentMethod, isSearchProductsModalOpen, isSearchClientsModalOpen, isCustomItemModalOpen, isAddDiscountModalOpen, isClientNotesModalOpen, isHelpModalOpen, emittedVoucher]);

  // Autocompletar cliente por DNI/CUIT si coincide con alguno existente
  const handleDocNumberBlur = () => {
    if (!docNumber.trim()) return;
    const cleanDoc = docNumber.trim().toLowerCase();
    
    // Buscar en órdenes previas
    const foundOrder = orders.find(o => {
      const c = o.customer || {};
      return (c.docNumber && c.docNumber.trim().toLowerCase() === cleanDoc) ||
             (c.phone && c.phone.trim().toLowerCase() === cleanDoc);
    });

    if (foundOrder && foundOrder.customer) {
      const c = foundOrder.customer;
      if (c.name) setClientName(c.name.toUpperCase());
      if (c.phone) setClientPhone(c.phone);
      if (c.email) setClientEmail(c.email);
      if (c.address) setClientAddress(c.address);
      if (c.taxCondition) setTaxCondition(c.taxCondition);
      if (c.notes) setClientInternalNotes(c.notes);
    }
  };

  // Buscar cliente manualmente
  const selectClient = (client) => {
    if (!client) return;
    if (client.docType) setDocType(client.docType);
    if (client.docNumber) setDocNumber(client.docNumber);
    if (client.name) setClientName(client.name.toUpperCase());
    if (client.taxCondition) setTaxCondition(client.taxCondition);
    if (client.email) setClientEmail(client.email);
    if (client.phone) setClientPhone(client.phone);
    if (client.address) setClientAddress(client.address);
    if (client.notes) setClientInternalNotes(client.notes);
    setIsSearchClientsModalOpen(false);
  };

  // Agregar ítem desde inventario por SKU
  const handleAddBySku = (e) => {
    if (e) e.preventDefault();
    if (!skuInput.trim()) return;

    const term = skuInput.trim().toLowerCase();
    const product = inventory.find(p => 
      (p.sku && p.sku.toLowerCase() === term) ||
      (p.barcode && p.barcode.toLowerCase() === term) ||
      (p.name && p.name.toLowerCase() === term)
    );

    if (product) {
      addItemToTable(product);
      setSkuInput('');
    } else {
      // Si no existe en inventario, abrir el modal de nuevo producto o servicio personalizado con el código ingresado
      setCustomItemForm(prev => ({
        ...prev,
        sku: skuInput.toUpperCase().trim(),
        name: ''
      }));
      setIsCustomItemModalOpen(true);
      setSkuInput('');
    }
  };

  const addItemToTable = (product) => {
    const existingIndex = items.findIndex(i => i.sku === product.sku || (product.id && i.productId === product.id));
    if (existingIndex >= 0) {
      // Incrementar cantidad
      setItems(prev => prev.map((item, idx) => {
        if (idx !== existingIndex) return item;
        return {
          ...item,
          quantity: item.quantity + 1
        };
      }));
    } else {
      setItems(prev => [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          productId: product.id,
          sku: product.sku || `PROD-${Date.now().toString().slice(-4)}`,
          name: product.name || 'Producto / Servicio',
          color: product.color || product.variant || '-',
          quantity: 1,
          price: Number(product.price || 0),
          ivaPercent: product.ivaPercent !== undefined ? Number(product.ivaPercent) : 21,
          discountPercent: 0
        }
      ]);
    }
  };

  // Agregar ítem personalizado
  const handleAddCustomItemSubmit = (e) => {
    e.preventDefault();
    if (!customItemForm.name.trim() || Number(customItemForm.price) <= 0) return;

    setItems(prev => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        sku: (customItemForm.sku || 'SERV-01').toUpperCase().trim(),
        name: customItemForm.name.trim(),
        color: customItemForm.color.trim() || '-',
        quantity: Math.max(1, Number(customItemForm.quantity) || 1),
        price: Number(customItemForm.price),
        ivaPercent: Number(customItemForm.ivaPercent) || 0,
        discountPercent: Number(customItemForm.discountPercent) || 0
      }
    ]);

    setIsCustomItemModalOpen(false);
    setCustomItemForm({
      sku: 'SERV-01',
      name: '',
      color: '',
      quantity: 1,
      price: '',
      ivaPercent: 21,
      discountPercent: 0
    });
  };

  // Modificar cantidad o precio en la tabla
  const updateItemRow = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        [field]: field === 'name' || field === 'color' || field === 'sku' ? value : Math.max(0, Number(value) || 0)
      };
    }));
  };

  // Eliminar fila
  const removeItemRow = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Agregar descuento global
  const handleAddDiscountSubmit = (e) => {
    e.preventDefault();
    const pct = Number(newDiscountPercent) || 0;
    if (pct <= 0) return;

    setDiscountsList(prev => [
      ...prev,
      {
        id: `desc-${Date.now()}`,
        name: newDiscountName.trim() || 'Descuento',
        percent: pct
      }
    ]);

    setIsAddDiscountModalOpen(false);
    setNewDiscountName('Descuento Especial');
    setNewDiscountPercent(10);
  };

  const removeDiscount = (id) => {
    setDiscountsList(prev => prev.filter(d => d.id !== id));
  };

  // --- CÁLCULOS LIQUIDACIÓN & TOTALES ---
  const calculations = useMemo(() => {
    let bruto = 0;
    let totalIva = 0;
    let itemDiscountsTotal = 0;

    items.forEach(item => {
      const lineBruto = item.quantity * item.price;
      const lineDiscount = lineBruto * (item.discountPercent / 100);
      const lineAfterDisc = lineBruto - lineDiscount;
      const lineIva = lineAfterDisc * (item.ivaPercent / 100);

      bruto += lineBruto;
      itemDiscountsTotal += lineDiscount;
      totalIva += lineIva;
    });

    const subtotalAfterItemDiscounts = bruto - itemDiscountsTotal;

    // Descuentos globales
    let globalDiscountsPercent = 0;
    discountsList.forEach(d => {
      globalDiscountsPercent += Number(d.percent) || 0;
    });

    const globalDiscountsAmount = subtotalAfterItemDiscounts * (globalDiscountsPercent / 100);
    const totalDiscounts = itemDiscountsTotal + globalDiscountsAmount;
    
    // Importe Neto (Base imponible)
    const neto = Math.max(0, bruto - totalDiscounts);

    // Ajuste de IVA según condición si es Factura A vs Factura B / Presupuesto
    const finalIva = (selectedDocType === 'FACTURA_A') ? (neto * 0.21) : 0;

    // Total final
    const totalConIva = Math.round(neto + finalIva);
    const saldoPendiente = Math.max(0, totalConIva - advancePayment);

    return {
      bruto,
      itemDiscountsTotal,
      globalDiscountsAmount,
      totalDiscounts,
      neto,
      iva: finalIva,
      total: totalConIva,
      saldo: saldoPendiente
    };
  }, [items, discountsList, selectedDocType, advancePayment]);

  // --- EMITIR COMPROBANTE / FACTURAR ---
  const handleEmitVoucher = () => {
    if (items.length === 0) {
      alert('⚠️ No hay productos o servicios cargados en el comprobante.');
      return;
    }

    const docDef = DOCUMENT_DEFINITIONS[selectedDocType] || DOCUMENT_DEFINITIONS.PRESUPUESTO;
    const documentTypeKey = selectedDocType.toLowerCase();

    // 1. Descontar inventario si el comprobante afecta stock
    if (docDef.affectsStock) {
      items.forEach(item => {
        if (item.productId || item.sku) {
          updateProductStock(item.productId || item.sku, -item.quantity, true);
        }
      });
    }

    // 2. Registrar venta en el sistema (Caja Diaria / PostgreSQL)
    const newSale = {
      id: `sale-${Date.now()}`,
      documentType: documentTypeKey,
      documentNumber: currentDocNumber,
      ticketNumber: `#${currentDocNumber}`,
      createdAt: new Date().toISOString(),
      formattedDate: new Date().toLocaleString('es-AR'),
      items: items.map(i => ({
        id: i.id,
        sku: i.sku,
        name: i.name,
        color: i.color,
        quantity: i.quantity,
        price: i.price,
        ivaPercent: i.ivaPercent,
        discountPercent: i.discountPercent,
        subtotal: i.quantity * i.price
      })),
      subtotal: calculations.neto,
      discountAmount: calculations.totalDiscounts,
      total: calculations.total,
      advancePayment: advancePayment,
      balanceDue: calculations.saldo,
      paymentMethod: paymentMethod,
      customer: {
        name: clientName,
        docType: docType,
        docNumber: docNumber,
        taxCondition: taxCondition,
        email: clientEmail,
        phone: clientPhone,
        address: clientAddress,
        notes: clientInternalNotes
      },
      discounts: discountsList,
      notes: voucherNotes,
      seller: 'Operador Mostrador Montec',
      isBudget: !docDef.affectsCash
    };

    if (typeof recordSale === 'function') {
      recordSale(newSale);
    }

    // Mostrar modal de confirmación / impresión
    setEmittedVoucher(newSale);

    // Si la opción de imprimir estaba marcada y es navegador
    if (optionPrint) {
      setTimeout(() => {
        window.print();
      }, 600);
    }
  };

  // Limpiar comprobante para uno nuevo
  const resetForm = () => {
    setItems([]);
    setDiscountsList([]);
    setAdvancePayment(0);
    setVoucherNotes('');
    setDocNumberCustom('');
    setDocNumber('');
    setClientName('CONSUMIDOR FINAL');
    setTaxCondition('CONSUMIDOR FINAL');
    setClientEmail('');
    setClientPhone('');
    setClientAddress('');
    setClientInternalNotes('');
    setEmittedVoucher(null);
  };

  return (
    <div className={`flex flex-col min-h-full rounded-2xl border transition-all ${
      isLight ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-[#0f0f14] border-zinc-800/90 text-zinc-100'
    }`}>
      
      {/* 1. ENCABEZADO: TÍTULO DEL MÓDULO & BOTÓN AYUDA */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-800/70 bg-[#121218]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>Facturación & Punto de Venta</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Operativo
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Emisión de Facturas (A/B/C), Remitos, Presupuestos y Cobranzas comerciales de mostrador
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenDailyCash && (
            <button
              type="button"
              onClick={onOpenDailyCash}
              className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Caja Diaria</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsHelpModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            title="Ver atajos de teclado y ayuda"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>[F1] Ayuda</span>
          </button>
        </div>
      </div>

      {/* 2. ÁREA PRINCIPAL: BLOQUE CLIENTE + BLOQUE COMPROBANTE */}
      <div className="p-4 sm:p-5 space-y-4">
        
        {/* FILA SUPERIOR: CLIENTE (IZQUIERDA) & COMPROBANTE (DERECHA) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* BLOQUE CLIENTE (7 cols) */}
          <div className={`lg:col-span-7 p-4 rounded-xl border flex flex-col justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#15151c] border-zinc-800/80'
          }`}>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800/60">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF5500] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Datos del Cliente</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSearchClientsModalOpen(true)}
                  className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 border border-zinc-700 cursor-pointer transition-colors"
                >
                  <Search className="w-3 h-3 text-[#FF5500]" />
                  <span>Buscar Clientes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsClientNotesModalOpen(true)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors flex items-center gap-1 ${
                    clientInternalNotes.trim()
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span>Notas internas ({clientInternalNotes.trim() ? 1 : 0})</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
              
              {/* CUIT / DNI / ID */}
              <div className="sm:col-span-5 flex items-center gap-1">
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className={`w-24 px-2 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                  }`}
                >
                  <option value="DNI">DNI</option>
                  <option value="CUIT">CUIT</option>
                  <option value="CUIL">CUIL</option>
                  <option value="ID">PAS / ID</option>
                </select>

                <div className="relative flex-1">
                  <input
                    ref={docNumberInputRef}
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    onBlur={handleDocNumberBlur}
                    placeholder="Número [F11]..."
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono outline-none focus:border-[#FF5500] ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleDocNumberBlur}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    title="Buscar por documento"
                  >
                    <Search className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Razón Social / Nombre */}
              <div className="sm:col-span-7">
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Razón Social o Nombre del Cliente..."
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold outline-none focus:border-[#FF5500] ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'
                  }`}
                />
              </div>

              {/* Respo. Ant. IVA */}
              <div className="sm:col-span-6">
                <select
                  value={taxCondition}
                  onChange={(e) => setTaxCondition(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold outline-none cursor-pointer ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                  }`}
                >
                  {TAX_CONDITIONS.map(cond => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div className="sm:col-span-6">
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="Email para comprobante..."
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:border-[#FF5500] ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'
                  }`}
                />
              </div>

              {/* Teléfono WhatsApp */}
              <div className="sm:col-span-6 flex items-center gap-1">
                <span className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-[11px] font-mono text-zinc-400">
                  🇦🇷 +54
                </span>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="WhatsApp cliente..."
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono outline-none focus:border-[#FF5500] ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'
                  }`}
                />
                {clientPhone && (
                  <button
                    type="button"
                    onClick={() => setClientPhone('')}
                    className="p-1 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Dirección */}
              <div className="sm:col-span-6">
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Dirección / Localidad..."
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:border-[#FF5500] ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'
                  }`}
                />
              </div>

            </div>
          </div>

          {/* BLOQUE COMPROBANTE (5 cols) */}
          <div className={`lg:col-span-5 p-4 rounded-xl border flex flex-col justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#15151c] border-zinc-800/80'
          }`}>
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800/60">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Comprobante Comercial</span>
                </span>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  DOCUMENT_DEFINITIONS[selectedDocType]?.badgeColor
                }`}>
                  {DOCUMENT_DEFINITIONS[selectedDocType]?.label}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 block mb-1">
                    Tipo de Documento:
                  </label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  >
                    <option value="PRESUPUESTO">PRESUPUESTO</option>
                    <option value="FACTURA_B">FACTURA B</option>
                    <option value="FACTURA_A">FACTURA A</option>
                    <option value="FACTURA_C">FACTURA C</option>
                    <option value="REMITO">REMITO DE ENTREGA</option>
                    <option value="TICKET_X">TICKET X (NO FISCAL)</option>
                    <option value="RECIBO">RECIBO OFICIAL</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 block mb-1">
                    Sig. Nro. Comp.:
                  </label>
                  <input
                    type="text"
                    value={docNumberCustom}
                    onChange={(e) => setDocNumberCustom(e.target.value)}
                    placeholder={currentDocNumber}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold outline-none focus:border-[#FF5500] ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'
                    }`}
                  />
                </div>
              </div>

              {/* Opciones adicionales */}
              <div className="flex items-center gap-4 text-xs text-zinc-300 mb-2">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={optionPrint}
                    onChange={(e) => setOptionPrint(e.target.checked)}
                    className="accent-[#FF5500] w-3.5 h-3.5 rounded"
                  />
                  <span>Imprimir comprobante</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={optionSendEmail}
                    onChange={(e) => setOptionSendEmail(e.target.checked)}
                    className="accent-[#FF5500] w-3.5 h-3.5 rounded"
                  />
                  <span>Enviar por WhatsApp / Email</span>
                </label>
              </div>
            </div>

            {/* Cuadro de descripción explicativa idéntica al sistema de referencia */}
            <div className={`p-2.5 rounded-lg text-[11px] leading-relaxed border ${
              isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-zinc-900/90 border-zinc-800 text-zinc-400'
            }`}>
              <strong className="text-zinc-200 block mb-0.5">Descripción del comprobante:</strong>
              {DOCUMENT_DEFINITIONS[selectedDocType]?.description}
            </div>

          </div>

        </div>

        {/* 3. BLOQUE AGREGAR PRODUCTO O SERVICIO & TABLA DE ITEMS */}
        <div className={`p-4 rounded-xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#15151c] border-zinc-800/80'
        }`}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-zinc-800/60">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              <span>Agregar nuevo producto o servicio</span>
            </span>

            {/* Input SKU + Botón Buscar Productos */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-80">
                <input
                  ref={skuInputRef}
                  type="text"
                  value={skuInput}
                  onChange={(e) => setSkuInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddBySku(e)}
                  placeholder="[F12] Ingrese SKU, código o nombre..."
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono outline-none focus:border-[#FF5500] ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={() => setIsSearchProductsModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
                <span>[F9] Buscar Productos</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCustomItemModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Servicio / Ítem Libre</span>
              </button>
            </div>
          </div>

          {/* TABLA DE ÍTEMS DEL COMPROBANTE */}
          <div className="overflow-x-auto rounded-lg border border-zinc-800/80 bg-zinc-950/60 max-h-64 scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-900 text-zinc-400 font-mono text-[11px] uppercase tracking-wider border-b border-zinc-800 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 min-w-[90px]">SKU</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Nombre / Concepto</th>
                  <th className="py-2.5 px-3 min-w-[100px]">Color / Detalle</th>
                  <th className="py-2.5 px-3 min-w-[70px] text-center">Cant</th>
                  <th className="py-2.5 px-3 min-w-[110px] text-right">Precio</th>
                  <th className="py-2.5 px-3 min-w-[80px] text-center">IVA %</th>
                  <th className="py-2.5 px-3 min-w-[110px] text-right">Importe</th>
                  <th className="py-2.5 px-3 min-w-[80px] text-center">% Bonif.</th>
                  <th className="py-2.5 px-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-zinc-500 italic">
                      No hay productos ni servicios agregados al comprobante.
                      <br />
                      <span className="text-[11px] text-zinc-600">
                        Presioná <strong>[F12]</strong> para ingresar un código o <strong>[F9]</strong> para buscar en el inventario.
                      </span>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const lineBruto = item.quantity * item.price;
                    const lineDiscount = lineBruto * (item.discountPercent / 100);
                    const lineTotal = lineBruto - lineDiscount;

                    return (
                      <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-2 px-3 font-mono font-semibold text-zinc-300">
                          {item.sku}
                        </td>
                        <td className="py-2 px-3 font-semibold text-white">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItemRow(item.id, 'name', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-[#FF5500] outline-none text-xs font-semibold text-white"
                          />
                        </td>
                        <td className="py-2 px-3 text-zinc-400">
                          <input
                            type="text"
                            value={item.color}
                            onChange={(e) => updateItemRow(item.id, 'color', e.target.value)}
                            placeholder="-"
                            className="w-full bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-[#FF5500] outline-none text-xs text-zinc-300"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemRow(item.id, 'quantity', e.target.value)}
                            className="w-14 text-center px-1 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-white outline-none focus:border-[#FF5500]"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) => updateItemRow(item.id, 'price', e.target.value)}
                            className="w-24 text-right px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-emerald-400 outline-none focus:border-[#FF5500]"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <select
                            value={item.ivaPercent}
                            onChange={(e) => updateItemRow(item.id, 'ivaPercent', e.target.value)}
                            className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[11px] font-mono text-zinc-300 outline-none cursor-pointer"
                          >
                            <option value="21">21%</option>
                            <option value="10.5">10.5%</option>
                            <option value="0">0%</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-white">
                          ${Math.round(lineTotal).toLocaleString('es-AR')}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent}
                            onChange={(e) => updateItemRow(item.id, 'discountPercent', e.target.value)}
                            className="w-12 text-center px-1 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-mono text-amber-300 outline-none focus:border-[#FF5500]"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItemRow(item.id)}
                            className="p-1 rounded-md text-rose-400 hover:text-white hover:bg-rose-600/80 transition-colors cursor-pointer"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. PARTE INFERIOR: DESCUENTOS + NOTAS + LIQUIDACIÓN + BOTONES LATERALES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* IZQUIERDA: DESCUENTOS & NOTAS (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Descuentos */}
            <div className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#15151c] border-zinc-800/80'
            }`}>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/60">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5" />
                  <span>Descuentos Globales</span>
                </span>

                <button
                  type="button"
                  onClick={() => setIsAddDiscountModalOpen(true)}
                  className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold flex items-center gap-1 border border-zinc-700 cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-amber-400" />
                  <span>Agregar Descuento</span>
                </button>
              </div>

              {discountsList.length === 0 ? (
                <p className="text-[11px] text-zinc-500 italic py-1">Sin descuentos globales aplicados.</p>
              ) : (
                <div className="space-y-1.5">
                  {discountsList.map(d => (
                    <div key={d.id} className="flex items-center justify-between py-1 px-2.5 rounded bg-zinc-900 border border-zinc-800 text-xs">
                      <span className="font-semibold text-zinc-300">{d.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">-{d.percent}%</span>
                        <button
                          type="button"
                          onClick={() => removeDiscount(d.id)}
                          className="text-zinc-500 hover:text-rose-400 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notas del Comprobante */}
            <div className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#15151c] border-zinc-800/80'
            }`}>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1.5">
                Notas del Comprobante:
              </span>
              <textarea
                value={voucherNotes}
                onChange={(e) => setVoucherNotes(e.target.value)}
                rows={2}
                placeholder="Aclaraciones comerciales, garantías escritas, condiciones de entrega..."
                className={`w-full p-2 rounded-lg border text-xs outline-none focus:border-[#FF5500] resize-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                }`}
              />
            </div>

          </div>

          {/* CENTRO: RESUMEN MONETARIO / LIQUIDACIÓN (4 cols) */}
          <div className={`lg:col-span-4 p-4 rounded-xl border flex flex-col justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#15151c] border-zinc-800/80'
          }`}>
            <div className="space-y-2.5 text-xs">
              
              {/* Medio de Pago */}
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                  Medio de Cobro:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === m.id
                          ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-sm'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      <m.icon className="w-3.5 h-3.5" />
                      <span className="truncate">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Adelantos / Señas */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-zinc-400 font-semibold">Adelantos / Seña:</span>
                <input
                  type="number"
                  min="0"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(Math.max(0, Number(e.target.value) || 0))}
                  className="w-28 text-right px-2 py-1 rounded bg-zinc-900 border border-zinc-700 font-mono font-bold text-emerald-400 text-xs outline-none focus:border-[#FF5500]"
                />
              </div>

              {/* Importe Neto */}
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-semibold">Importe NETO:</span>
                <span className="font-mono font-bold text-white">
                  ${calculations.neto.toLocaleString('es-AR')}
                </span>
              </div>

              {/* IVA / Impuestos */}
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-semibold">IVA / Impuestos:</span>
                <span className="font-mono font-bold text-zinc-300">
                  ${calculations.iva.toLocaleString('es-AR')}
                </span>
              </div>

              {/* Total Descuentos */}
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-semibold">Total Descuentos:</span>
                <span className="font-mono font-bold text-amber-400">
                  -${calculations.totalDiscounts.toLocaleString('es-AR')}
                </span>
              </div>

            </div>

            {/* TOTAL DESTACADO (Display verde idéntico a la captura) */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Total (NETO + IVA):
              </span>
              <div className="px-4 py-3 rounded-xl bg-emerald-950/40 border-2 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)] text-right">
                <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 tracking-tight">
                  ${calculations.total.toLocaleString('es-AR')}
                </div>
                {advancePayment > 0 && (
                  <div className="text-[11px] font-mono font-bold text-amber-400 mt-0.5">
                    Saldo al retirar: ${calculations.saldo.toLocaleString('es-AR')}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* DERECHA: BOTONES DE ACCIÓN RÁPIDA ESTILO SISTROFIX (3 cols) */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-2">
            
            {/* BOTÓN GIGANTE: FACTURAR [F10] */}
            <button
              type="button"
              onClick={handleEmitVoucher}
              className="w-full py-4 px-3 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-base sm:text-lg flex flex-col items-center justify-center shadow-lg shadow-blue-900/40 border border-blue-400/30 cursor-pointer active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <span>Facturar [F10]</span>
              </div>
              <span className="text-[10px] font-normal text-blue-200 mt-0.5">
                Emitir {DOCUMENT_DEFINITIONS[selectedDocType]?.label}
              </span>
            </button>

            {/* Botones secundarios */}
            <div className="flex flex-col gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setIsSearchClientsModalOpen(true)}
                className="w-full py-2 px-3 rounded-lg bg-teal-800 hover:bg-teal-700 text-white border border-teal-600/40 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Buscar Clientes</span>
              </button>

              <button
                type="button"
                onClick={onOpenDailyCash}
                className="w-full py-2 px-3 rounded-lg bg-teal-900/80 hover:bg-teal-800 text-teal-100 border border-teal-700/50 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Buscar Comprobantes</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedDocType('PRESUPUESTO');
                  alert('💡 Modo Presupuesto activo: podés presupuestar y no afectará stock ni caja.');
                }}
                className="w-full py-2 px-3 rounded-lg bg-sky-900/80 hover:bg-sky-800 text-sky-100 border border-sky-700/50 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Crear Presupuesto</span>
              </button>

              {onOpenDailyCash && (
                <button
                  type="button"
                  onClick={onOpenDailyCash}
                  className="w-full py-2 px-3 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-700/50 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Cerrar Punto Venta / Caja</span>
                </button>
              )}

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black border border-rose-500 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md mt-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Salir [Esc]</span>
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* ================================================================= */}
      {/* MODAL 1: BUSCADOR DE PRODUCTOS DEL INVENTARIO                     */}
      {/* ================================================================= */}
      {isSearchProductsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-zinc-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#161620]">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#FF5500]" />
                <h3 className="text-sm font-bold text-white">Catálogo de Productos & Repuestos [F9]</h3>
              </div>
              <button onClick={() => setIsSearchProductsModalOpen(false)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-zinc-800">
              <input
                type="text"
                autoFocus
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                placeholder="Escribí para buscar por nombre, SKU, modelo o categoría..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white outline-none focus:border-[#FF5500]"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2 divide-y divide-zinc-800/60">
              {inventory
                .filter(p => {
                  if (!productSearchTerm.trim()) return true;
                  const q = productSearchTerm.toLowerCase();
                  return (p.name || '').toLowerCase().includes(q) ||
                         (p.sku || '').toLowerCase().includes(q) ||
                         (p.category || '').toLowerCase().includes(q);
                })
                .slice(0, 30)
                .map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      addItemToTable(prod);
                      setIsSearchProductsModalOpen(false);
                    }}
                    className="p-3 flex items-center justify-between hover:bg-zinc-800/60 rounded-xl cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{prod.name}</span>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5">
                        <span className="text-[#FF5500]">SKU: {prod.sku}</span>
                        <span>•</span>
                        <span>Stock: {prod.stock || 0}</span>
                        <span>•</span>
                        <span>{prod.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-emerald-400 block">
                        ${Number(prod.price || 0).toLocaleString('es-AR')}
                      </span>
                      <span className="text-[10px] text-zinc-400">Clic para agregar</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: BUSCADOR DE CLIENTES                                     */}
      {/* ================================================================= */}
      {isSearchClientsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-zinc-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#161620]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Buscar Clientes Guardados</h3>
              </div>
              <button onClick={() => setIsSearchClientsModalOpen(false)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-zinc-800">
              <input
                type="text"
                autoFocus
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, CUIT, DNI o teléfono..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white outline-none focus:border-[#FF5500]"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2 divide-y divide-zinc-800/60">
              {searchClients(clientSearchQuery).map((c, idx) => (
                <div
                  key={idx}
                  onClick={() => selectClient(c)}
                  className="p-3 flex items-center justify-between hover:bg-zinc-800/60 rounded-xl cursor-pointer transition-colors"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{c.name}</span>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5">
                      <span>Doc: {c.docNumber || 'S/D'}</span>
                      <span>•</span>
                      <span>Tel: {c.phone || 'S/T'}</span>
                      <span>•</span>
                      <span className="text-teal-400">{c.taxCondition || 'Consumidor Final'}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#FF5500]">Seleccionar</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: ÍTEM PERSONALIZADO / SERVICIO TÉCNICO LIBRE              */}
      {/* ================================================================= */}
      {isCustomItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-zinc-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#FF5500]" />
                <span>Agregar Servicio o Ítem Manual</span>
              </h3>
              <button onClick={() => setIsCustomItemModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomItemSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">SKU / Código:</label>
                <input
                  type="text"
                  value={customItemForm.sku}
                  onChange={(e) => setCustomItemForm(p => ({ ...p, sku: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-white outline-none focus:border-[#FF5500]"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Concepto / Nombre del Servicio o Producto:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={customItemForm.name}
                  onChange={(e) => setCustomItemForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Cambio de Módulo, Mano de obra, etc."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-semibold text-white outline-none focus:border-[#FF5500]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1">Cantidad:</label>
                  <input
                    type="number"
                    min="1"
                    value={customItemForm.quantity}
                    onChange={(e) => setCustomItemForm(p => ({ ...p, quantity: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-white outline-none focus:border-[#FF5500]"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Precio Unitario ($):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={customItemForm.price}
                    onChange={(e) => setCustomItemForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-emerald-400 outline-none focus:border-[#FF5500]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1">Alícuota IVA:</label>
                  <select
                    value={customItemForm.ivaPercent}
                    onChange={(e) => setCustomItemForm(p => ({ ...p, ivaPercent: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white outline-none"
                  >
                    <option value="21">21%</option>
                    <option value="10.5">10.5%</option>
                    <option value="0">0% (Exento)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">% Bonif. / Desc.:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customItemForm.discountPercent}
                    onChange={(e) => setCustomItemForm(p => ({ ...p, discountPercent: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-amber-300 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs font-bold"
                >
                  Agregar a Comprobante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 4: AGREGAR DESCUENTO GLOBAL                                 */}
      {/* ================================================================= */}
      {isAddDiscountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-zinc-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-400" />
                <span>Agregar Descuento Global</span>
              </h3>
              <button onClick={() => setIsAddDiscountModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDiscountSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Concepto del Descuento:</label>
                <input
                  type="text"
                  required
                  value={newDiscountName}
                  onChange={(e) => setNewDiscountName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-semibold text-white outline-none focus:border-[#FF5500]"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Porcentaje de Descuento (%):</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={newDiscountPercent}
                  onChange={(e) => setNewDiscountPercent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-amber-400 outline-none focus:border-[#FF5500]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDiscountModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold text-xs"
                >
                  Aplicar Descuento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 5: NOTAS INTERNAS DEL CLIENTE                               */}
      {/* ================================================================= */}
      {isClientNotesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-zinc-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#FF5500]" />
                <span>Notas Internas del Cliente</span>
              </h3>
              <button onClick={() => setIsClientNotesModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-zinc-400 text-[11px]">
                Estas notas son de uso interno del mostrador y taller (preferencias, cuenta corriente, historial):
              </p>
              <textarea
                value={clientInternalNotes}
                onChange={(e) => setClientInternalNotes(e.target.value)}
                rows={4}
                placeholder="Escribí notas del cliente aquí..."
                className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 outline-none focus:border-[#FF5500] resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsClientNotesModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white font-bold text-xs"
                >
                  Guardar Notas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 6: AYUDA Y ATAJOS DE TECLADO [F1]                            */}
      {/* ================================================================= */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-zinc-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#FF5500]" />
                <span>Atajos Rápidos de Teclado</span>
              </h3>
              <button onClick={() => setIsHelpModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60 font-mono">
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-bold">[F1]</span>
                <span className="font-sans text-zinc-400">Ver esta ayuda</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60 font-mono">
                <span className="px-2 py-0.5 rounded bg-sky-900/60 text-sky-300 font-bold border border-sky-700/50">[F9]</span>
                <span className="font-sans text-zinc-400">Buscar productos en inventario</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60 font-mono">
                <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold border border-blue-700/50">[F10]</span>
                <span className="font-sans text-zinc-400">Facturar y emitir comprobante</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60 font-mono">
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-bold">[F11]</span>
                <span className="font-sans text-zinc-400">Enfocar CUIT/DNI del cliente</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60 font-mono">
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-bold">[F12]</span>
                <span className="font-sans text-zinc-400">Enfocar SKU / Código de barras</span>
              </div>
              <div className="flex items-center justify-between py-1.5 font-mono">
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-bold">[Esc]</span>
                <span className="font-sans text-zinc-400">Cerrar modal o salir</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 7: COMPROBANTE EMITIDO / IMPRESIÓN Y NOTIFICACIÓN WHATSAPP  */}
      {/* ================================================================= */}
      {emittedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-emerald-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header modal */}
            <div className="p-4 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    ¡Comprobante Emitido Exitosamente!
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-300">
                    {emittedVoucher.documentNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setEmittedVoucher(null);
                  resetForm();
                }}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vista física del ticket/comprobante */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 font-mono text-xs text-zinc-300 bg-black/40">
              <div className="text-center pb-3 border-b border-zinc-800">
                <h2 className="text-base font-black text-white font-sans">MONTEC</h2>
                <p className="text-[11px] text-zinc-400">Servicio Técnico Especializado</p>
                <p className="text-[10px] text-zinc-500">Montes Carballo 943 • Mar del Plata</p>
                <p className="text-[10px] text-zinc-500">Tel / WhatsApp: +54 9 223 542-8827</p>
                <div className="mt-2 inline-block px-3 py-1 rounded bg-zinc-900 border border-zinc-700 font-bold text-white">
                  {DOCUMENT_DEFINITIONS[emittedVoucher.documentType?.toUpperCase()]?.label || emittedVoucher.documentType}
                </div>
              </div>

              <div className="space-y-1 text-[11px] pb-2 border-b border-zinc-800">
                <div>N° Comprobante: <strong className="text-white">{emittedVoucher.documentNumber}</strong></div>
                <div>Fecha y Hora: <span className="text-zinc-400">{emittedVoucher.formattedDate}</span></div>
                <div>Cliente: <strong className="text-white">{emittedVoucher.customer?.name}</strong></div>
                <div>Doc: <span className="text-zinc-400">{emittedVoucher.customer?.docType} {emittedVoucher.customer?.docNumber || 'Consumidor Final'}</span></div>
                <div>Condición IVA: <span className="text-zinc-400">{emittedVoucher.customer?.taxCondition}</span></div>
              </div>

              <div className="space-y-1.5 pb-2 border-b border-zinc-800">
                <div className="flex justify-between font-bold text-zinc-400 text-[10px] uppercase">
                  <span>Cant • Concepto</span>
                  <span>Subtotal</span>
                </div>
                {emittedVoucher.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">
                      {item.quantity}x {item.name} {item.color !== '-' ? `(${item.color})` : ''}
                    </span>
                    <span className="font-bold text-white whitespace-nowrap">
                      ${Math.round(item.subtotal || item.quantity * item.price).toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1 text-right">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal Neto:</span>
                  <span>${emittedVoucher.subtotal?.toLocaleString('es-AR')}</span>
                </div>
                {emittedVoucher.discountAmount > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Descuentos:</span>
                    <span>-${emittedVoucher.discountAmount?.toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-emerald-400 pt-1 border-t border-zinc-800">
                  <span>TOTAL:</span>
                  <span>${emittedVoucher.total?.toLocaleString('es-AR')}</span>
                </div>
                <div className="text-[10px] text-zinc-500 pt-1">
                  Medio de Pago: <strong className="text-zinc-300">{emittedVoucher.paymentMethod}</strong>
                </div>
              </div>
            </div>

            {/* Acciones de comprobante */}
            <div className="p-4 border-t border-zinc-800 bg-[#161620] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#FF5500]" />
                <span>Imprimir de Nuevo</span>
              </button>

              {emittedVoucher.customer?.phone && (
                <a
                  href={`https://wa.me/549${emittedVoucher.customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `¡Hola ${emittedVoucher.customer.name}! Te enviamos tu comprobante de *montec*:\n` +
                    `📄 *${emittedVoucher.documentNumber}*\n` +
                    `💰 *Total:* $${emittedVoucher.total?.toLocaleString('es-AR')}\n` +
                    `📅 *Fecha:* ${emittedVoucher.formattedDate}\n` +
                    `¡Muchas gracias por elegirnos!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar por WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  setEmittedVoucher(null);
                  resetForm();
                }}
                className="px-4 py-2 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs font-extrabold cursor-pointer"
              >
                Nueva Venta
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
