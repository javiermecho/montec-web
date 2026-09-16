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
  Sparkles
} from 'lucide-react';
import { useData } from '../../context/DataContext';

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

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
];

export default function MonthlyBalanceTab() {
  const { 
    expenses = [], 
    addExpense, 
    updateExpense, 
    deleteExpense, 
    getMonthlyFinancialSummary, 
    panelTheme,
    businessConfig,
    serverStatus,
    refreshConnection
  } = useData();

  const isLight = panelTheme === 'light';

  // Período de balance seleccionado
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Filtros del historial de gastos
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');

  // Modales
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
    fecha: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    comprobante_url: '',
    notas: ''
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcular balance financiero mensual consolidado (reactivo)
  const summary = useMemo(() => {
    return getMonthlyFinancialSummary(selectedMonth, selectedYear);
  }, [getMonthlyFinancialSummary, selectedMonth, selectedYear]);

  // Lista de gastos filtrados para la tabla (con desduplicación inteligente)
  const filteredExpenses = useMemo(() => {
    const seen = new Set();
    const cleanList = [];

    (expenses || []).forEach(item => {
      if (!item) return;
      const d = item.fecha ? new Date(item.fecha) : (item.creado_en ? new Date(item.creado_en) : null);
      if (!d || isNaN(d.getTime())) return;

      const matchesPeriod = (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
      if (!matchesPeriod) return;

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
  }, [expenses, selectedMonth, selectedYear, filterCategory, filterPaymentMethod, searchQuery]);

  // Años disponibles para selector (desde 2024 hasta año actual + 1)
  const availableYears = useMemo(() => {
    const currentY = new Date().getFullYear();
    const years = [];
    for (let y = currentY + 1; y >= 2024; y--) {
      years.push(y);
    }
    return years;
  }, []);

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

  // Carga de archivo comprobante a Base64
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('La foto o comprobante no debe superar los 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormState(prev => ({ ...prev, comprobante_url: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Enviar formulario (Crear o Actualizar)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    const cleanConcepto = formState.concepto.trim();
    const cleanMonto = parseFloat(formState.monto);

    if (!cleanConcepto) {
      setFormError('Por favor ingresa un concepto o descripción del gasto.');
      return;
    }
    if (isNaN(cleanMonto) || cleanMonto <= 0) {
      setFormError('El monto debe ser un valor positivo mayor a $0.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingExpense) {
        updateExpense(editingExpense.id, {
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
    const monthName = MONTHS.find(m => m.value === selectedMonth)?.label || 'Mes';
    link.setAttribute("download", `montec_gastos_${monthName.toLowerCase()}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Imprimir reporte mensual consolidado en A4 / PDF
  const handlePrintReport = () => {
    window.print();
  };

  const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || 'Mes';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Barra Superior: Título, Selector de Período y Acciones Rápidas */}
      <div className={`p-5 rounded-2xl border transition-all duration-300 no-print ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800/80'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-[#FF5500] border border-orange-500/30">
                <Receipt className="w-5 h-5" />
              </span>
              <h2 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Gastos & Cierre de Mes (Balance)
              </h2>
            </div>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Control financiero de egresos, flujo de caja en efectivo vs. transferencias y balance neto mensual.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Selector de Mes */}
            <div className="flex items-center gap-1.5 bg-zinc-800/40 border border-zinc-700/60 rounded-xl px-2.5 py-1.5">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className={`bg-transparent text-sm font-semibold focus:outline-none cursor-pointer ${
                  isLight ? 'text-slate-800' : 'text-white'
                }`}
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value} className={isLight ? 'bg-white text-slate-900' : 'bg-zinc-900 text-white'}>
                    {m.label}
                  </option>
                ))}
              </select>

              {/* Selector de Año */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className={`bg-transparent text-sm font-semibold focus:outline-none cursor-pointer ml-1 ${
                  isLight ? 'text-slate-800' : 'text-white'
                }`}
              >
                {availableYears.map(y => (
                  <option key={y} value={y} className={isLight ? 'bg-white text-slate-900' : 'bg-zinc-900 text-white'}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón Mes Actual */}
            {(selectedMonth !== (currentDate.getMonth() + 1) || selectedYear !== currentDate.getFullYear()) && (
              <button
                onClick={() => {
                  setSelectedMonth(currentDate.getMonth() + 1);
                  setSelectedYear(currentDate.getFullYear());
                }}
                className={`text-xs px-2.5 py-2 rounded-xl font-medium transition-all ${
                  isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Mes Actual
              </button>
            )}

            {/* Botón Imprimir / PDF */}
            <button
              onClick={handlePrintReport}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' 
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
              }`}
              title="Imprimir o Guardar en PDF el Resumen de Cierre de Mes"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-400" />
              <span>Imprimir / PDF</span>
            </button>

            {/* Botón Exportar CSV */}
            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-[#FF5500] text-white hover:brightness-110 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Cargar Gasto</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Tarjetas de Resumen Financiero (KPIs del Cierre de Mes) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Ingresos */}
        <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800/80'
        }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
              🟢 Total Ingresos
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl lg:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              ${summary.income.total.toLocaleString('es-AR')}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
              <span>🔧 Taller: <strong className={isLight ? 'text-slate-700' : 'text-zinc-200'}>${summary.income.repairs.toLocaleString('es-AR')}</strong> ({summary.income.repairsCount})</span>
              <span>•</span>
              <span>🛍️ Ventas: <strong className={isLight ? 'text-slate-700' : 'text-zinc-200'}>${summary.income.sales.toLocaleString('es-AR')}</strong> ({summary.income.salesCount})</span>
            </div>
          </div>
        </div>

        {/* Total Gastos */}
        <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800/80'
        }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">
              🔴 Total Gastos
            </span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl lg:text-3xl font-black tracking-tight text-rose-500`}>
              -${summary.expenses.total.toLocaleString('es-AR')}
            </h3>
            <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
              <span>{summary.expenses.count} gasto{summary.expenses.count === 1 ? '' : 's'} registrado{summary.expenses.count === 1 ? '' : 's'}</span>
              <span>En {monthLabel} {selectedYear}</span>
            </div>
          </div>
        </div>

        {/* Balance Neto / Ganancia Real */}
        <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
          summary.netBalance >= 0
            ? (isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-gradient-to-br from-emerald-950/30 to-zinc-900 border-emerald-500/30')
            : (isLight ? 'bg-rose-50/50 border-rose-200' : 'bg-gradient-to-br from-rose-950/30 to-zinc-900 border-rose-500/30')
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              summary.netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              🔵 Balance Neto / Ganancia Real
            </span>
            <span className={`p-2 rounded-xl border ${
              summary.netBalance >= 0 
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}>
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl lg:text-3xl font-black tracking-tight ${
              summary.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {summary.netBalance >= 0 ? '+' : ''}${summary.netBalance.toLocaleString('es-AR')}
            </h3>
            <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
              <span>Margen Neto: <strong>{summary.income.total > 0 ? ((summary.netBalance / summary.income.total) * 100).toFixed(1) : 0}%</strong></span>
              <span className={`font-semibold ${summary.netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {summary.netBalance >= 0 ? 'Superávit / Ganancia' : 'Déficit'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Desglose de Caja (Efectivo en Mano vs. Banco / Transferencias) & Distribución de Gastos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda (2 cols): Desglose de Canales de Caja */}
        <div className={`lg:col-span-2 p-5 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800/80'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#FF5500]" />
              <h4 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                Desglose de Caja por Método de Pago
              </h4>
            </div>
            <span className="text-xs text-zinc-400">
              {monthLabel} {selectedYear}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Caja Efectivo */}
            <div className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-800/40 border-zinc-700/60'
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
                    <span className="text-[10px] text-zinc-400">Caja física del local</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-base font-black ${
                    summary.cashBreakdown.cashOnHand >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    ${summary.cashBreakdown.cashOnHand.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-700/30 text-xs flex justify-between text-zinc-400">
                <span>🟢 Entradas: <strong>${summary.cashBreakdown.incomeCash.toLocaleString('es-AR')}</strong></span>
                <span>🔴 Salidas: <strong>${summary.cashBreakdown.expenseCash.toLocaleString('es-AR')}</strong></span>
              </div>
            </div>

            {/* Banco / Transferencia */}
            <div className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-800/40 border-zinc-700/60'
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
                  <span className={`text-base font-black ${
                    summary.cashBreakdown.bankBalance >= 0 ? 'text-sky-400' : 'text-rose-400'
                  }`}>
                    ${summary.cashBreakdown.bankBalance.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-700/30 text-xs flex justify-between text-zinc-400">
                <span>🟢 Entradas: <strong>${summary.cashBreakdown.incomeBank.toLocaleString('es-AR')}</strong></span>
                <span>🔴 Salidas: <strong>${summary.cashBreakdown.expenseBank.toLocaleString('es-AR')}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha (1 col): Desglose por Categoría */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800/80'
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
              No hay gastos cargados en {monthLabel} {selectedYear}.
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
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
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

      {/* 4. Tabla de Historial de Gastos con Filtros y Búsqueda */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800/80'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#FF5500]" />
            <h4 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
              Detalle de Gastos del Mes ({filteredExpenses.length})
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Buscador */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-800/40 border-zinc-700/60'
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
                <button onClick={() => setSearchQuery('')} className="text-zinc-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtro por Categoría */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-800/40 border-zinc-700/60'
            }`}>
              <Filter className="w-3 h-3 text-zinc-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={`bg-transparent focus:outline-none cursor-pointer ${isLight ? 'text-slate-800' : 'text-white'}`}
              >
                <option value="all" className={isLight ? 'bg-white' : 'bg-zinc-900'}>Todas las categorías</option>
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id} className={isLight ? 'bg-white' : 'bg-zinc-900'}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Método de Pago */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-800/40 border-zinc-700/60'
            }`}>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className={`bg-transparent focus:outline-none cursor-pointer ${isLight ? 'text-slate-800' : 'text-white'}`}
              >
                <option value="all" className={isLight ? 'bg-white' : 'bg-zinc-900'}>Todos los métodos</option>
                {PAYMENT_METHODS.map(m => (
                  <option key={m.id} value={m.id} className={isLight ? 'bg-white' : 'bg-zinc-900'}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b ${isLight ? 'border-slate-200 bg-slate-50/50 text-slate-500' : 'border-zinc-800 bg-zinc-800/30 text-zinc-400'}`}>
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
                            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-all inline-flex items-center gap-1 text-[11px] px-2"
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
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                            title="Editar gasto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(expense.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 transition-colors"
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

      {/* 5. MODAL DE CARGA / EDICIÓN DE GASTO */}
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
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
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

              {/* Concepto / Descripción */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Concepto / Descripción del Gasto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Insumos de taller, estaño y flux / Alquiler local / Luz"
                  value={formState.concepto}
                  onChange={(e) => setFormState(prev => ({ ...prev, concepto: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5500]/50 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>

              {/* Monto & Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Monto ($ ARS) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-500 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      required
                      min="1"
                      placeholder="0.00"
                      value={formState.monto}
                      onChange={(e) => setFormState(prev => ({ ...prev, monto: e.target.value }))}
                      className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FF5500]/50 ${
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
                    onChange={(e) => setFormState(prev => ({ ...prev, fecha: e.target.value }))}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5500]/50 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Categoría & Método de Pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formState.categoria}
                    onChange={(e) => setFormState(prev => ({ ...prev, categoria: e.target.value }))}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF5500]/50 cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id} className={isLight ? 'bg-white' : 'bg-zinc-900'}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Método de Pago *
                  </label>
                  <select
                    value={formState.metodo_pago}
                    onChange={(e) => setFormState(prev => ({ ...prev, metodo_pago: e.target.value }))}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF5500]/50 cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m.id} value={m.id} className={isLight ? 'bg-white' : 'bg-zinc-900'}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comprobante / Foto (Opcional) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Foto o Factura / Comprobante (Opcional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="gasto-comprobante-input"
                  />
                  <label
                    htmlFor="gasto-comprobante-input"
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                      isLight 
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                        : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{formState.comprobante_url ? 'Cambiar archivo' : 'Adjuntar ticket / factura'}</span>
                  </label>

                  {formState.comprobante_url && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Adjunto cargado
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormState(prev => ({ ...prev, comprobante_url: '' }))}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas Internas */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Notas Adicionales (Proveedor, factura N°, etc.)
                </label>
                <textarea
                  rows="2"
                  placeholder="Detalles sobre la compra o el gasto..."
                  value={formState.notas}
                  onChange={(e) => setFormState(prev => ({ ...prev, notas: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5500]/50 resize-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewExpenseModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-[#FF5500] text-white hover:brightness-110 shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : (editingExpense ? 'Actualizar Gasto' : 'Registrar Gasto')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL PARA VER COMPROBANTE EN TAMAÑO COMPLETO */}
      {viewingReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-4">
            <button
              onClick={() => setViewingReceiptUrl(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>Comprobante o Factura Adjunta</span>
            </h4>
            <div className="max-h-[80vh] overflow-auto flex items-center justify-center bg-black/50 rounded-xl p-2">
              <img 
                src={viewingReceiptUrl} 
                alt="Comprobante de gasto" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-sm p-5 rounded-2xl border shadow-2xl animate-scaleIn ${
            isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <h4 className={`text-base font-bold mb-2 flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <Trash2 className="w-5 h-5 text-rose-500" />
              <span>¿Eliminar este gasto?</span>
            </h4>
            <p className="text-xs text-zinc-400 mb-4">
              Esta acción descontará el gasto del balance mensual y se borrará de los registros de forma definitiva.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. VISTA DE IMPRESIÓN OFICIAL (CIERRE DE MES EN FORMATO A4 / PDF) */}
      <div className="hidden print:block font-sans text-black p-8 max-w-4xl mx-auto bg-white">
        {/* Membrete Oficial */}
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider">
              {businessConfig?.business?.fantasyName || 'MONTEC'}
            </h1>
            <p className="text-xs font-semibold">
              {businessConfig?.business?.legalName || 'MONTEC SERVICIO TÉCNICO'} • CUIT: {businessConfig?.business?.cuit || '20-38492019-4'}
            </p>
            <p className="text-xs text-zinc-600">
              {businessConfig?.business?.address || 'Montes Carballo 943'}, {businessConfig?.business?.city || 'Mar del Plata'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2 py-1 rounded">
              CIERRE DE MES Y BALANCE
            </span>
            <h2 className="text-xl font-black mt-2 uppercase">
              {monthLabel} {selectedYear}
            </h2>
            <p className="text-[10px] text-zinc-500 mt-1">
              Fecha de emisión: {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR')}
            </p>
          </div>
        </div>

        {/* Resumen Principal */}
        <div className="grid grid-cols-3 gap-4 mb-6 border border-black p-4 rounded">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-600">TOTAL INGRESOS (VENTAS + TALLER)</span>
            <p className="text-xl font-black text-black">
              ${summary.income.total.toLocaleString('es-AR')}
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              Taller: ${summary.income.repairs.toLocaleString('es-AR')} • POS: ${summary.income.sales.toLocaleString('es-AR')}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-600">TOTAL GASTOS OPERATIVOS</span>
            <p className="text-xl font-black text-black">
              ${summary.expenses.total.toLocaleString('es-AR')}
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              {summary.expenses.count} comprobantes registrados
            </p>
          </div>
          <div className="border-l border-zinc-400 pl-4">
            <span className="text-[10px] uppercase font-bold text-zinc-600">BALANCE NETO / GANANCIA REAL</span>
            <p className="text-2xl font-black text-black">
              ${summary.netBalance.toLocaleString('es-AR')}
            </p>
            <p className="text-[10px] font-bold mt-0.5">
              {summary.netBalance >= 0 ? 'SUPERÁVIT MENSUAL' : 'DÉFICIT'}
            </p>
          </div>
        </div>

        {/* Flujo de Fondos */}
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider border-b border-black pb-1 mb-2">
            Disponibilidad de Fondos por Vía de Cobro
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="border p-2 rounded">
              <span className="font-bold">Efectivo en Caja Física:</span>
              <p className="text-base font-bold">${summary.cashBreakdown.cashOnHand.toLocaleString('es-AR')}</p>
              <p className="text-[10px] text-zinc-600">Ingresos: ${summary.cashBreakdown.incomeCash.toLocaleString('es-AR')} - Gastos: ${summary.cashBreakdown.expenseCash.toLocaleString('es-AR')}</p>
            </div>
            <div className="border p-2 rounded">
              <span className="font-bold">Banco & Transferencias (Digital):</span>
              <p className="text-base font-bold">${summary.cashBreakdown.bankBalance.toLocaleString('es-AR')}</p>
              <p className="text-[10px] text-zinc-600">Ingresos: ${summary.cashBreakdown.incomeBank.toLocaleString('es-AR')} - Gastos: ${summary.cashBreakdown.expenseBank.toLocaleString('es-AR')}</p>
            </div>
          </div>
        </div>

        {/* Tabla Detallada de Gastos */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider border-b border-black pb-1 mb-2">
            Detalle de Gastos y Egresos ({filteredExpenses.length})
          </h3>
          <table className="w-full text-left text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="py-1">Fecha</th>
                <th className="py-1">Concepto</th>
                <th className="py-1">Categoría</th>
                <th className="py-1">Método</th>
                <th className="py-1 text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-300">
              {filteredExpenses.map(g => (
                <tr key={g.id}>
                  <td className="py-1">{g.fecha ? new Date(g.fecha).toLocaleDateString('es-AR') : ''}</td>
                  <td className="py-1 font-semibold">{g.concepto || g.descripcion}</td>
                  <td className="py-1">{g.categoria}</td>
                  <td className="py-1">{g.metodo_pago}</td>
                  <td className="py-1 text-right font-bold">${Number(g.monto || 0).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
