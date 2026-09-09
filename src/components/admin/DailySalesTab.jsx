import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Receipt, 
  FileText, 
  Download, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  X, 
  Tag, 
  CreditCard, 
  Wallet, 
  QrCode, 
  Building2, 
  User, 
  ArrowUpRight, 
  ShoppingBag, 
  Layers,
  ChevronDown
} from 'lucide-react';
import { useData } from '../../context/DataContext';

// Opciones de tipos de documentos comerciales
export const DOCUMENT_TYPES = [
  { id: 'all', label: 'Todos los Comprobantes', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  { id: 'factura_b', label: 'Factura B', shortLabel: 'FAC B', prefix: 'FAC-B', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { id: 'factura_a', label: 'Factura A', shortLabel: 'FAC A', prefix: 'FAC-A', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { id: 'factura_c', label: 'Factura C', shortLabel: 'FAC C', prefix: 'FAC-C', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  { id: 'remito', label: 'Remito de Entrega', shortLabel: 'REMITO', prefix: 'REM', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { id: 'ticket_x', label: 'Ticket X (No Fiscal)', shortLabel: 'TICKET X', prefix: 'TCK', color: 'bg-zinc-700/30 text-zinc-300 border-zinc-600' },
  { id: 'recibo', label: 'Recibo Oficial', shortLabel: 'RECIBO', prefix: 'REC', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' }
];

export const TAX_CONDITIONS = [
  'Consumidor Final',
  'Responsable Inscripto',
  'Monotributista',
  'Exento',
  'No Responsable'
];

export const PAYMENT_METHODS = [
  { id: 'Efectivo', label: 'Efectivo', icon: Wallet, color: 'text-emerald-400' },
  { id: 'Transferencia / Alias', label: 'Transferencia / Alias', icon: ArrowUpRight, color: 'text-sky-400' },
  { id: 'Tarjeta Débito/Crédito', label: 'Tarjeta Débito/Crédito', icon: CreditCard, color: 'text-purple-400' },
  { id: 'Mercado Pago QR', label: 'Mercado Pago QR', icon: QrCode, color: 'text-amber-400' }
];

export default function DailySalesTab() {
  const { sales = [], recordSale, updateSale, deleteSale, panelTheme } = useData();
  const isLight = panelTheme === 'light';

  // Filtros de fecha
  const [dateFilterMode, setDateFilterMode] = useState('today'); // 'today', 'yesterday', 'last7', 'month', 'custom', 'all'
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedDocType, setSelectedDocType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [editingSaleDoc, setEditingSaleDoc] = useState(null);

  // Formulario de nueva venta manual
  const [manualForm, setManualForm] = useState({
    documentType: 'factura_b',
    documentNumber: '',
    customerName: '',
    customerPhone: '',
    customerDocType: 'DNI',
    customerDocNumber: '',
    taxCondition: 'Consumidor Final',
    concept: 'Venta de Accesorios / Servicios',
    amount: '',
    paymentMethod: 'Efectivo',
    notes: ''
  });

  // Helper para comparar fechas locales (YYYY-MM-DD)
  const getLocalDateString = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date(Date.now() - 24 * 3600 * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Filtrar ventas según período, tipo de documento y búsqueda
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const sDateStr = getLocalDateString(s.createdAt);

      // 1. Filtro de Fecha
      if (dateFilterMode === 'today') {
        if (sDateStr !== todayStr) return false;
      } else if (dateFilterMode === 'yesterday') {
        if (sDateStr !== yesterdayStr) return false;
      } else if (dateFilterMode === 'last7') {
        const diffDays = (new Date(todayStr) - new Date(sDateStr)) / (1000 * 3600 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      } else if (dateFilterMode === 'month') {
        if (!sDateStr.startsWith(currentMonthStr)) return false;
      } else if (dateFilterMode === 'custom') {
        if (sDateStr !== customDate) return false;
      }

      // 2. Filtro de Tipo de Documento
      const docType = s.documentType || 'ticket_x';
      if (selectedDocType !== 'all' && docType !== selectedDocType) {
        return false;
      }

      // 3. Filtro de Búsqueda de Texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const clientName = (s.customer?.name || '').toLowerCase();
        const clientDoc = (s.customer?.docNumber || '').toLowerCase();
        const ticketNum = (s.ticketNumber || '').toLowerCase();
        const docNum = (s.documentNumber || '').toLowerCase();
        const itemsStr = (s.items || []).map(i => i.name || '').join(' ').toLowerCase();

        if (
          !clientName.includes(q) &&
          !clientDoc.includes(q) &&
          !ticketNum.includes(q) &&
          !docNum.includes(q) &&
          !itemsStr.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [sales, dateFilterMode, customDate, selectedDocType, searchQuery, todayStr, yesterdayStr, currentMonthStr]);

  // Métricas del período filtrado
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let count = filteredSales.length;
    let facturasTotal = 0;
    let facturasCount = 0;
    let remitosTotal = 0;
    let remitosCount = 0;
    let ticketsTotal = 0;
    let ticketsCount = 0;

    const paymentTotals = {
      'Efectivo': 0,
      'Transferencia / Alias': 0,
      'Tarjeta Débito/Crédito': 0,
      'Mercado Pago QR': 0,
      'Otros': 0
    };

    filteredSales.forEach(s => {
      const amount = Number(s.total) || 0;
      totalRevenue += amount;

      const docType = s.documentType || 'ticket_x';
      if (['factura_a', 'factura_b', 'factura_c'].includes(docType)) {
        facturasTotal += amount;
        facturasCount++;
      } else if (docType === 'remito') {
        remitosTotal += amount;
        remitosCount++;
      } else {
        ticketsTotal += amount;
        ticketsCount++;
      }

      const method = s.paymentMethod || 'Efectivo';
      if (paymentTotals[method] !== undefined) {
        paymentTotals[method] += amount;
      } else {
        paymentTotals['Otros'] += amount;
      }
    });

    const averageTicket = count > 0 ? Math.round(totalRevenue / count) : 0;

    return {
      totalRevenue,
      count,
      averageTicket,
      facturasTotal,
      facturasCount,
      remitosTotal,
      remitosCount,
      ticketsTotal,
      ticketsCount,
      paymentTotals
    };
  }, [filteredSales]);

  // Manejo de guardado de venta manual
  const handleSaveManualSale = (e) => {
    e.preventDefault();
    const amountNum = Number(manualForm.amount);
    if (!amountNum || amountNum <= 0) return;

    const docTypeObj = DOCUMENT_TYPES.find(d => d.id === manualForm.documentType) || DOCUMENT_TYPES[1];
    const generatedNumber = manualForm.documentNumber.trim() || 
      `#${docTypeObj.prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const salePayload = {
      documentType: manualForm.documentType,
      documentNumber: generatedNumber,
      ticketNumber: generatedNumber,
      total: amountNum,
      subtotal: amountNum,
      discountAmount: 0,
      paymentMethod: manualForm.paymentMethod,
      customer: {
        name: manualForm.customerName.trim() || 'Consumidor Final',
        phone: manualForm.customerPhone.trim() || '',
        docType: manualForm.customerDocType,
        docNumber: manualForm.customerDocNumber.trim(),
        taxCondition: manualForm.taxCondition
      },
      items: [
        {
          id: `item-${Date.now()}`,
          name: manualForm.concept.trim() || 'Venta / Servicio Mostrador',
          quantity: 1,
          price: amountNum
        }
      ],
      notes: manualForm.notes.trim(),
      seller: 'Administración Montec',
      createdAt: new Date().toISOString()
    };

    recordSale(salePayload);
    setIsNewSaleModalOpen(false);
    setManualForm({
      documentType: 'factura_b',
      documentNumber: '',
      customerName: '',
      customerPhone: '',
      customerDocType: 'DNI',
      customerDocNumber: '',
      taxCondition: 'Consumidor Final',
      concept: 'Venta de Accesorios / Servicios',
      amount: '',
      paymentMethod: 'Efectivo',
      notes: ''
    });
  };

  // Manejo de actualización de comprobante
  const handleSaveEditDoc = (e) => {
    e.preventDefault();
    if (!editingSaleDoc) return;

    updateSale(editingSaleDoc.id, {
      documentType: editingSaleDoc.documentType,
      documentNumber: editingSaleDoc.documentNumber,
      customer: {
        ...(editingSaleDoc.customer || {}),
        name: editingSaleDoc.customerName,
        docNumber: editingSaleDoc.customerDocNumber,
        taxCondition: editingSaleDoc.taxCondition
      },
      notes: editingSaleDoc.notes
    });

    setEditingSaleDoc(null);
  };

  // Exportar a CSV / Excel
  const handleExportCSV = () => {
    if (filteredSales.length === 0) return;

    const headers = [
      'Fecha',
      'Hora',
      'Tipo Comprobante',
      'N° Comprobante / Ticket',
      'Cliente',
      'Condición IVA',
      'DNI / CUIT',
      'Teléfono',
      'Detalle Ítems',
      'Medio de Pago',
      'Monto Total (ARS)',
      'Notas'
    ];

    const rows = filteredSales.map(s => {
      const d = new Date(s.createdAt);
      const fecha = d.toLocaleDateString('es-AR');
      const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      const docTypeLabel = (DOCUMENT_TYPES.find(dt => dt.id === s.documentType)?.label || s.documentType || 'Ticket').replace(',', ' ');
      const itemsDetail = (s.items || []).map(i => `${i.quantity || 1}x ${i.name || ''}`).join(' - ').replace(/,/g, ';');

      return [
        `"${fecha}"`,
        `"${hora}"`,
        `"${docTypeLabel}"`,
        `"${s.documentNumber || s.ticketNumber || ''}"`,
        `"${(s.customer?.name || 'Consumidor Final').replace(/"/g, '""')}"`,
        `"${s.customer?.taxCondition || 'Consumidor Final'}"`,
        `"${s.customer?.docNumber || ''}"`,
        `"${s.customer?.phone || ''}"`,
        `"${itemsDetail}"`,
        `"${s.paymentMethod || 'Efectivo'}"`,
        `"${s.total || 0}"`,
        `"${(s.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `montec_ventas_${dateFilterMode}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Imprimir comprobante
  const handlePrintReceipt = (sale) => {
    setViewingReceipt(sale);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* 1. ENCABEZADO Y CONTROLES PRINCIPALES */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#121215] border border-zinc-800/80 p-5 sm:p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Control Comercial & Fiscal
            </span>
            <span className="text-xs text-zinc-400">
              Registro diario de operaciones y caja
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-[#FF5500]" />
            <span>Ventas Diarias & Comprobantes</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Visualizá la facturación de cada jornada y verificá si fueron Facturas (A/B/C), Remitos o Tickets.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
            title="Descargar listado en formato Excel / CSV para contabilidad"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewSaleModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] active:scale-95 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(255,85,0,0.35)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Venta / Comprobante</span>
          </button>
        </div>
      </div>

      {/* 2. BARRA DE FILTRO POR FECHAS Y CALENDARIO */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d0d10] border border-zinc-800 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setDateFilterMode('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              dateFilterMode === 'today'
                ? 'bg-[#FF5500] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            Hoy ({todayStr})
          </button>

          <button
            type="button"
            onClick={() => setDateFilterMode('yesterday')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              dateFilterMode === 'yesterday'
                ? 'bg-[#FF5500] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            Ayer
          </button>

          <button
            type="button"
            onClick={() => setDateFilterMode('last7')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              dateFilterMode === 'last7'
                ? 'bg-[#FF5500] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            Últimos 7 Días
          </button>

          <button
            type="button"
            onClick={() => setDateFilterMode('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              dateFilterMode === 'month'
                ? 'bg-[#FF5500] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            Este Mes
          </button>

          <button
            type="button"
            onClick={() => setDateFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              dateFilterMode === 'all'
                ? 'bg-[#FF5500] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            Todo el Historial
          </button>
        </div>

        {/* Selector de Fecha Manual */}
        <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-2 sm:pt-0 sm:pl-3">
          <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="date"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setDateFilterMode('custom');
            }}
            className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-2.5 py-1 text-xs text-white outline-none focus:border-[#FF5500] cursor-pointer"
          />
        </div>
      </div>

      {/* 3. TARJETAS DE KPIS Y TOTALES DE LA JORNADA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* TOTAL COBRADO / FACTURADO */}
        <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Total Facturado / Cobrado
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-emerald-400 tracking-tight">
              ${stats.totalRevenue.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
            <span>{stats.count} ventas registradas</span>
            <span>•</span>
            <span>Prom: ${stats.averageTicket.toLocaleString('es-AR')}</span>
          </div>
        </div>

        {/* FACTURAS FISCALES (A / B / C) */}
        <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Facturas (A / B / C)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
              ${stats.facturasTotal.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-blue-400 font-semibold">
            {stats.facturasCount} comprobantes fiscales emitidos
          </div>
        </div>

        {/* REMITOS DE ENTREGA */}
        <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Remitos de Entrega
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
              ${stats.remitosTotal.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400 font-semibold">
            {stats.remitosCount} remitos comerciales emitidos
          </div>
        </div>

        {/* TICKETS & RECIBOS INTERNOS */}
        <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Tickets & Recibos X
            </span>
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center border border-zinc-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
              ${stats.ticketsTotal.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 font-semibold">
            {stats.ticketsCount} tickets / notas internas
          </div>
        </div>

      </div>

      {/* 4. MEDIOS DE PAGO DEL DÍA */}
      <div className="bg-[#121215] border border-zinc-800/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
          <Wallet className="w-4 h-4 text-[#FF5500]" />
          <span>Distribución por Medio de Cobro:</span>
        </span>

        <div className="flex flex-wrap items-center gap-3">
          {PAYMENT_METHODS.map(pm => {
            const amount = stats.paymentTotals[pm.id] || 0;
            const Icon = pm.icon;
            return (
              <div key={pm.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <Icon className={`w-3.5 h-3.5 ${pm.color}`} />
                <span className="text-zinc-400">{pm.label}:</span>
                <span className="font-mono font-bold text-white">${amount.toLocaleString('es-AR')}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. FILTROS POR TIPO DE DOCUMENTO Y BUSCADOR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Selector de tipo de documento */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {DOCUMENT_TYPES.map(dt => (
            <button
              key={dt.id}
              type="button"
              onClick={() => setSelectedDocType(dt.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                selectedDocType === dt.id
                  ? 'bg-[#FF5500] border-[#FF5500] text-white shadow-sm'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {dt.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, DNI, comprobante, producto..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FF5500]"
          />
        </div>
      </div>

      {/* 6. TABLA DE VENTAS Y COMPROBANTES */}
      <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-[#121215] shadow-lg">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="uppercase text-[11px] font-mono tracking-wider sticky top-0 z-10 bg-zinc-900/95 text-zinc-400 border-b border-zinc-800 backdrop-blur-md">
              <tr>
                <th className="px-4 py-3">Fecha & Hora</th>
                <th className="px-4 py-3">Tipo de Documento</th>
                <th className="px-4 py-3">N° Comprobante</th>
                <th className="px-4 py-3">Cliente & Datos</th>
                <th className="px-4 py-3">Detalle / Concepto</th>
                <th className="px-4 py-3">Medio de Pago</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-500">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <span>No hay ventas registradas para este período o filtro seleccionado.</span>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const docInfo = DOCUMENT_TYPES.find(d => d.id === sale.documentType) || DOCUMENT_TYPES[5];
                  const d = new Date(sale.createdAt);
                  const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                  const fecha = d.toLocaleDateString('es-AR');

                  return (
                    <tr key={sale.id} className="hover:bg-zinc-900/40 transition-colors">
                      {/* Fecha & Hora */}
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-400">
                        <div className="font-semibold text-white">{hora}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">{fecha}</div>
                      </td>

                      {/* Tipo de Documento */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${docInfo.color}`}>
                          <FileText className="w-3 h-3" />
                          <span>{docInfo.label}</span>
                        </span>
                      </td>

                      {/* N° Comprobante */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-zinc-200">
                        {sale.documentNumber || sale.ticketNumber}
                      </td>

                      {/* Cliente */}
                      <td className="px-4 py-3 text-zinc-300">
                        <div className="font-semibold text-white">
                          {sale.customer?.name || 'Consumidor Final'}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {sale.customer?.taxCondition || 'Consumidor Final'}
                          {sale.customer?.docNumber && ` • ${sale.customer.docType || 'DNI'}: ${sale.customer.docNumber}`}
                        </div>
                      </td>

                      {/* Detalle Ítems */}
                      <td className="px-4 py-3 max-w-xs text-zinc-300 truncate">
                        {Array.isArray(sale.items) && sale.items.length > 0 ? (
                          sale.items.map((it, idx) => (
                            <span key={idx} className="block truncate text-xs">
                              {it.quantity || 1}x {it.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-500 text-xs">Servicios generales</span>
                        )}
                        {sale.notes && (
                          <span className="text-[10px] text-zinc-500 block italic truncate mt-0.5">
                            Nota: {sale.notes}
                          </span>
                        )}
                      </td>

                      {/* Medio de Pago */}
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-300 font-medium">
                        {sale.paymentMethod || 'Efectivo'}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-extrabold text-emerald-400 text-sm sm:text-base">
                        ${Number(sale.total || 0).toLocaleString('es-AR')}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Ver e Imprimir Comprobante */}
                          <button
                            type="button"
                            onClick={() => handlePrintReceipt(sale)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            title="Ver e Imprimir Comprobante"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Modificar Tipo de Comprobante */}
                          <button
                            type="button"
                            onClick={() => setEditingSaleDoc({
                              id: sale.id,
                              documentType: sale.documentType || 'ticket_x',
                              documentNumber: sale.documentNumber || sale.ticketNumber || '',
                              customerName: sale.customer?.name || 'Consumidor Final',
                              customerDocNumber: sale.customer?.docNumber || '',
                              taxCondition: sale.customer?.taxCondition || 'Consumidor Final',
                              notes: sale.notes || ''
                            })}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            title="Cambiar tipo de documento (Factura/Remito/Ticket)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`¿Seguro que deseás anular/eliminar este comprobante (${sale.documentNumber || sale.ticketNumber})?`)) {
                                deleteSale(sale.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Eliminar o anular venta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: REGISTRAR VENTA / COMPROBANTE MANUAL */}
      {isNewSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsNewSaleModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-zinc-800">
              <Receipt className="w-6 h-6 text-[#FF5500]" />
              <div>
                <h3 className="text-lg font-heading font-bold text-white">
                  Registrar Venta / Comprobante Comercial
                </h3>
                <p className="text-xs text-zinc-400">
                  Emití una factura, remito o ticket manual con imputación contable.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveManualSale} className="space-y-4">
              
              {/* Tipo de Documento */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Tipo de Comprobante Comercial
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DOCUMENT_TYPES.filter(d => d.id !== 'all').map(dt => (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setManualForm({ ...manualForm, documentType: dt.id })}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        manualForm.documentType === dt.id
                          ? 'bg-[#FF5500] border-[#FF5500] text-white shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      {dt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Número de Comprobante Opcional */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Número de Comprobante (Opcional - se autogenera si se deja vacío)
                </label>
                <input
                  type="text"
                  value={manualForm.documentNumber}
                  onChange={(e) => setManualForm({ ...manualForm, documentNumber: e.target.value })}
                  placeholder="Ej: 0001-00001042 o REM-1042..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                />
              </div>

              {/* Datos del Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nombre o Razón Social del Cliente
                  </label>
                  <input
                    type="text"
                    value={manualForm.customerName}
                    onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                    placeholder="Consumidor Final o Nombre Cliente..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Condición Tributaria (IVA)
                  </label>
                  <select
                    value={manualForm.taxCondition}
                    onChange={(e) => setManualForm({ ...manualForm, taxCondition: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                  >
                    {TAX_CONDITIONS.map(tc => (
                      <option key={tc} value={tc}>{tc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DNI o CUIT */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Tipo Doc.</label>
                  <select
                    value={manualForm.customerDocType}
                    onChange={(e) => setManualForm({ ...manualForm, customerDocType: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                  >
                    <option value="DNI">DNI</option>
                    <option value="CUIT">CUIT</option>
                    <option value="CUIL">CUIL</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">N° de Documento / CUIT</label>
                  <input
                    type="text"
                    value={manualForm.customerDocNumber}
                    onChange={(e) => setManualForm({ ...manualForm, customerDocNumber: e.target.value })}
                    placeholder="Número de documento o CUIT..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                  />
                </div>
              </div>

              {/* Concepto y Monto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Concepto de Venta / Servicio
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.concept}
                    onChange={(e) => setManualForm({ ...manualForm, concept: e.target.value })}
                    placeholder="Ej: Cambio de Pantalla, Cargador Foxconn..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Monto Total ($ ARS)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={manualForm.amount}
                    onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                    placeholder="0"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 outline-none focus:border-[#FF5500]"
                  />
                </div>
              </div>

              {/* Medio de Pago */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Medio de Cobro
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setManualForm({ ...manualForm, paymentMethod: pm.id })}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                        manualForm.paymentMethod === pm.id
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Notas u Observaciones</label>
                <input
                  type="text"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="Detalles adicionales para el comprobante..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                />
              </div>

              {/* Botón emitir */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white font-bold text-xs shadow-lg shadow-[#FF5500]/25 transition-all cursor-pointer mt-2"
              >
                Emitir y Registrar Comprobante
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR / RECLASIFICAR TIPO DE COMPROBANTE */}
      {editingSaleDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setEditingSaleDoc(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-heading font-bold text-white mb-1">
              Modificar Comprobante Comercial
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Cambiá la clasificación del documento (ej: pasar de Remito a Factura B).
            </p>

            <form onSubmit={handleSaveEditDoc} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Tipo de Documento</label>
                <select
                  value={editingSaleDoc.documentType}
                  onChange={(e) => setEditingSaleDoc({ ...editingSaleDoc, documentType: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                >
                  {DOCUMENT_TYPES.filter(d => d.id !== 'all').map(dt => (
                    <option key={dt.id} value={dt.id}>{dt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">N° de Comprobante Oficial</label>
                <input
                  type="text"
                  value={editingSaleDoc.documentNumber}
                  onChange={(e) => setEditingSaleDoc({ ...editingSaleDoc, documentNumber: e.target.value })}
                  placeholder="N° de factura o remito..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Cliente</label>
                <input
                  type="text"
                  value={editingSaleDoc.customerName}
                  onChange={(e) => setEditingSaleDoc({ ...editingSaleDoc, customerName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">DNI / CUIT</label>
                  <input
                    type="text"
                    value={editingSaleDoc.customerDocNumber}
                    onChange={(e) => setEditingSaleDoc({ ...editingSaleDoc, customerDocNumber: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Condición IVA</label>
                  <select
                    value={editingSaleDoc.taxCondition}
                    onChange={(e) => setEditingSaleDoc({ ...editingSaleDoc, taxCondition: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                  >
                    {TAX_CONDITIONS.map(tc => (
                      <option key={tc} value={tc}>{tc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Notas</label>
                <input
                  type="text"
                  value={editingSaleDoc.notes}
                  onChange={(e) => setEditingSaleDoc({ ...editingSaleDoc, notes: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF5500]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white font-bold text-xs shadow-md transition-all cursor-pointer mt-2"
              >
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VISTA E IMPRESIÓN DE COMPROBANTE */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn print:p-0 print:bg-white">
          <div className="bg-white text-zinc-900 border border-zinc-300 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative font-sans print:shadow-none print:border-none print:max-w-none print:w-full">
            <button
              type="button"
              onClick={() => setViewingReceipt(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 p-1 rounded-lg hover:bg-zinc-100 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Encabezado del comprobante */}
            <div className="text-center pb-4 border-b border-zinc-200">
              <h2 className="text-xl font-heading font-black tracking-wider text-black">
                MONTEC
              </h2>
              <p className="text-xs text-zinc-600">Servicio Técnico Especializado en Celulares, iPhone & PC</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Montes Carballo 943 • Mar del Plata</p>
              <p className="text-[11px] text-zinc-500">Tel / WhatsApp: +54 9 223 542-8827</p>

              <div className="mt-3 inline-block px-3 py-1 bg-zinc-100 rounded-lg border border-zinc-300 text-xs font-mono font-bold uppercase">
                {DOCUMENT_TYPES.find(d => d.id === viewingReceipt.documentType)?.label || 'COMPROBANTE'}
              </div>
              <div className="text-xs font-mono font-bold text-zinc-700 mt-1">
                N°: {viewingReceipt.documentNumber || viewingReceipt.ticketNumber}
              </div>
            </div>

            {/* Datos del comprobante y cliente */}
            <div className="py-3 border-b border-zinc-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Fecha:</span>
                <span className="font-semibold">{new Date(viewingReceipt.createdAt).toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Cliente:</span>
                <span className="font-semibold">{viewingReceipt.customer?.name || 'Consumidor Final'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Condición IVA:</span>
                <span>{viewingReceipt.customer?.taxCondition || 'Consumidor Final'}</span>
              </div>
              {viewingReceipt.customer?.docNumber && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">{viewingReceipt.customer.docType || 'DNI'}:</span>
                  <span className="font-mono">{viewingReceipt.customer.docNumber}</span>
                </div>
              )}
            </div>

            {/* Ítems */}
            <div className="py-3 border-b border-zinc-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 uppercase font-mono text-[10px]">
                    <th className="text-left py-1">Cant</th>
                    <th className="text-left py-1">Detalle</th>
                    <th className="text-right py-1">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {Array.isArray(viewingReceipt.items) && viewingReceipt.items.length > 0 ? (
                    viewingReceipt.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 font-bold">{it.quantity || 1}</td>
                        <td className="py-1.5 pr-2">{it.name}</td>
                        <td className="py-1.5 text-right font-mono font-bold">${Number(it.price * (it.quantity || 1)).toLocaleString('es-AR')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-1 text-zinc-500">Venta de mostrador</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totales y Pago */}
            <div className="pt-3 text-xs space-y-1">
              <div className="flex justify-between text-base font-bold text-black border-t border-zinc-300 pt-2">
                <span>TOTAL ABONADO:</span>
                <span className="font-mono text-emerald-600">${Number(viewingReceipt.total || 0).toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-zinc-600 pt-1">
                <span>Medio de Pago:</span>
                <span className="font-semibold">{viewingReceipt.paymentMethod || 'Efectivo'}</span>
              </div>
              {viewingReceipt.notes && (
                <div className="text-[11px] text-zinc-500 italic mt-2">
                  Obs: {viewingReceipt.notes}
                </div>
              )}
            </div>

            {/* Botón Imprimir */}
            <div className="mt-6 flex gap-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Comprobante</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
