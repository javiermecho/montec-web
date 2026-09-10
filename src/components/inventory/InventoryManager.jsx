import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Package, 
  Eye, 
  EyeOff, 
  DollarSign, 
  TrendingUp, 
  Boxes, 
  X, 
  Check, 
  AlertCircle,
  Barcode,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ACCESSORIES_CATEGORIES } from '../../data/accessoriesData';
import ImageUploadDropzone from '../common/ImageUploadDropzone';

export default function InventoryManager() {
  const { 
    inventory, 
    addProduct, 
    updateProduct, 
    updateProductStock, 
    deleteProduct, 
    panelTheme 
  } = useData();

  const isLight = panelTheme === 'light';

  // --- Estados de Búsqueda y Filtros ---
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low', 'out'

  // --- Estados de Modales ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Formulario de Producto
  const [formData, setFormData] = useState({
    name: '',
    category: 'Cargadores & Fuentes',
    sku: '',
    barcode: '',
    compatible: '',
    costPrice: '',
    price: '',
    stock: 10,
    minStock: 3,
    image: '',
    visibleInWeb: true,
    badge: 'Disponible',
    features: ''
  });

  // Filtrado de la tabla de inventario
  const filteredProducts = useMemo(() => {
    return inventory.filter(prod => {
      if (categoryFilter !== 'Todos' && prod.category !== categoryFilter) {
        return false;
      }

      if (stockFilter === 'low') {
        const min = prod.minStock ?? 3;
        if (prod.stock > min || prod.stock <= 0) return false;
      } else if (stockFilter === 'out') {
        if (prod.stock > 0) return false;
      }

      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase().trim();
        const matchName = (prod.name || '').toLowerCase().includes(q);
        const matchSku = (prod.sku || '').toLowerCase().includes(q);
        const matchBarcode = (prod.barcode || '').toLowerCase().includes(q);
        const matchCat = (prod.category || '').toLowerCase().includes(q);
        return matchName || matchSku || matchBarcode || matchCat;
      }

      return true;
    });
  }, [inventory, categoryFilter, stockFilter, searchTerm]);

  // Métricas financieras del inventario
  const metrics = useMemo(() => {
    let totalItemsCount = 0;
    let totalCostVal = 0;
    let totalRetailVal = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    inventory.forEach(p => {
      const qty = Number(p.stock) || 0;
      const cost = Number(p.costPrice) || 0;
      const price = Number(p.price) || 0;
      const min = p.minStock ?? 3;

      totalItemsCount += qty;
      totalCostVal += cost * qty;
      totalRetailVal += price * qty;

      if (qty <= 0) {
        outOfStockCount++;
      } else if (qty <= min) {
        lowStockCount++;
      }
    });

    return {
      totalProducts: inventory.length,
      totalUnits: totalItemsCount,
      totalCostVal,
      totalRetailVal,
      lowStockCount,
      outOfStockCount
    };
  }, [inventory]);

  // Abrir modal para crear
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Cargadores & Fuentes',
      sku: `PROD-${Date.now().toString().slice(-4)}`,
      barcode: '',
      compatible: '',
      costPrice: '',
      price: '',
      stock: 10,
      minStock: 3,
      image: '',
      visibleInWeb: true,
      badge: 'Disponible',
      features: ''
    });
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || 'Cargadores & Fuentes',
      sku: product.sku || '',
      barcode: product.barcode || '',
      compatible: product.compatible || '',
      costPrice: product.costPrice || '',
      price: product.price || '',
      stock: product.stock ?? 0,
      minStock: product.minStock ?? 3,
      image: product.image || '',
      visibleInWeb: product.visibleInWeb !== false,
      badge: product.badge || 'Disponible',
      features: Array.isArray(product.features) ? product.features.join('\n') : (product.features || '')
    });
    setIsModalOpen(true);
  };

  // Guardar formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      sku: formData.sku.trim(),
      barcode: formData.barcode.trim(),
      compatible: formData.compatible.trim(),
      costPrice: Number(formData.costPrice) || 0,
      price: Number(formData.price) || 0,
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 0,
      image: formData.image.trim(),
      visibleInWeb: Boolean(formData.visibleInWeb),
      badge: formData.badge.trim() || 'Disponible',
      features: formData.features.split('\n').filter(Boolean)
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }

    setIsModalOpen(false);
  };

  // Calcular margen en tiempo real
  const calcMargin = (cost, price) => {
    const c = Number(cost) || 0;
    const p = Number(price) || 0;
    if (p <= 0) return 0;
    return Math.round(((p - c) / p) * 100);
  };

  return (
    <div className="w-full space-y-6 font-sans animate-fade-in">
      
      {/* 1. ENCABEZADO Y BOTÓN NUEVO PRODUCTO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <h2 className={`text-xl sm:text-2xl font-heading font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Control de Inventario & Stock
            </h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}>
              {inventory.length} productos
            </span>
          </div>
          <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
            Gestión de costos, precios, alertas de stock mínimo y sincronización con el catálogo web público
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(255,85,0,0.35)] transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS GENERALES DE STOCK */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total unidades */}
        <div className={`p-4 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141417] border-zinc-800'
        }`}>
          <span className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
            Unidades en Stock
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-xl sm:text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {metrics.totalUnits}
            </span>
            <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
              ({metrics.totalProducts} ítems)
            </span>
          </div>
        </div>

        {/* Valor al Costo */}
        <div className={`p-4 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141417] border-zinc-800'
        }`}>
          <span className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
            Valoración al Costo
          </span>
          <div className="mt-1">
            <span className={`text-xl sm:text-2xl font-black font-mono ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
              ${metrics.totalCostVal.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {/* Valor de Venta Estimado */}
        <div className={`p-4 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141417] border-zinc-800'
        }`}>
          <span className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
            Valoración al Público
          </span>
          <div className="mt-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-500">
              ${metrics.totalRetailVal.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {/* Alertas de Stock Bajo / Agotado */}
        <div className={`p-4 rounded-2xl border transition-colors ${
          metrics.lowStockCount > 0 || metrics.outOfStockCount > 0
            ? (isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/20 border-amber-500/30')
            : (isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141417] border-zinc-800')
        }`}>
          <span className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
            Alertas de Reposición
          </span>
          <div className="flex items-center gap-3 mt-1 text-xs">
            {metrics.outOfStockCount > 0 && (
              <span className="font-bold text-rose-500 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5" />
                {metrics.outOfStockCount} agotados
              </span>
            )}
            {metrics.lowStockCount > 0 && (
              <span className="font-bold text-amber-500 flex items-center gap-1 font-mono">
                <AlertTriangle className="w-3.5 h-3.5" />
                {metrics.lowStockCount} bajos
              </span>
            )}
            {metrics.outOfStockCount === 0 && metrics.lowStockCount === 0 && (
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Stock 100% OK
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. BARRA DE HERRAMIENTAS Y BÚSQUEDA */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141417] border-zinc-800'
      }`}>
        <div className="relative flex-1 max-w-md">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-zinc-400'}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, SKU o código de barra..."
            className={`w-full border rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm outline-none focus:border-[#FF5500] ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
            }`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros de Categoría y Stock */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] font-semibold ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-zinc-200'
            }`}
          >
            {ACCESSORIES_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className={`border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] font-semibold ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-zinc-200'
            }`}
          >
            <option value="all">Todo el stock</option>
            <option value="low">Solo Stock Bajo</option>
            <option value="out">Solo Agotados</option>
          </select>
        </div>
      </div>

      {/* 4. TABLA COMPLETA DE PRODUCTOS */}
      <div className={`border rounded-2xl overflow-hidden shadow-xs ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#141417] border-zinc-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-zinc-900/80 border-zinc-800 text-zinc-400'
              }`}>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px]">Imagen</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px]">Producto & SKU</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px]">Categoría</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px] text-right">Costo ($)</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px] text-right">Venta ($)</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px] text-center">Margen</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px] text-center">Stock Actual</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px] text-center">Web</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px] text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/20">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500 italic">
                    No se encontraron productos registrados en el inventario.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const isOutOfStock = prod.stock <= 0;
                  const isLowStock = prod.stock > 0 && prod.stock <= (prod.minStock ?? 3);
                  const marginPct = calcMargin(prod.costPrice, prod.price);

                  return (
                    <tr 
                      key={prod.id}
                      className={`hover:bg-zinc-500/5 transition-colors ${
                        isOutOfStock ? (isLight ? 'bg-rose-50/20' : 'bg-rose-950/10') : ''
                      }`}
                    >
                      {/* Imagen con Click para ampliar */}
                      <td className="py-3 px-4 align-middle">
                        <div 
                          onClick={() => prod.image && setPreviewImage(prod.image)}
                          className={`w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0 ${
                            prod.image ? 'cursor-pointer hover:border-[#FF5500] hover:scale-105 transition-all shadow-sm group' : ''
                          }`}
                          title={prod.image ? 'Clic para ver foto ampliada' : 'Sin foto'}
                        >
                          {prod.image ? (
                            <img 
                              src={prod.image} 
                              alt={prod.name} 
                              className="w-full h-full object-cover group-hover:opacity-90"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.parentElement) {
                                  e.currentTarget.parentElement.innerHTML = '<span class="text-zinc-600 text-[10px] font-mono">IMG</span>';
                                }
                              }}
                            />
                          ) : (
                            <Package className="w-5 h-5 text-zinc-600" />
                          )}
                        </div>
                      </td>

                      {/* Nombre & SKU */}
                      <td className="py-3 px-4 align-middle">
                        <div className={`font-bold text-xs sm:text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {prod.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400 font-mono">
                          <span>SKU: {prod.sku || 'Sin SKU'}</span>
                          {prod.barcode && <span>• {prod.barcode}</span>}
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30">
                          {prod.category}
                        </span>
                      </td>

                      {/* Costo */}
                      <td className="py-3 px-4 align-middle text-right font-mono font-medium text-zinc-400 whitespace-nowrap">
                        ${Number(prod.costPrice || 0).toLocaleString('es-AR')}
                      </td>

                      {/* Venta */}
                      <td className="py-3 px-4 align-middle text-right font-mono font-bold text-emerald-500 text-sm whitespace-nowrap">
                        ${Number(prod.price || 0).toLocaleString('es-AR')}
                      </td>

                      {/* Margen % */}
                      <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                          marginPct >= 50 
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                            : marginPct >= 30 
                              ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        }`}>
                          {marginPct}%
                        </span>
                      </td>

                      {/* Stock Actual con control rápido */}
                      <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateProductStock(prod.id, -1, true)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer border ${
                              isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700'
                            }`}
                            title="Descontar 1 unidad"
                          >
                            -
                          </button>

                          <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold min-w-10 text-center ${
                            isOutOfStock
                              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                              : isLowStock
                                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                                : (isLight ? 'bg-slate-100 text-slate-800' : 'bg-zinc-800 text-zinc-100')
                          }`}>
                            {prod.stock}
                          </span>

                          <button
                            type="button"
                            onClick={() => updateProductStock(prod.id, 1, true)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer border ${
                              isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700'
                            }`}
                            title="Añadir 1 unidad"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Visible en Web */}
                      <td className="py-3 px-4 align-middle text-center">
                        <button
                          type="button"
                          onClick={() => updateProduct(prod.id, { visibleInWeb: !prod.visibleInWeb })}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                            prod.visibleInWeb !== false
                              ? 'text-emerald-500 hover:bg-emerald-500/10'
                              : 'text-zinc-500 hover:bg-zinc-800'
                          }`}
                          title={prod.visibleInWeb !== false ? 'Visible en catálogo público' : 'Oculto de la web'}
                        >
                          {prod.visibleInWeb !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(prod)}
                            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                              isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                            title="Editar producto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Eliminar definitivamente el producto "${prod.name}"?`)) {
                                deleteProduct(prod.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                            title="Eliminar producto"
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

      {/* 5. MODAL DE ALTA / EDICIÓN DE PRODUCTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
          <div className={`border rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#141417] border-zinc-800 text-white'
          }`}>
            
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h3 className="text-xl font-heading font-black">
                {editingProduct ? 'Editar Producto / Accesorio' : 'Nuevo Producto en Inventario'}
              </h3>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Completá los datos de stock, costos de proveedor y visibilidad en catálogo público
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Nombre y Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1">Nombre del Producto / Accesorio *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Cargador Rápido 20W Power Delivery USB-C"
                    className={`w-full border rounded-xl px-3 py-2 outline-none focus:border-[#FF5500] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 outline-none focus:border-[#FF5500] font-semibold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  >
                    {ACCESSORIES_CATEGORIES.filter(c => c !== 'Todos').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Distintivo / Badge</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="Ej: Más Vendido, Calidad Original, etc."
                    className={`w-full border rounded-xl px-3 py-2 outline-none focus:border-[#FF5500] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* SKU y Código de Barras */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">SKU / Código Interno</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Ej: CARG-20W-PD"
                    className={`w-full border rounded-xl px-3 py-2 font-mono uppercase outline-none focus:border-[#FF5500] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Código de Barras (EAN / Pistola USB)</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Escaneá con la pistola lectora..."
                    className={`w-full border rounded-xl px-3 py-2 font-mono outline-none focus:border-[#FF5500] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Precios y Margen en vivo */}
              <div className="p-3.5 rounded-2xl border bg-zinc-950/40 border-zinc-800/80 space-y-2">
                <span className="block font-bold uppercase text-[10px] tracking-wider text-[#FF5500]">
                  Estructura de Precios & Rentabilidad
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Costo Proveedor ($)</label>
                    <input
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      placeholder="$8500"
                      className={`w-full border rounded-xl px-3 py-2 font-mono font-bold outline-none focus:border-[#FF5500] ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Precio de Venta ($) *</label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="$18500"
                      className={`w-full border rounded-xl px-3 py-2 font-mono font-bold text-emerald-500 outline-none focus:border-emerald-500 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Margen Calculado</label>
                    <div className="py-2 px-3 rounded-xl border bg-zinc-900 border-zinc-700 font-mono font-bold text-center text-sm text-sky-400">
                      {calcMargin(formData.costPrice, formData.price)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Stocks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Stock Disponible *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 font-mono outline-none focus:border-[#FF5500] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Stock Mínimo (Alerta reposición)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 font-mono outline-none focus:border-[#FF5500] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Imagen del Producto (Dropzone, Cámara y Galería) */}
              <div className="pt-1">
                <ImageUploadDropzone
                  value={formData.image}
                  onChange={(img) => setFormData({ ...formData, image: img })}
                  isLight={isLight}
                  label="Foto del Producto / Accesorio (PC o Celular)"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Compatibilidad / Modelos que soporta</label>
                <input
                  type="text"
                  value={formData.compatible}
                  onChange={(e) => setFormData({ ...formData, compatible: e.target.value })}
                  placeholder="Ej: iPhone 11 al 16, Samsung Galaxy, Motorola..."
                  className={`w-full border rounded-xl px-3 py-2 outline-none focus:border-[#FF5500] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>

              {/* Visibilidad en Web Pública */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900 border-zinc-800'
              }`}>
                <div>
                  <div className="font-bold">Visible en el Catálogo Público de la Web</div>
                  <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Aparecerá en la sección de accesorios en montec.ar para consultas de clientes
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.visibleInWeb}
                  onChange={(e) => setFormData({ ...formData, visibleInWeb: e.target.checked })}
                  className="w-5 h-5 rounded text-[#FF5500] cursor-pointer"
                />
              </div>

              {/* Botón Guardar */}
              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl font-semibold cursor-pointer ${
                    isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FF5500] hover:bg-[#FF6600] text-white font-bold rounded-xl shadow-lg shadow-[#FF5500]/25 transition-all cursor-pointer"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. MODAL LIGHTBOX DE FOTO AMPLIADA */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in cursor-pointer font-sans"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[85vh] p-3 bg-[#141417] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-black/60 hover:bg-zinc-800 transition-colors cursor-pointer z-10"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewImage} 
              alt="Foto ampliada del producto" 
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl" 
            />
          </div>
        </div>
      )}

    </div>
  );
}
