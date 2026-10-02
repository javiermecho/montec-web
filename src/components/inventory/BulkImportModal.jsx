import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  RefreshCw, 
  Table, 
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { ACCESSORIES_CATEGORIES } from '../../data/accessoriesData';

/**
 * Normaliza nombres de columnas para detección automática
 */
function normalizeHeader(header) {
  return String(header || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita acentos
    .replace(/[^a-z0-9]/g, ''); // Quita caracteres especiales
}

/**
 * Parser de CSV / TSV robusto compatible con saltos de línea y comillas
 */
function parseDelimitedText(text) {
  if (!text || !text.trim()) return [];

  // Detección automática del separador mirando las primeras líneas
  const firstLine = text.trim().split(/\r\n|\n|\r/)[0] || '';
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = ';';
  else if (firstLine.includes('|')) delimiter = '|';

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // Saltar comilla escapada
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Limpia y convierte texto de precio/costo a número
 */
function parsePrice(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let str = String(val).trim().replace(/[$a-zA-Z\s]/g, '');
  // Formato argentino/español con punto de miles y coma decimal: "15.000,50" -> "15000.50"
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num);
}

export default function BulkImportModal({ isOpen, onClose, onImportSuccess, panelTheme = 'dark' }) {
  const isLight = panelTheme === 'light';
  
  // Tabs: 'csv', 'sheets', 'paste', 'template'
  const [activeTab, setActiveTab] = useState('sheets');
  const [step, setStep] = useState(1); // 1: Carga, 2: Vista previa, 3: Confirmado

  // Entradas de usuario
  const [sheetUrl, setSheetUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  
  // Estado de procesamiento
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [parsedProducts, setParsedProducts] = useState([]);
  const [detectedColumns, setDetectedColumns] = useState({});
  const [importSummary, setImportSummary] = useState(null);

  // Opciones de importación
  const [duplicateMode, setDuplicateMode] = useState('update_or_add'); // 'update_or_add' | 'add_only' | 'replace_all'
  const [autoVisibleWeb, setAutoVisibleWeb] = useState(true);
  const [defaultCategory, setDefaultCategory] = useState('Varios');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Extraer ID y GID de Google Sheets y transformar a URL CSV
  const extractGoogleSheetsCsvUrl = (url) => {
    try {
      const trimmed = url.trim();
      // Si ya es un enlace de exportación CSV
      if (trimmed.includes('/export?format=csv') || trimmed.includes('/gviz/tq?tqx=out:csv')) {
        return trimmed;
      }

      // Si es un enlace normal de Google Sheets:
      // https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
      const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        const sheetId = match[1];
        // Buscar GID si existe
        const gidMatch = trimmed.match(/gid=([0-9]+)/);
        const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '&gid=0';
        return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}`;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Mapear encabezados y construir productos
  const processRowsToProducts = (rows) => {
    if (!rows || rows.length < 2) {
      throw new Error('El archivo no contiene suficientes filas o encabezados para importar.');
    }

    const headers = rows[0].map(h => normalizeHeader(h));
    const rawHeaders = rows[0];

    // Detectar índices de columnas conocidas
    const colIndex = {
      name: headers.findIndex(h => ['nombre', 'producto', 'name', 'descripcion', 'articulo', 'item', 'titulo'].includes(h)),
      category: headers.findIndex(h => ['categoria', 'category', 'rubro', 'tipo', 'familia'].includes(h)),
      sku: headers.findIndex(h => ['sku', 'codigo', 'cod', 'code', 'id', 'ref'].includes(h)),
      barcode: headers.findIndex(h => ['barcode', 'codigobarras', 'codigodebarras', 'ean', 'upc'].includes(h)),
      costPrice: headers.findIndex(h => ['costo', 'preciocosto', 'cost', 'costprice', 'preciodecosto', 'compra'].includes(h)),
      price: headers.findIndex(h => ['precio', 'precioventa', 'price', 'pvp', 'venta', 'retail'].includes(h)),
      stock: headers.findIndex(h => ['stock', 'cantidad', 'qty', 'unidades', 'cant', 'existencia'].includes(h)),
      minStock: headers.findIndex(h => ['minstock', 'stockminimo', 'minimo', 'alertastock'].includes(h)),
      compatible: headers.findIndex(h => ['compatible', 'compatibilidad', 'modelos', 'marcas', 'dispositivos'].includes(h)),
      image: headers.findIndex(h => ['imagen', 'image', 'foto', 'url', 'urlimagen', 'fotourl'].includes(h)),
      visibleInWeb: headers.findIndex(h => ['visible', 'web', 'visibleweb', 'publicar', 'visibleenweb'].includes(h)),
      badge: headers.findIndex(h => ['badge', 'etiqueta', 'destacado', 'estado'].includes(h)),
      features: headers.findIndex(h => ['caracteristicas', 'features', 'detalles', 'notas'].includes(h))
    };

    setDetectedColumns({
      name: colIndex.name !== -1 ? rawHeaders[colIndex.name] : null,
      price: colIndex.price !== -1 ? rawHeaders[colIndex.price] : null,
      stock: colIndex.stock !== -1 ? rawHeaders[colIndex.stock] : null,
      sku: colIndex.sku !== -1 ? rawHeaders[colIndex.sku] : null,
      category: colIndex.category !== -1 ? rawHeaders[colIndex.category] : null
    });

    if (colIndex.name === -1 && colIndex.price === -1) {
      throw new Error('No se encontraron columnas obligatorias (como "Nombre" o "Precio"). Revisá la plantilla de ejemplo.');
    }

    const products = [];
    const dataRows = rows.slice(1);

    dataRows.forEach((row, idx) => {
      // Ignorar filas totalmente vacías
      if (!row || row.every(cell => !cell || !cell.trim())) return;

      const name = colIndex.name !== -1 && row[colIndex.name] ? row[colIndex.name].trim() : `Producto sin nombre ${idx + 1}`;
      const category = colIndex.category !== -1 && row[colIndex.category] ? row[colIndex.category].trim() : defaultCategory;
      const sku = colIndex.sku !== -1 && row[colIndex.sku] ? row[colIndex.sku].trim() : `SKU-${Date.now().toString().slice(-4)}-${idx + 1}`;
      const barcode = colIndex.barcode !== -1 && row[colIndex.barcode] ? row[colIndex.barcode].trim() : sku;
      
      const costPrice = colIndex.costPrice !== -1 ? parsePrice(row[colIndex.costPrice]) : 0;
      let price = colIndex.price !== -1 ? parsePrice(row[colIndex.price]) : 0;
      if (price <= 0 && costPrice > 0) {
        price = Math.round(costPrice * 1.5); // Sugerir margen 50% si solo vino costo
      }

      const stockVal = colIndex.stock !== -1 ? parseInt(row[colIndex.stock], 10) : 10;
      const stock = !isNaN(stockVal) && stockVal >= 0 ? stockVal : 10;

      const minStockVal = colIndex.minStock !== -1 ? parseInt(row[colIndex.minStock], 10) : 3;
      const minStock = !isNaN(minStockVal) && minStockVal >= 0 ? minStockVal : 3;

      const compatible = colIndex.compatible !== -1 && row[colIndex.compatible] ? row[colIndex.compatible].trim() : 'Universal';
      const image = colIndex.image !== -1 && row[colIndex.image] ? row[colIndex.image].trim() : '';
      
      let visibleInWeb = autoVisibleWeb;
      if (colIndex.visibleInWeb !== -1 && row[colIndex.visibleInWeb]) {
        const val = row[colIndex.visibleInWeb].toLowerCase();
        visibleInWeb = ['si', 'yes', 'true', '1', 'v'].includes(val);
      }

      const badge = colIndex.badge !== -1 && row[colIndex.badge] ? row[colIndex.badge].trim() : 'Disponible';
      const features = colIndex.features !== -1 && row[colIndex.features] 
        ? row[colIndex.features].split(/[\n,;]/).map(s => s.trim()).filter(Boolean)
        : [];

      products.push({
        id: `bulk_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        category,
        sku,
        barcode,
        compatible,
        costPrice,
        price,
        stock,
        minStock,
        image,
        visibleInWeb,
        badge,
        features
      });
    });

    if (products.length === 0) {
      throw new Error('No se detectaron productos válidos en el archivo proporcionado.');
    }

    setParsedProducts(products);
    setStep(2); // Pasar a vista previa
  };

  // Manejar carga desde Google Sheets
  const handleLoadGoogleSheet = async () => {
    setErrorMessage('');
    if (!sheetUrl.trim()) {
      setErrorMessage('Por favor ingresá el enlace de tu Google Sheet.');
      return;
    }

    const csvUrl = extractGoogleSheetsCsvUrl(sheetUrl);
    if (!csvUrl) {
      setErrorMessage('El enlace no parece ser un archivo válido de Google Sheets. Asegurate de que empiece con https://docs.google.com/spreadsheets/d/...');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error('No se pudo acceder a la hoja. Verificá que esté configurada como pública o compartida con "Cualquier persona con el enlace".');
      }
      const text = await response.text();
      const rows = parseDelimitedText(text);
      processRowsToProducts(rows);
    } catch (err) {
      setErrorMessage(
        `${err.message}. Si el enlace está protegido por permisos de Google, podés abrir la hoja, seleccionar todas las celdas (Ctrl+A), copiarlas (Ctrl+C) y pegarlas en la pestaña "Pegar Datos".`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar archivo CSV / TSV seleccionado localmente
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setFileName(file.name);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const rows = parseDelimitedText(text);
        processRowsToProducts(rows);
      } catch (err) {
        setErrorMessage(err.message || 'Error al procesar el archivo CSV.');
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('No se pudo leer el archivo seleccionado.');
      setIsLoading(false);
    };

    reader.readAsText(file, 'UTF-8');
  };

  // Manejar texto pegado directamente de Google Sheets o Excel
  const handleProcessPastedText = () => {
    setErrorMessage('');
    if (!pastedText.trim()) {
      setErrorMessage('Por favor pegá el contenido de tu planilla en el cuadro de texto.');
      return;
    }

    try {
      const rows = parseDelimitedText(pastedText);
      processRowsToProducts(rows);
    } catch (err) {
      setErrorMessage(err.message || 'Error al parsear el texto pegado.');
    }
  };

  // Confirmar e importar al contexto de datos
  const handleConfirmImport = async () => {
    if (parsedProducts.length === 0) return;

    setIsLoading(true);
    try {
      if (onImportSuccess) {
        const result = await onImportSuccess(parsedProducts, { mode: duplicateMode });
        setImportSummary(result || { total: parsedProducts.length, added: parsedProducts.length, updated: 0 });
      }
      setStep(3); // Paso final de éxito
    } catch (err) {
      setErrorMessage('Error al guardar los productos en el inventario: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Generar y descargar plantilla CSV modelo
  const handleDownloadTemplate = () => {
    const templateContent = [
      'Nombre,Categoria,SKU,CodigoDeBarras,Costo,Precio,Stock,StockMinimo,Compatibilidad,VisibleEnWeb,Etiqueta',
      'Cargador Rapido 20W USB-C,Cargadores & Fuentes,CARG-20W-PD,779123400101,8500,18500,15,4,"iPhone 11 al 16, Samsung",SI,Destacado',
      'Cable Lightning Reforzado 1m,Cables & Adaptadores,CAB-IPHONE-1M,779123400102,3200,8900,20,5,"Apple iPhone / iPad",SI,Disponible',
      'Modulo Pantalla iPhone 11 Incell,Repuestos & Modulos,MOD-IPH-11-INC,779123400103,24000,45000,8,2,"Apple iPhone 11",SI,En Oferta',
      'Bateria Alta Capacidad Moto G22,Baterias,BAT-MOTO-G22,779123400104,11500,26000,12,3,"Motorola Moto G22",SI,Disponible',
      'Funda Antishock Transparente,Fundas & Cases,FUN-S23-TRANS,779123400105,2800,7500,25,5,"Samsung Galaxy S23",SI,Disponible'
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_inventario_montec.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className={`relative w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden my-6 transition-all ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121215] border-zinc-800'
        }`}
      >
        {/* Cabecera del Modal */}
        <div className={`px-6 py-5 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-zinc-800 bg-zinc-950/60'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-lg sm:text-xl font-heading font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Carga Masiva de Productos
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20">
                  Google Sheets & CSV
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Importá tu catálogo, precios de costo, stock y compatibilidades en segundos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PASO 1: SELECCIÓN DEL ORIGEN DE DATOS */}
        {step === 1 && (
          <div className="p-6 space-y-6">
            
            {/* Navegación por Pestañas */}
            <div className={`flex rounded-2xl p-1.5 border gap-1 overflow-x-auto ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-zinc-900 border-zinc-800'
            }`}>
              <button
                type="button"
                onClick={() => { setActiveTab('sheets'); setErrorMessage(''); }}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sheets'
                    ? 'bg-[#FF5500] text-white shadow-md'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>Google Sheets</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('csv'); setErrorMessage(''); }}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'csv'
                    ? 'bg-[#FF5500] text-white shadow-md'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Archivo CSV / Excel</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('paste'); setErrorMessage(''); }}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-[#FF5500] text-white shadow-md'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Pegar Datos (Copiar/Pegar)</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('template'); setErrorMessage(''); }}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'template'
                    ? 'bg-[#FF5500] text-white shadow-md'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Plantilla Modelo</span>
              </button>
            </div>

            {/* Mensajes de Error */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* TAB 1: GOOGLE SHEETS */}
            {activeTab === 'sheets' && (
              <div className="space-y-5">
                <div className={`p-4 rounded-2xl border text-xs sm:text-sm ${
                  isLight ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <HelpCircle className="w-4 h-4" />
                    <span>¿Cómo cargar desde Google Sheets en 2 pasos?</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 ml-1 text-xs opacity-90">
                    <li>En tu Google Sheet, hacé clic en el botón verde <strong>Compartir</strong> (arriba a la derecha) y seleccioná <strong>"Cualquier persona con el enlace"</strong> (modo Lector).</li>
                    <li>Copiá el enlace del navegador y pegalo acá abajo. ¡Listo!</li>
                  </ol>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Enlace de tu planilla de Google Sheets
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                        <LinkIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="url"
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit?usp=sharing"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border focus:outline-none transition-all ${
                          isLight 
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#FF5500] focus:bg-white' 
                            : 'bg-zinc-900 border-zinc-800 text-white focus:border-[#FF5500] focus:bg-zinc-950'
                        }`}
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleLoadGoogleSheet}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Descargando...</span>
                        </>
                      ) : (
                        <>
                          <span>Conectar y Previsualizar</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ARCHIVO CSV LOCAL */}
            {activeTab === 'csv' && (
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv, .tsv, .txt"
                  className="hidden"
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                    isLight 
                      ? 'border-slate-300 hover:border-[#FF5500] bg-slate-50/50 hover:bg-slate-50' 
                      : 'border-zinc-800 hover:border-[#FF5500]/60 bg-zinc-900/40 hover:bg-zinc-900/80'
                  }`}
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FF5500]/10 text-[#FF5500] flex items-center justify-center mb-4">
                    <Upload className="w-7 h-7" />
                  </div>
                  
                  <h4 className={`text-base font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Hacé clic acá para seleccionar tu archivo CSV
                  </h4>
                  <p className={`text-xs max-w-sm mx-auto ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Formatos admitidos: .csv, .tsv o exportación de Excel separada por comas o punto y coma
                  </p>

                  {fileName && (
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{fileName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: PEGAR DATOS DIRECTAMENTE */}
            {activeTab === 'paste' && (
              <div className="space-y-4">
                <div className={`p-3 rounded-xl border text-xs ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}>
                  💡 <strong>Tip rápido:</strong> Podés abrir tu Excel o Google Sheets, seleccionar la tabla de productos, presionar <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono text-[10px]">Ctrl + C</kbd> y pegarlo acá con <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono text-[10px]">Ctrl + V</kbd>.
                </div>

                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Nombre\tCategoria\tSKU\tCosto\tPrecio\tStock\nCargador 20W\tCargadores\tCARG-20W\t8500\t18500\t15\nFunda Silicona\tFundas\tFUN-SIL\t2000\t6000\t30`}
                  className={`w-full p-4 rounded-2xl font-mono text-xs border focus:outline-none transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#FF5500] focus:bg-white' 
                      : 'bg-zinc-900 border-zinc-800 text-white focus:border-[#FF5500] focus:bg-zinc-950'
                  }`}
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleProcessPastedText}
                    disabled={!pastedText.trim()}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <span>Procesar y Previsualizar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: PLANTILLA MODELO */}
            {activeTab === 'template' && (
              <div className="space-y-5">
                <div className={`p-5 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/60 border-zinc-800'
                }`}>
                  <h4 className={`text-sm font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Estructura recomendada de columnas:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-800">
                      <span className="font-bold text-[#FF5500]">Nombre</span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Nombre comercial del producto (Obligatorio)</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-800">
                      <span className="font-bold text-[#FF5500]">Precio</span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Precio de venta al público en ARS</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-800">
                      <span className="font-bold text-[#FF5500]">Costo</span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Costo de reposición (para calcular ganancias)</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-800">
                      <span className="font-bold text-[#FF5500]">Stock</span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Cantidad física en inventario</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-800">
                      <span className="font-bold text-[#FF5500]">SKU / Código</span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Código único (se autogenera si falta)</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-800">
                      <span className="font-bold text-[#FF5500]">Categoria</span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Cargadores, Cables, Fundas, etc.</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-zinc-400">
                        Descargá la plantilla oficial con ejemplos listos para abrir en Excel o Google Sheets.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 hover:border-[#FF5500]/50 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-4 h-4 text-[#FF5500]" />
                      <span>Descargar Plantilla CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* PASO 2: VISTA PREVIA Y VALIDACIÓN */}
        {step === 2 && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">Vista Previa de Importación</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    {parsedProducts.length} productos detectados
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Verificá que los datos se hayan mapeado correctamente antes de guardarlos en el sistema
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-zinc-400 hover:text-white underline self-start sm:self-auto cursor-pointer"
              >
                ← Cargar otro archivo
              </button>
            </div>

            {/* Opciones de Importación */}
            <div className={`p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/60 border-zinc-800'
            }`}>
              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">
                  Si un producto ya existe (mismo SKU o código):
                </label>
                <select
                  value={duplicateMode}
                  onChange={(e) => setDuplicateMode(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-950 border-zinc-700 text-white'
                  }`}
                >
                  <option value="update_or_add">Actualizar precio y stock (Recomendado)</option>
                  <option value="add_only">Omitir duplicados (solo agregar nuevos)</option>
                  <option value="replace_all">Reemplazar catálogo completo con esta lista</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer py-2">
                  <input
                    type="checkbox"
                    checked={autoVisibleWeb}
                    onChange={(e) => setAutoVisibleWeb(e.target.checked)}
                    className="w-4 h-4 rounded text-[#FF5500] focus:ring-[#FF5500] bg-zinc-900 border-zinc-700"
                  />
                  <span className="font-medium text-zinc-200">
                    Mostrar automáticamente en el catálogo web público de montec.ar
                  </span>
                </label>
              </div>
            </div>

            {/* Tabla de Muestra (Primeras 15 filas) */}
            <div className="border border-zinc-800 rounded-2xl overflow-hidden max-h-[340px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className={`sticky top-0 z-10 text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-slate-100 text-slate-700 border-b border-slate-200' : 'bg-zinc-950 text-zinc-400 border-b border-zinc-800'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3 text-right">Costo</th>
                    <th className="py-2.5 px-3 text-right">Precio Venta</th>
                    <th className="py-2.5 px-3 text-center">Stock</th>
                    <th className="py-2.5 px-3">Compatibilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {parsedProducts.slice(0, 15).map((p, i) => (
                    <tr key={i} className={`hover:bg-zinc-800/30 transition-colors ${
                      i % 2 === 0 ? 'bg-transparent' : isLight ? 'bg-slate-50/50' : 'bg-zinc-900/30'
                    }`}>
                      <td className="py-2 px-3 font-mono text-[11px] text-[#FF5500] font-semibold">{p.sku}</td>
                      <td className="py-2 px-3 font-medium text-white max-w-[200px] truncate">{p.name}</td>
                      <td className="py-2 px-3 text-zinc-400">{p.category}</td>
                      <td className="py-2 px-3 font-mono text-right text-zinc-400">
                        {p.costPrice > 0 ? `$${p.costPrice.toLocaleString('es-AR')}` : '-'}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-right text-emerald-400">
                        ${p.price.toLocaleString('es-AR')}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          p.stock > 0 ? 'bg-zinc-800 text-zinc-200' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-zinc-400 max-w-[150px] truncate">{p.compatible}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parsedProducts.length > 15 && (
              <p className="text-center text-[11px] text-zinc-500">
                Mostrando los primeros 15 de {parsedProducts.length} productos listos para importar.
              </p>
            )}

            {/* Acciones del Paso 2 */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Volver
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando {parsedProducts.length} productos...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar e Importar {parsedProducts.length} Productos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: RESUMEN DE ÉXITO */}
        {step === 3 && (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-heading font-black text-white">
                ¡Importación Masiva Completada con Éxito!
              </h3>
              <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
                Los productos se sincronizaron con el inventario del taller, el Punto de Venta (POS) y el catálogo online.
              </p>
            </div>

            {importSummary && (
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Procesados</span>
                  <div className="text-xl font-black font-mono text-white mt-0.5">{importSummary.total || parsedProducts.length}</div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Nuevos</span>
                  <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">{importSummary.added || 0}</div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] uppercase font-bold text-amber-400">Actualizados</span>
                  <div className="text-xl font-black font-mono text-amber-400 mt-0.5">{importSummary.updated || 0}</div>
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white font-bold text-sm shadow-[0_0_25px_rgba(255,85,0,0.4)] transition-all cursor-pointer"
              >
                Volver al Panel de Inventario
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
