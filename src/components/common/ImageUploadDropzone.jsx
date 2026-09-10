import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  X, 
  Camera, 
  RefreshCw, 
  Link as LinkIcon, 
  Check, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

/**
 * Utilidad de compresión y optimización de imágenes en el cliente
 * Redimensiona a un máximo de 1000px y convierte a WebP/JPEG optimizado
 */
export async function compressImageFile(file, maxWidth = 1000, maxHeight = 1000, quality = 0.82) {
  return new Promise((resolve, reject) => {
    // Si es SVG, preservar como texto o data URL sin procesar canvas
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ dataUrl: e.target.result, size: file.size, originalSize: file.size });
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calcular escala proporcional
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Suavizado de imagen
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Preferir WebP si el navegador lo soporta, fallback a JPEG
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        const estimatedSize = Math.round((dataUrl.length * 3) / 4);
        resolve({
          dataUrl,
          size: estimatedSize,
          originalSize: file.size,
          width,
          height
        });
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen para compresión'));
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageUploadDropzone({ 
  value, 
  onChange, 
  isLight = false,
  maxSizeMb = 5,
  label = "Foto del Producto / Accesorio"
}) {
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('data:') ? value : '');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  // Formato amigable de bytes
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Procesar archivo seleccionado
  const handleFileProcess = async (file) => {
    setErrorMessage('');
    if (!file) return;

    // Validación de tipo
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Solo se permiten archivos de imagen (JPG, PNG, WebP, GIF, SVG).');
      return;
    }

    // Validación de tamaño límite (antes de comprimir)
    if (file.size > maxSizeMb * 1024 * 1024) {
      setErrorMessage(`El archivo es demasiado pesado (máximo permitido: ${maxSizeMb} MB).`);
      return;
    }

    try {
      setIsProcessing(true);
      const result = await compressImageFile(file);
      setCompressionInfo({
        originalSize: result.originalSize,
        compressedSize: result.size,
        savedPercent: result.originalSize > 0 
          ? Math.max(0, Math.round(((result.originalSize - result.size) / result.originalSize) * 100))
          : 0
      });
      onChange(result.dataUrl);
    } catch (err) {
      console.error('Error procesando imagen:', err);
      setErrorMessage('Error al optimizar la imagen. Intenta con otra foto.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleClearImage = () => {
    onChange('');
    setUrlInput('');
    setCompressionInfo(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setCompressionInfo(null);
      setErrorMessage('');
    }
  };

  return (
    <div className="space-y-2 font-sans">
      {/* Encabezado con tabs */}
      <div className="flex items-center justify-between">
        <label className="block font-bold text-xs">
          {label}
        </label>
        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === 'upload' 
                ? 'bg-[#FF5500] text-white shadow-sm' 
                : isLight ? 'text-slate-600 hover:text-slate-900 bg-slate-100' : 'text-zinc-400 hover:text-white bg-zinc-800/80'
            }`}
          >
            Subir Archivo / Cámara
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === 'url' 
                ? 'bg-[#FF5500] text-white shadow-sm' 
                : isLight ? 'text-slate-600 hover:text-slate-900 bg-slate-100' : 'text-zinc-400 hover:text-white bg-zinc-800/80'
            }`}
          >
            URL Web
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* VISTA 1: IMAGEN YA SELECCIONADA (PREVIEW) */}
      {value ? (
        <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 transition-all ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950/60 border-zinc-800'
        }`}>
          {/* Contenedor de la foto */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-black/40 border border-zinc-700/60 shrink-0 flex items-center justify-center group shadow-inner">
            <img 
              src={value} 
              alt="Previsualización de producto" 
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                e.target.style.display = 'none';
                setErrorMessage('No se pudo previsualizar la imagen (enlace inválido o bloqueado).');
              }}
            />
            {/* Badge de optimización */}
            {compressionInfo && (
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-emerald-400 font-bold border border-emerald-500/30">
                WebP OK
              </span>
            )}
          </div>

          {/* Información y botones de acción */}
          <div className="flex-1 space-y-2 text-center sm:text-left w-full">
            <div className="flex items-center justify-center sm:justify-between gap-2">
              <span className="font-bold text-xs text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Imagen cargada con éxito</span>
              </span>
            </div>

            {compressionInfo && (
              <p className={`text-[11px] font-mono leading-tight ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Optimizada: <strong className="text-zinc-200">{formatBytes(compressionInfo.compressedSize)}</strong> 
                {compressionInfo.savedPercent > 0 && (
                  <span className="text-emerald-400 ml-1">(-{compressionInfo.savedPercent}% de peso)</span>
                )}
              </p>
            )}

            {!compressionInfo && value.startsWith('http') && (
              <p className={`text-[11px] truncate max-w-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Fuente: <span className="font-mono text-zinc-300">{value}</span>
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl border border-zinc-700 hover:border-[#FF5500] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer bg-zinc-900 text-zinc-200 hover:text-white"
              >
                <RefreshCw className="w-3 h-3 text-[#FF5500]" />
                <span>Cambiar Foto</span>
              </button>

              <button
                type="button"
                onClick={handleClearImage}
                className="px-3 py-1.5 rounded-xl border border-rose-500/30 hover:border-rose-500 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer bg-rose-500/10 hover:bg-rose-500/20 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA 2: NO HAY IMAGEN (ZONA DE CARGA) */
        <div>
          {mode === 'upload' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center transition-all cursor-pointer select-none relative overflow-hidden ${
                isDragging 
                  ? 'border-[#FF5500] bg-[#FF5500]/10 scale-[1.01]' 
                  : isLight 
                    ? 'border-slate-300 hover:border-[#FF5500] bg-slate-50 hover:bg-slate-100/80 text-slate-600' 
                    : 'border-zinc-700/80 hover:border-[#FF5500]/60 bg-zinc-900/40 hover:bg-zinc-900/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-3 space-y-2">
                  <RefreshCw className="w-8 h-8 text-[#FF5500] animate-spin" />
                  <p className="font-bold text-xs text-white">Comprimiendo y optimizando foto...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF5500]/15 text-[#FF5500] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-zinc-200">
                      Arrastrá la foto acá o <span className="text-[#FF5500] underline underline-offset-2">hacé clic para seleccionar</span>
                    </p>
                    <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                      Desde celular: Usá la <strong className="text-zinc-300">Cámara</strong> o elegí de la <strong className="text-zinc-300">Galería</strong>. JPG, PNG o WebP hasta {maxSizeMb}MB
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 pt-1 text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                    <span className="flex items-center gap-1">
                      <Camera className="w-3 h-3 text-[#FF5500]" />
                      <span>Cámara Directa</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Compresión Automática</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* MODO URL EXTERNA */
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-300' : 'bg-zinc-900/50 border-zinc-700/80'
            }`}>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/... o enlace de proveedor"
                  className={`flex-1 border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF5500] font-mono ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  disabled={!urlInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] disabled:opacity-50 text-white font-bold text-xs transition-all cursor-pointer shrink-0 shadow-sm"
                >
                  Cargar URL
                </button>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                Pegá el enlace directo de una foto pública de internet para el producto.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Input de archivo oculto para disparar explorador / cámara nativa */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
        capture="environment"
        className="hidden"
      />
    </div>
  );
}
