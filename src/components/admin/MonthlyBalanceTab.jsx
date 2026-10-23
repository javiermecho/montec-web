import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Receipt, 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  Trash2, 
  Edit3, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  PieChart, 
  Layers, 
  FileText, 
  Building2, 
  Image as ImageIcon, 
  Eye,
  RefreshCw,
  Clock,
  Sparkles,
  Wrench,
  ShoppingBag,
  Check,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import PartCostFinderModal from '../taller/PartCostFinderModal';

export const EXPENSE_CATEGORIES = [
  { id: 'Alquiler', label: 'Alquiler', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', barColor: 'bg-amber-500' },
  { id: 'Servicios', label: 'Luz / Servicios', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', barColor: 'bg-blue-500' },
  { id: 'Insumos/Taller', label: 'Insumos / Taller', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', barColor: 'bg-emerald-500' },
  { id: 'Repuestos', label: 'Repuestos Urgentes', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', barColor: 'bg-purple-500' },
  { id: 'Sueldos/Retiros', label: 'Sueldos / Retiros', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', barColor: 'bg-rose-500' },
  { id: 'Varios', label: 'Varios / Otros', color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30', barColor: 'bg-zinc-400' }
];

export const PAYMENT_METHODS = [
  { id: 'Efectivo', label: 'Efectivo', icon: Wallet, color: 'text-emerald-400' },
  { id: 'Transferencia', label: 'Transferencia / Alias', icon: ArrowUpRight, color: 'text-sky-400' },
  { id: 'Tarjeta', label: 'Tarjeta Débito / Crédito', icon: CreditCard, color: 'text-purple-400' }
];

// Helper para formatear fechas a YYYY-MM-DD
const toISODateString = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function MonthlyBalanceTab() {
  const { 
    expenses = [], 
    addExpense, 
    updateExpense, 
    deleteExpense, 
    getPeriodFinancialSummary, 
    updateOrderPartCost,
    panelTheme,
    businessConfig,
    serverStatus,
    refreshConnection
  } = useData();

  const isLight = panelTheme === 'light';

  // ─── SELECTOR DE RANGO DE FECHAS LIBRE & PRESETS ───────────────
  const [activePreset, setActivePreset] = useState('thisMonth'); // 'today' | 'thisWeek' | 'thisMonth' | 'prevMonth' | 'custom'
  
  // Inicialización por defecto en el mes corriente
  const defaultDates = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: toISODateString(firstDay),
      endDate: toISODateString(lastDay)
    };
  }, []);

  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);

  // Manejador de Presets Rápidos
  const applyPreset = (presetKey) => {
    const now = new Date();
    setActivePreset(presetKey);

    if (presetKey === 'today') {
      const todayStr = toISODateString(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (presetKey === 'thisWeek') {
      const currentDay = now.getDay(); // 0 es domingo
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      setStartDate(toISODateString(monday));
      setEndDate(toISODateString(now));
    } else if (presetKey === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(toISODateString(firstDay));
      setEndDate(toISODateString(lastDay));
    } else if (presetKey === 'prevMonth') {
      const firstDayPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayPrev = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(toISODateString(firstDayPrev));
      setEndDate(toISODateString(lastDayPrev));
    }
  };

  // Cálculo financiero consolidado reactivo para el período seleccionado
  const summary = useMemo(() => {
    if (getPeriodFinancialSummary) {
      return getPeriodFinancialSummary({ startDate, endDate });
    }
    return {
      income: { total: 0, repairs: 0, repairsCount: 0, sales: 0, salesCount: 0 },
      expenses: { total: 0, count: 0, byCategory: [] },
      cashBreakdown: { incomeCash: 0, incomeBank: 0, expenseCash: 0, expenseBank: 0, cashOnHand: 0, bankBalance: 0, netTotal: 0 },
      repairsProfitability: { revenue: 0, partsCost: 0, netProfit: 0, marginPercent: 0, count: 0, deliveredOrders: [] },
      salesProfitability: { revenue: 0, cogs: 0, netProfit: 0, marginPercent: 0, count: 0 },
      operationalExpenses: 0,
      finalNetPocketProfit: 0,
      netBalance: 0
    };
  }, [getPeriodFinancialSummary, startDate, endDate]);

  // Filtros del historial de gastos
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');

  // Filtros de la tabla de reparaciones entregadas
  const [repairSearch, setRepairSearch] = useState('');
  const [onlyZeroCostRepairs, setOnlyZeroCostRepairs] = useState(false);

  // Estados de edición in-line de costos de repuesto
  const [inlineEditingOrderId, setInlineEditingOrderId] = useState(null);
  const [inlinePartCost, setInlinePartCost] = useState('');
  const [inlinePartSupplier, setInlinePartSupplier] = useState('');

  // Modal de búsqueda de repuestos en proveedores
  const [isPartCostModalOpen, setIsPartCostModalOpen] = useState(false);
  const [costModalOrder, setCostModalOrder] = useState(null);

  // Modales de gastos
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Formulario de Gasto
  const [formState, setFormState] = useState({
    concepto: '',
    monto: '',
    categoria: 'Insumos/Taller',
    metodo_pago: 'Efectivo',
    fecha: new Date().toISOString().slice(0, 16),
    comprobante_url: '',
    notas: ''
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lista de gastos filtrados para la tabla dentro del rango de fechas
  const filteredExpenses = useMemo(() => {
    const seen = new Set();
    const cleanList = [];

    const startBoundary = new Date(`${startDate}T00:00:00`);
    const endBoundary = new Date(`${endDate}T23:59:59.999`);

    (expenses || []).forEach(item => {
      if (!item) return;
      const d = item.fecha ? new Date(item.fecha) : (item.creado_en ? new Date(item.creado_en) : null);
      if (!d || isNaN(d.getTime())) return;

      if (d < startBoundary || d > endBoundary) return;

      const minStr = d.toISOString().slice(0, 16);
      const idKey = String(item.id);
      const contentKey = `${(item.concepto || item.descripcion || '').toLowerCase().trim()}_${Number(item.monto)}_${item.categoria}_${minStr}`;

      if (seen.has(idKey) || seen.has(contentKey)) {
        return;
      }
      seen.add(idKey);
      seen.add(contentKey);

      if (filterCategory !== 'all' && item.categoria !== filterCategory) return;
      if (filterPaymentMethod !== 'all' && item.metodo_pago !== filterPaymentMethod) return;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesConcept = (item.concepto || item.descripcion || '').toLowerCase().includes(query);
        const matchesNotes = (item.notas || '').toLowerCase().includes(query);
        const matchesCategory = (item.categoria || '').toLowerCase().includes(query);
        const matchesAmount = String(item.monto || '').includes(query);
        if (!matchesConcept && !matchesNotes && !matchesCategory && !matchesAmount) return;
      }

      cleanList.push(item);
    });

    return cleanList.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [expenses, startDate, endDate, filterCategory, filterPaymentMethod, searchQuery]);

  // Lista de reparaciones entregadas filtradas para la tabla
  const filteredDeliveredRepairs = useMemo(() => {
    const list = summary.repairsProfitability?.deliveredOrders || [];
    return list.filter(ord => {
      if (onlyZeroCostRepairs && ord.partCost > 0) return false;

      if (repairSearch.trim()) {
        const q = repairSearch.toLowerCase().trim();
        const matchesNum = (ord.orderNumber || '').toLowerCase().includes(q);
        const matchesClient = (ord.clientName || '').toLowerCase().includes(q);
        const matchesModel = (ord.deviceModel || '').toLowerCase().includes(q);
        const matchesIssue = (ord.issue || '').toLowerCase().includes(q);
        if (!matchesNum && !matchesClient && !matchesModel && !matchesIssue) return false;
      }

      return true;
    });
  }, [summary.repairsProfitability?.deliveredOrders, onlyZeroCostRepairs, repairSearch]);

  // Guardar costo in-line en la tabla de reparaciones
  const handleSaveInlinePartCost = async (orderId) => {
    const costNum = parseFloat(inlinePartCost) || 0;
    if (updateOrderPartCost) {
      await updateOrderPartCost(orderId, {
        partCost: costNum,
        partSupplier: inlinePartSupplier
      });
    }
    setInlineEditingOrderId(null);
  };

  // Abrir modal de búsqueda de repuestos para una orden específica
  const handleOpenSearchForOrder = (order) => {
    setCostModalOrder(order);
    setIsPartCostModalOpen(true);
  };

  // Manejador para abrir modal de nuevo gasto
  const handleOpenNewExpense = () => {
    setEditingExpense(null);
    setFormState({
      concepto: '',
      monto: '',
      categoria: 'Insumos/Taller',
      metodo_pago: 'Efectivo',
      fecha: new Date().toISOString().slice(0, 16),
      comprobante_url: '',
      notas: ''
    });
    setFormError('');
    setIsNewExpenseModalOpen(true);
  };

  // Manejador para editar gasto
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    let fDate = '';
    try {
      fDate = new Date(expense.fecha || expense.creado_en).toISOString().slice(0, 16);
    } catch {
      fDate = new Date().toISOString().slice(0, 16);
    }
    setFormState({
      concepto: expense.concepto || expense.descripcion || '',
      monto: expense.monto || '',
      categoria: expense.categoria || 'Varios',
      metodo_pago: expense.metodo_pago || 'Efectivo',
      fecha: fDate,
      comprobante_url: expense.comprobante_url || '',
      notas: expense.notas || ''
    });
    setFormError('');
    setIsNewExpenseModalOpen(true);
  };

  // Guardar o Actualizar Gasto
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    const cleanConcepto = formState.concepto.trim();
    const cleanMonto = parseFloat(formState.monto);

    if (!cleanConcepto) {
      setFormError('Por favor ingresa el concepto del gasto.');
      return;
    }

    if (isNaN(cleanMonto) || cleanMonto <= 0) {
      setFormError('El monto debe ser un número mayor a cero.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          concepto: cleanConcepto,
          descripcion: cleanConcepto,
          monto: cleanMonto,
          categoria: formState.categoria,
          metodo_pago: formState.metodo_pago,
          fecha: new Date(formState.fecha).toISOString(),
          comprobante_url: formState.comprobante_url || null,
          notas: formState.notas.trim()
        });
      } else {
        await addExpense({
          concepto: cleanConcepto,
          descripcion: cleanConcepto,
          monto: cleanMonto,
          categoria: formState.categoria,
          metodo_pago: formState.metodo_pago,
          fecha: new Date(formState.fecha).toISOString(),
          comprobante_url: formState.comprobante_url || null,
          notas: formState.notas.trim()
        });
      }

      setIsNewExpenseModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Error al guardar el gasto');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar gasto confirmado
  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      deleteExpense(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  // Exportar a CSV / Excel
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      alert('No hay gastos registrados en el período seleccionado para exportar.');
      return;
    }

    const headers = ['ID', 'Fecha', 'Concepto', 'Categoría', 'Método de Pago', 'Monto', 'Notas'];
    const rows = filteredExpenses.map(g => [
      g.id,
      g.fecha ? new Date(g.fecha).toLocaleDateString('es-AR') : '',
      `"${(g.concepto || g.descripcion || '').replace(/"/g, '""')}"`,
      g.categoria,
      g.metodo_pago,
      g.monto,
      `"${(g.notas || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `montec_balance_${startDate}_a_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Imprimir reporte consolidado
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 1. BARRA SUPERIOR: SELECTOR DE PERÍODO LIBRE & PRESETS       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className={`p-5 rounded-2xl border transition-all duration-300 no-print ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/90 border-zinc-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-[#FF5500] border border-orange-500/30">
                <Receipt className="w-5 h-5" />
              </span>
              <h2 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Gastos & Cierre de Mes (Balance Financiero)
              </h2>
            </div>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Estado de resultados real: Utilidad de Taller vs. Productos, CMV, Gastos Operativos y Ganancia Neta de Bolsillo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botón Imprimir / PDF */}
            <button
              onClick={handlePrintReport}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' 
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
              }`}
              title="Imprimir o Guardar en PDF el Resumen del Balance"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-400" />
              <span>Imprimir / PDF</span>
            </button>

            {/* Botón Exportar CSV */}
            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' 
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
              }`}
              title="Descargar lista de gastos en Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Exportar</span>
            </button>

            {/* Botón Registrar Nuevo Gasto */}
            <button
              onClick={handleOpenNewExpense}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#FF5500] hover:bg-[#FF5500]/90 text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cargar Gasto</span>
            </button>
          </div>
        </div>

        {/* SELECTOR DE FECHAS LIBRE & PRESETS */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Presets Rápidos */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-zinc-500 font-semibold mr-1">Período:</span>
            {[
              { id: 'today', label: 'Hoy' },
              { id: 'thisWeek', label: 'Esta Semana' },
              { id: 'thisMonth', label: 'Este Mes' },
              { id: 'prevMonth', label: 'Mes Anterior' },
              { id: 'custom', label: 'Personalizado' }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer border ${
                  activePreset === preset.id
                    ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-xs'
                    : (isLight 
                        ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' 
                        : 'bg-zinc-800/60 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white')
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Rango de Fechas Libre Desde - Hasta */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-700/80 rounded-xl px-2.5 py-1.5">
              <span className="text-zinc-500 font-bold">Desde:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="bg-transparent text-white font-mono focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-700/80 rounded-xl px-2.5 py-1.5">
              <span className="text-zinc-500 font-bold">Hasta:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="bg-transparent text-white font-mono focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 2. TARJETAS DE MÉTRICAS (RESUMEN EJECUTIVO TALLER vs PRODS)  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Utilidad de Taller Técnico */}
        <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>Utilidad Taller</span>
            </span>
            <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-bold">
              {summary.repairsProfitability.count} entregadas
            </span>
          </div>

          <div className="mt-2.5">
            <span className="text-[11px] text-zinc-400 block">Ganancia Neta en Reparaciones:</span>
            <h3 className="text-2xl font-black font-mono tracking-tight text-sky-400">
              ${summary.repairsProfitability.netProfit.toLocaleString('es-AR')}
            </h3>
            
            <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span>Cobrado al Cliente:</span>
                <strong className="text-zinc-200 font-mono">${summary.repairsProfitability.revenue.toLocaleString('es-AR')}</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Costo Repuestos / Insumos:</span>
                <strong className="text-rose-400 font-mono">-${summary.repairsProfitability.partsCost.toLocaleString('es-AR')}</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Margen Taller:</span>
                <strong className={`font-mono ${summary.repairsProfitability.marginPercent >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {summary.repairsProfitability.marginPercent}%
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Utilidad de Venta de Productos (Mostrador) */}
        <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Utilidad Productos</span>
            </span>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold">
              {summary.salesProfitability.count} ventas POS
            </span>
          </div>

          <div className="mt-2.5">
            <span className="text-[11px] text-zinc-400 block">Ganancia Neta en Mostrador:</span>
            <h3 className="text-2xl font-black font-mono tracking-tight text-purple-400">
              ${summary.salesProfitability.netProfit.toLocaleString('es-AR')}
            </h3>

            <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span>Facturado Productos:</span>
                <strong className="text-zinc-200 font-mono">${summary.salesProfitability.revenue.toLocaleString('es-AR')}</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Costo Mercadería (CMV):</span>
                <strong className="text-rose-400 font-mono">-${summary.salesProfitability.cogs.toLocaleString('es-AR')}</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Margen Mostrador:</span>
                <strong className={`font-mono ${summary.salesProfitability.marginPercent >= 40 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {summary.salesProfitability.marginPercent}%
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Gastos Operativos Fijos y Variables */}
        <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Gastos Operativos</span>
            </span>
            <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold">
              {summary.expenses.count} comprobantes
            </span>
          </div>

          <div className="mt-2.5">
            <span className="text-[11px] text-zinc-400 block">Egresos del Período:</span>
            <h3 className="text-2xl font-black font-mono tracking-tight text-rose-400">
              -${summary.operationalExpenses.toLocaleString('es-AR')}
            </h3>

            <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span>Alquiler & Servicios:</span>
                <strong className="text-zinc-300 font-mono">
                  ${(summary.expenses.byCategory.filter(c => c.categoria === 'Alquiler' || c.categoria === 'Servicios').reduce((acc, c) => acc + c.total, 0)).toLocaleString('es-AR')}
                </strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Sueldos / Retiros:</span>
                <strong className="text-zinc-300 font-mono">
                  ${(summary.expenses.byCategory.find(c => c.categoria === 'Sueldos/Retiros')?.total || 0).toLocaleString('es-AR')}
                </strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Insumos & Varios:</span>
                <strong className="text-zinc-300 font-mono">
                  ${(summary.expenses.byCategory.filter(c => c.categoria === 'Insumos/Taller' || c.categoria === 'Varios' || c.categoria === 'Repuestos').reduce((acc, c) => acc + c.total, 0)).toLocaleString('es-AR')}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: RESULTADO NETO FINAL (BOLSILLO) */}
        <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
          summary.finalNetPocketProfit >= 0
            ? 'bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border-emerald-500/40'
            : 'bg-gradient-to-br from-rose-950/40 via-zinc-900 to-zinc-900 border-rose-500/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              summary.finalNetPocketProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              <DollarSign className="w-3.5 h-3.5" />
              <span>Ganancia Neta Final</span>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
              summary.finalNetPocketProfit >= 0 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}>
              {summary.finalNetPocketProfit >= 0 ? 'Superávit' : 'Déficit'}
            </span>
          </div>

          <div className="mt-2.5">
            <span className="text-[11px] text-zinc-400 block">Limpia Real de Bolsillo:</span>
            <h3 className={`text-2xl font-black font-mono tracking-tight ${
              summary.finalNetPocketProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {summary.finalNetPocketProfit >= 0 ? '+' : ''}${summary.finalNetPocketProfit.toLocaleString('es-AR')}
            </h3>

            <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span>(Taller + Mostrador):</span>
                <strong className="text-zinc-200 font-mono">
                  +${(summary.repairsProfitability.netProfit + summary.salesProfitability.netProfit).toLocaleString('es-AR')}
                </strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Menos Gastos:</span>
                <strong className="text-rose-400 font-mono">
                  -${summary.operationalExpenses.toLocaleString('es-AR')}
                </strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Rendimiento Global:</span>
                <strong className={`font-mono ${summary.finalNetPocketProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {summary.income.total > 0 ? ((summary.finalNetPocketProfit / summary.income.total) * 100).toFixed(1) : 0}%
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 3. TABLA DE REPARACIONES ENTREGADAS EN ESTE PERÍODO          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/90 border-zinc-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#FF5500]" />
            <h4 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-zinc-100'}`}>
              Reparaciones Entregadas en este Período ({filteredDeliveredRepairs.length})
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filtro Sólo sin costo cargado ($0) */}
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer select-none bg-zinc-800/50 border border-zinc-700/60 px-2.5 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={onlyZeroCostRepairs}
                onChange={(e) => setOnlyZeroCostRepairs(e.target.checked)}
                className="rounded border-zinc-700 text-[#FF5500] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
              />
              <span>⚠️ Ver sólo sin costo ($0)</span>
            </label>

            {/* Buscador de reparaciones */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950 border-zinc-700/80'
            }`}>
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                value={repairSearch}
                onChange={(e) => setRepairSearch(e.target.value)}
                placeholder="Buscar por orden, cliente, equipo..."
                className={`bg-transparent focus:outline-none w-48 ${isLight ? 'text-slate-800' : 'text-white'}`}
              />
              {repairSearch && (
                <button onClick={() => setRepairSearch('')} className="text-zinc-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabla Detallada de Reparaciones */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b ${isLight ? 'border-slate-200 bg-slate-50/50 text-slate-500' : 'border-zinc-800 bg-zinc-950/60 text-zinc-400'}`}>
                <th className="py-2.5 px-3 font-semibold">N° Orden & Fecha</th>
                <th className="py-2.5 px-3 font-semibold">Cliente & Equipo</th>
                <th className="py-2.5 px-3 font-semibold">Trabajo Realizado</th>
                <th className="py-2.5 px-3 font-semibold text-right">Cobrado ($)</th>
                <th className="py-2.5 px-3 font-semibold text-center">Costo Repuesto ($)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Utilidad Neta</th>
                <th className="py-2.5 px-3 font-semibold text-center">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {filteredDeliveredRepairs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-zinc-500">
                    <Wrench className="w-7 h-7 mx-auto mb-2 text-zinc-600 opacity-60" />
                    <p className="font-medium">No hay reparaciones entregadas en este período.</p>
                  </td>
                </tr>
              ) : (
                filteredDeliveredRepairs.map((ord) => {
                  const isEditingThis = inlineEditingOrderId === ord.id;
                  const fDate = ord.deliveredAt ? new Date(ord.deliveredAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) : '-';

                  return (
                    <tr 
                      key={ord.id}
                      className={`group transition-colors ${
                        isLight ? 'hover:bg-slate-50/80' : 'hover:bg-zinc-800/40'
                      }`}
                    >
                      {/* N° Orden y Fecha */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-[#FF5500]">{ord.orderNumber}</div>
                        <span className="text-[10px] text-zinc-500">{fDate}</span>
                      </td>

                      {/* Cliente & Equipo */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-zinc-200">{ord.clientName}</div>
                        <div className="text-[11px] text-zinc-400">{ord.deviceModel}</div>
                      </td>

                      {/* Falla / Trabajo */}
                      <td className="py-3 px-3">
                        <span className="text-zinc-300 block max-w-[200px] truncate" title={ord.issue}>
                          {ord.issue}
                        </span>
                      </td>

                      {/* Cobrado al Cliente */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                        ${ord.charged.toLocaleString('es-AR')}
                      </td>

                      {/* Costo de Repuesto (con alerta, edición in-line y buscador de proveedores) */}
                      <td className="py-3 px-3 text-center">
                        {isEditingThis ? (
                          <div className="flex items-center justify-center gap-1.5 animate-fadeIn">
                            <input
                              type="number"
                              value={inlinePartCost}
                              onChange={(e) => setInlinePartCost(e.target.value)}
                              placeholder="Costo"
                              className="w-20 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-white font-mono focus:border-[#FF5500] outline-hidden"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveInlinePartCost(ord.id)}
                              className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                              title="Guardar"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineEditingOrderId(null)}
                              className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            {ord.partCost === 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                                ⚠️ Sin costo ($0)
                              </span>
                            ) : (
                              <span className="font-mono font-semibold text-zinc-200">
                                ${ord.partCost.toLocaleString('es-AR')}
                              </span>
                            )}

                            {/* Botón lápiz edición rápida */}
                            <button
                              type="button"
                              onClick={() => {
                                setInlineEditingOrderId(ord.id);
                                setInlinePartCost(String(ord.partCost || ''));
                                setInlinePartSupplier(ord.partSupplier || '');
                              }}
                              className="p-1 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                              title="Editar costo manualmente"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>

                            {/* Botón Lupa Proveedores */}
                            <button
                              type="button"
                              onClick={() => handleOpenSearchForOrder(ord)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 hover:bg-[#FF5500] text-zinc-300 hover:text-white rounded-lg text-[10px] font-semibold transition-all cursor-pointer border border-zinc-700 hover:border-[#FF5500]"
                              title="Buscar costo en proveedores (SmartSupply, CellStore, etc.)"
                            >
                              <Search className="w-2.5 h-2.5" />
                              <span>Buscar</span>
                            </button>
                          </div>
                        )}
                        {ord.partSupplier && !isEditingThis && (
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            Prov: {ord.partSupplier}
                          </div>
                        )}
                      </td>

                      {/* Utilidad Neta */}
                      <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                        <span className={ord.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          ${ord.netProfit.toLocaleString('es-AR')}
                        </span>
                      </td>

                      {/* Margen % */}
                      <td className="py-3 px-3 text-center font-mono font-bold whitespace-nowrap">
                        <span className={`text-xs ${ord.marginPercent >= 50 ? 'text-emerald-400' : ord.marginPercent > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {ord.marginPercent}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 4. DESGLOSE DE CAJA POR MÉTODO DE PAGO & CATEGORÍAS GASTOS   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Desglose de Caja por Método de Pago */}
        <div className={`lg:col-span-2 p-5 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/90 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#FF5500]" />
              <h4 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                Disponibilidad de Caja por Vía de Cobro
              </h4>
            </div>
            <span className="text-xs text-zinc-400">
              {startDate} al {endDate}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Caja Efectivo */}
            <div className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950/60 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      Dinero en Efectivo
                    </h5>
                    <span className="text-[10px] text-zinc-400">Caja física de mostrador</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-base font-black font-mono ${
                    summary.cashBreakdown.cashOnHand >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    ${summary.cashBreakdown.cashOnHand.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800/80 text-xs flex justify-between text-zinc-400 font-mono">
                <span>🟢 Entradas: <strong>${summary.cashBreakdown.incomeCash.toLocaleString('es-AR')}</strong></span>
                <span>🔴 Salidas: <strong>${summary.cashBreakdown.expenseCash.toLocaleString('es-AR')}</strong></span>
              </div>
            </div>

            {/* Banco / Transferencia */}
            <div className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950/60 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      Banco / Transferencias
                    </h5>
                    <span className="text-[10px] text-zinc-400">Mercado Pago & Cuentas</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-base font-black font-mono ${
                    summary.cashBreakdown.bankBalance >= 0 ? 'text-sky-400' : 'text-rose-400'
                  }`}>
                    ${summary.cashBreakdown.bankBalance.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800/80 text-xs flex justify-between text-zinc-400 font-mono">
                <span>🟢 Entradas: <strong>${summary.cashBreakdown.incomeBank.toLocaleString('es-AR')}</strong></span>
                <span>🔴 Salidas: <strong>${summary.cashBreakdown.expenseBank.toLocaleString('es-AR')}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Desglose por Categoría */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/90 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-400" />
              <h4 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                Gastos por Categoría
              </h4>
            </div>
            <span className="text-xs text-zinc-400">
              {summary.expenses.byCategory.length} tipos
            </span>
          </div>

          {summary.expenses.byCategory.length === 0 ? (
            <div className="text-center py-6 text-zinc-500 text-xs">
              No hay gastos cargados en este período.
            </div>
          ) : (
            <div className="space-y-3">
              {summary.expenses.byCategory.map(catItem => {
                const catDef = EXPENSE_CATEGORIES.find(c => c.id === catItem.categoria) || { barColor: 'bg-zinc-400' };
                return (
                  <div key={catItem.categoria} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                        {catItem.categoria}
                      </span>
                      <span className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        ${catItem.total.toLocaleString('es-AR')} <span className="text-[10px] text-zinc-400 font-normal">({catItem.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800/60 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${catDef.barColor}`} 
                        style={{ width: `${catItem.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 5. TABLA DE HISTORIAL DE GASTOS CON FILTROS Y BÚSQUEDA       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/90 border-zinc-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#FF5500]" />
            <h4 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
              Detalle de Gastos del Período ({filteredExpenses.length})
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Buscador */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950 border-zinc-700/80'
            }`}>
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por concepto o nota..."
                className={`bg-transparent focus:outline-none w-44 ${isLight ? 'text-slate-800' : 'text-white'}`}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-zinc-400 hover:text-white cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtro por Categoría */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950 border-zinc-700/80'
            }`}>
              <Filter className="w-3 h-3 text-zinc-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={`bg-transparent focus:outline-none cursor-pointer ${isLight ? 'text-slate-800' : 'text-white'}`}
              >
                <option value="all" className="bg-zinc-900">Todas las categorías</option>
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id} className="bg-zinc-900">{c.label}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Método de Pago */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950 border-zinc-700/80'
            }`}>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className={`bg-transparent focus:outline-none cursor-pointer ${isLight ? 'text-slate-800' : 'text-white'}`}
              >
                <option value="all" className="bg-zinc-900">Todos los métodos</option>
                {PAYMENT_METHODS.map(m => (
                  <option key={m.id} value={m.id} className="bg-zinc-900">{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b ${isLight ? 'border-slate-200 bg-slate-50/50 text-slate-500' : 'border-zinc-800 bg-zinc-950/60 text-zinc-400'}`}>
                <th className="py-3 px-3 font-semibold">Fecha</th>
                <th className="py-3 px-3 font-semibold">Concepto / Descripción</th>
                <th className="py-3 px-3 font-semibold">Categoría</th>
                <th className="py-3 px-3 font-semibold">Método de Pago</th>
                <th className="py-3 px-3 font-semibold text-right">Monto</th>
                <th className="py-3 px-3 font-semibold text-center">Comprobante</th>
                <th className="py-3 px-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-zinc-500">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-zinc-600 opacity-60" />
                    <p className="font-medium">No se encontraron gastos en este período.</p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Usa el botón "Cargar Gasto" para registrar compras de insumos, alquiler o servicios.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(expense => {
                  const catDef = EXPENSE_CATEGORIES.find(c => c.id === expense.categoria) || { label: expense.categoria, color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' };
                  const fDate = expense.fecha ? new Date(expense.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

                  return (
                    <tr 
                      key={expense.id}
                      className={`group transition-colors ${
                        isLight ? 'hover:bg-slate-50/80' : 'hover:bg-zinc-800/40'
                      }`}
                    >
                      <td className="py-3 px-3 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                        {fDate}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                          <span>{expense.concepto || expense.descripcion}</span>
                        </div>
                        {expense.notas && (
                          <span className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                            {expense.notas}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catDef.color}`}>
                          {catDef.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-zinc-300">
                        {expense.metodo_pago || 'Efectivo'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right font-mono font-bold text-rose-400">
                        -${Number(expense.monto || 0).toLocaleString('es-AR')}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {expense.comprobante_url ? (
                          <button
                            onClick={() => setViewingReceiptUrl(expense.comprobante_url)}
                            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-all inline-flex items-center gap-1 text-[11px] px-2 cursor-pointer"
                            title="Ver imagen del comprobante"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                            <span>Ver</span>
                          </button>
                        ) : (
                          <span className="text-zinc-600 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                            title="Editar gasto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(expense.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Eliminar gasto"
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

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 6. MODAL DE CARGA / EDICIÓN DE GASTO                         */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {isNewExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-scaleIn ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#121218] border-zinc-800'
          }`}>
            {/* Header Modal */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'border-slate-100 bg-slate-50' : 'border-zinc-800 bg-zinc-900/50'
            }`}>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-500/15 text-[#FF5500] border border-orange-500/20">
                  <Receipt className="w-4 h-4" />
                </span>
                <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {editingExpense ? 'Editar Gasto Registrado' : 'Registrar Nuevo Gasto'}
                </h3>
              </div>
              <button 
                onClick={() => setIsNewExpenseModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Concepto */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Concepto / Descripción del Gasto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Alquiler Local Febrero, Módulo iPhone 13, Limpieza..."
                  value={formState.concepto}
                  onChange={(e) => setFormState({ ...formState, concepto: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#FF5500] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>

              {/* Monto y Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Monto ($ ARS) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-zinc-500">$</span>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={formState.monto}
                      onChange={(e) => setFormState({ ...formState, monto: e.target.value })}
                      className={`w-full pl-7 pr-3 py-2 text-xs rounded-xl border font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#FF5500] ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Fecha y Hora *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formState.fecha}
                    onChange={(e) => setFormState({ ...formState, fecha: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#FF5500] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Categoría y Método de Pago */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formState.categoria}
                    onChange={(e) => setFormState({ ...formState, categoria: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#FF5500] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Medio de Pago *
                  </label>
                  <select
                    value={formState.metodo_pago}
                    onChange={(e) => setFormState({ ...formState, metodo_pago: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#FF5500] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* URL Comprobante (Opcional) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Enlace de Comprobante / Ticket (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formState.comprobante_url}
                  onChange={(e) => setFormState({ ...formState, comprobante_url: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#FF5500] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Notas Adicionales (Opcional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Detalles sobre el proveedor, factura o número de transferencia..."
                  value={formState.notas}
                  onChange={(e) => setFormState({ ...formState, notas: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#FF5500] resize-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>

              {/* Footer Modal */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewExpenseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#FF5500] hover:bg-[#FF5500]/90 text-white shadow-lg shadow-orange-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Guardando...' : (editingExpense ? 'Actualizar Gasto' : 'Registrar Gasto')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 7. MODAL DE VISUALIZACIÓN DE COMPROBANTE                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {viewingReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Comprobante Adjunto</span>
              </h4>
              <button
                onClick={() => setViewingReceiptUrl(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center rounded-xl bg-zinc-950 p-2">
              <img 
                src={viewingReceiptUrl} 
                alt="Comprobante de Gasto" 
                className="max-w-full max-h-[65vh] object-contain rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/600x400/222/fff?text=Error+al+cargar+imagen';
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 8. MODAL DE CONFIRMACIÓN DE ELIMINACIÓN                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">¿Eliminar este gasto?</h4>
                <p className="text-xs text-zinc-400">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-600/30"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 9. MODAL DE BÚSQUEDA DE REPUESTOS EN PROVEEDORES             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {isPartCostModalOpen && costModalOrder && (
        <PartCostFinderModal
          isOpen={isPartCostModalOpen}
          onClose={() => {
            setIsPartCostModalOpen(false);
            setCostModalOrder(null);
          }}
          order={{
            id: costModalOrder.id,
            device: { model: costModalOrder.deviceModel },
            service: { requestedRepair: costModalOrder.issue, budgetTotal: costModalOrder.charged }
          }}
          currentCost={costModalOrder.partCost || 0}
          currentSupplier={costModalOrder.partSupplier || ''}
          currentPartName={costModalOrder.partName || ''}
          customerPrice={costModalOrder.charged || 0}
          onSelectPart={async (selectedData) => {
            if (costModalOrder?.id && updateOrderPartCost) {
              await updateOrderPartCost(costModalOrder.id, {
                partCost: selectedData.costPrice,
                partSupplier: selectedData.supplierName,
                partName: selectedData.partName
              });
            }
            setIsPartCostModalOpen(false);
            setCostModalOrder(null);
          }}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 10. VERSIÓN PARA IMPRIMIR EN A4 (VISIBLE SOLO AL IMPRIMIR)    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="hidden print:block print:p-8 bg-white text-black font-sans text-xs">
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">{businessConfig?.business?.fantasyName || 'MONTEC'}</h1>
            <p className="text-xs text-zinc-600">{businessConfig?.business?.legalName || 'Servicio Técnico Especializado'}</p>
            <p className="text-[10px] text-zinc-500">{businessConfig?.business?.address || 'Montes Carballo 943'} • Mar del Plata</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2 py-1 rounded">
              BALANCE FINANCIERO CONSOLIDADO
            </span>
            <h2 className="text-base font-black mt-2">
              {startDate} al {endDate}
            </h2>
            <p className="text-[10px] text-zinc-500 mt-1">
              Emisión: {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR')}
            </p>
          </div>
        </div>

        {/* Resumen Ejecutivo */}
        <div className="grid grid-cols-4 gap-3 mb-6 border border-black p-3 rounded">
          <div>
            <span className="text-[9px] uppercase font-bold text-zinc-600 block">UTILIDAD TALLER</span>
            <p className="text-base font-black text-black font-mono">
              ${summary.repairsProfitability.netProfit.toLocaleString('es-AR')}
            </p>
            <p className="text-[9px] text-zinc-600">
              Ingresos: ${summary.repairsProfitability.revenue.toLocaleString('es-AR')} | Costos: ${summary.repairsProfitability.partsCost.toLocaleString('es-AR')}
            </p>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-zinc-600 block">UTILIDAD MOSTRADOR</span>
            <p className="text-base font-black text-black font-mono">
              ${summary.salesProfitability.netProfit.toLocaleString('es-AR')}
            </p>
            <p className="text-[9px] text-zinc-600">
              Ventas: ${summary.salesProfitability.revenue.toLocaleString('es-AR')} | CMV: ${summary.salesProfitability.cogs.toLocaleString('es-AR')}
            </p>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-zinc-600 block">GASTOS OPERATIVOS</span>
            <p className="text-base font-black text-black font-mono">
              -${summary.operationalExpenses.toLocaleString('es-AR')}
            </p>
            <p className="text-[9px] text-zinc-600">
              {summary.expenses.count} comprobantes
            </p>
          </div>
          <div className="border-l border-zinc-400 pl-3">
            <span className="text-[9px] uppercase font-bold text-zinc-600 block">GANANCIA LIMPIA FINAL</span>
            <p className="text-lg font-black text-black font-mono">
              ${summary.finalNetPocketProfit.toLocaleString('es-AR')}
            </p>
            <p className="text-[9px] font-bold">
              {summary.finalNetPocketProfit >= 0 ? 'SUPERÁVIT' : 'DÉFICIT'}
            </p>
          </div>
        </div>

        {/* Detalle de Reparaciones Entregadas */}
        <div className="mb-4">
          <h3 className="text-xs font-black uppercase tracking-wider border-b border-black pb-1 mb-2">
            Reparaciones Entregadas en el Período ({summary.repairsProfitability.deliveredOrders.length})
          </h3>
          <table className="w-full text-left text-[9px] border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="py-1">Orden</th>
                <th className="py-1">Cliente & Modelo</th>
                <th className="py-1">Falla</th>
                <th className="py-1 text-right">Cobrado</th>
                <th className="py-1 text-right">Costo Repuesto</th>
                <th className="py-1 text-right">Ganancia Neta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-300">
              {summary.repairsProfitability.deliveredOrders.map(ord => (
                <tr key={ord.id}>
                  <td className="py-1 font-mono font-bold">{ord.orderNumber}</td>
                  <td className="py-1">{ord.clientName} - {ord.deviceModel}</td>
                  <td className="py-1">{ord.issue}</td>
                  <td className="py-1 text-right font-mono">${ord.charged.toLocaleString('es-AR')}</td>
                  <td className="py-1 text-right font-mono">${ord.partCost.toLocaleString('es-AR')}</td>
                  <td className="py-1 text-right font-mono font-bold">${ord.netProfit.toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detalle de Gastos */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider border-b border-black pb-1 mb-2">
            Detalle de Gastos del Período ({filteredExpenses.length})
          </h3>
          <table className="w-full text-left text-[9px] border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="py-1">Fecha</th>
                <th className="py-1">Concepto</th>
                <th className="py-1">Categoría</th>
                <th className="py-1">Método</th>
                <th className="py-1 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-300">
              {filteredExpenses.map(g => (
                <tr key={g.id}>
                  <td className="py-1">{g.fecha ? new Date(g.fecha).toLocaleDateString('es-AR') : ''}</td>
                  <td className="py-1 font-semibold">{g.concepto || g.descripcion}</td>
                  <td className="py-1">{g.categoria}</td>
                  <td className="py-1">{g.metodo_pago}</td>
                  <td className="py-1 text-right font-bold font-mono">${Number(g.monto || 0).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
