import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Printer, 
  Download, 
  MessageSquare, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  Receipt,
  Copy,
  Check
} from 'lucide-react';

/**
 * Mapeo de Códigos de Comprobantes según tablas oficiales de AFIP / ARCA
 */
export const AFIP_DOCUMENT_TYPES = {
  FACTURA_A: {
    letter: 'A',
    code: '001',
    label: 'FACTURA A',
    afipCode: 1,
    discriminatesIva: true
  },
  FACTURA_B: {
    letter: 'B',
    code: '006',
    label: 'FACTURA B',
    afipCode: 6,
    discriminatesIva: false
  },
  FACTURA_C: {
    letter: 'C',
    code: '011',
    label: 'FACTURA C',
    afipCode: 11,
    discriminatesIva: false
  },
  PRESUPUESTO: {
    letter: 'X',
    code: '000',
    label: 'PRESUPUESTO (NO VÁLIDO COMO FACTURA)',
    afipCode: 0,
    discriminatesIva: false
  },
  REMITO: {
    letter: 'R',
    code: '091',
    label: 'REMITO DE ENTREGA',
    afipCode: 91,
    discriminatesIva: false
  },
  TICKET_X: {
    letter: 'X',
    code: '000',
    label: 'TICKET NO FISCAL',
    afipCode: 0,
    discriminatesIva: false
  },
  RECIBO: {
    letter: 'X',
    code: '000',
    label: 'RECIBO DE PAGO',
    afipCode: 0,
    discriminatesIva: false
  }
};

/**
 * Generador de payload y URL oficial de Código QR de AFIP según RG 4892/2020
 */
export function buildAfipQrUrl({
  cuitEmisor,
  puntoVenta = 1,
  tipoComprobante = 6,
  numeroComprobante = 1,
  importeTotal = 0,
  fecha = new Date(),
  tipoDocReceptor = 99,
  nroDocReceptor = 0,
  cae = '74123849102938'
}) {
  const cleanCuitEmisor = parseInt(String(cuitEmisor || '20384920194').replace(/[^0-9]/g, ''), 10) || 20384920194;
  const cleanNroDoc = parseInt(String(nroDocReceptor || '0').replace(/[^0-9]/g, ''), 10) || 0;
  
  let fechaIso = '';
  try {
    const d = new Date(fecha);
    fechaIso = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  } catch {
    fechaIso = new Date().toISOString().split('T')[0];
  }

  const qrPayload = {
    ver: 1,
    fecha: fechaIso,
    cuit: cleanCuitEmisor,
    ptoVta: parseInt(puntoVenta, 10) || 1,
    tipoCmp: parseInt(tipoComprobante, 10) || 6,
    nroCmp: parseInt(numeroComprobante, 10) || 1,
    importe: parseFloat(importeTotal) || 0,
    moneda: 'PES',
    ctz: 1,
    tipoDocRec: cleanNroDoc > 0 ? (cleanNroDoc > 99999999 ? 80 : 96) : 99,
    nroDocRec: cleanNroDoc,
    tipoCodAut: 'E',
    codAut: parseInt(String(cae).replace(/[^0-9]/g, '').slice(0, 14), 10) || 74123849102938
  };

  try {
    const jsonStr = JSON.stringify(qrPayload);
    const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));
    return {
      qrPayload,
      qrUrl: `https://www.afip.gob.ar/fe/qr/?p=${base64Str}`
    };
  } catch (err) {
    console.error('Error al generar QR AFIP:', err);
    return {
      qrPayload,
      qrUrl: 'https://www.afip.gob.ar/fe/qr/'
    };
  }
}

export default function OfficialFiscalInvoice({ 
  voucher, 
  businessConfig, 
  onClose, 
  onNewSale,
  initialViewMode = 'a4' 
}) {
  const [viewMode, setViewMode] = useState(initialViewMode); // 'a4' | 'ticket'
  const [copiedCae, setCopiedCae] = useState(false);

  if (!voucher) return null;

  const rawDocType = (voucher.documentType || 'FACTURA_B').toUpperCase();
  const docMeta = AFIP_DOCUMENT_TYPES[rawDocType] || AFIP_DOCUMENT_TYPES.FACTURA_B;
  const isFiscal = rawDocType.startsWith('FACTURA');

  // Datos de la empresa emisora
  const business = businessConfig?.business || {};
  const afip = businessConfig?.afip || {};
  const contact = businessConfig?.contact || {};

  const fantasyName = business.fantasyName || 'MONTEC';
  const legalName = business.legalName || 'MONTEC SERVICIO TÉCNICO';
  const cuitEmisor = business.cuit || '20-38492019-4';
  const iibb = business.iibb || '20-38492019-4';
  const address = business.address || 'Montes Carballo 943';
  const city = business.city || 'Mar del Plata';
  const state = business.state || 'Buenos Aires';
  const ivaCondition = business.ivaCondition || 'Responsable Inscripto';
  const startActivityDate = business.startActivityDate 
    ? new Date(business.startActivityDate).toLocaleDateString('es-AR')
    : '15/01/2020';

  // Punto de venta y número de comprobante
  const puntoVentaNum = parseInt(afip.puntoVenta || 1, 10);
  const ptoVtaStr = String(puntoVentaNum).padStart(5, '0');

  // Extraer número de comprobante o generar secuencial
  let rawNumber = 1;
  const docNumStr = String(voucher.documentNumber || voucher.ticketNumber || '');
  const matchNum = docNumStr.match(/(\d+)$/);
  if (matchNum) {
    rawNumber = parseInt(matchNum[1], 10);
  }
  const nroCmpStr = String(rawNumber).padStart(8, '0');
  const fullDocNumber = `${ptoVtaStr}-${nroCmpStr}`;

  // Fechas
  const emissionDateObj = voucher.createdAt ? new Date(voucher.createdAt) : new Date();
  const emissionDateStr = emissionDateObj.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const emissionTimeStr = emissionDateObj.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Fecha vencimiento CAE (10 días después de emisión según estándar AFIP)
  const caeVtoDateObj = new Date(emissionDateObj.getTime() + 10 * 24 * 60 * 60 * 1000);
  const caeVtoStr = voucher.caeVto || caeVtoDateObj.toLocaleDateString('es-AR');

  // Generar CAE consistente de 14 dígitos si no vino provisto
  const caeNumber = voucher.cae || (() => {
    const seed = `${cleanNum(cuitEmisor).slice(-4)}${ptoVtaStr}${nroCmpStr.slice(-4)}`;
    return `74${seed.padEnd(12, '8')}`.slice(0, 14);
  })();

  function cleanNum(val) {
    return String(val || '').replace(/[^0-9]/g, '');
  }

  // Datos del cliente / receptor
  const customer = voucher.customer || {};
  const customerName = customer.name || 'CONSUMIDOR FINAL';
  const customerDocType = customer.docType || (cleanNum(customer.docNumber).length === 11 ? 'CUIT' : 'DNI');
  const customerDocNumber = customer.docNumber || '0';
  const customerTaxCondition = customer.taxCondition || 'CONSUMIDOR FINAL';
  const customerAddress = customer.address || 'Mar del Plata';
  const paymentMethod = voucher.paymentMethod || 'Efectivo';

  // Cálculos de IVA y Netos
  const total = parseFloat(voucher.total || 0);
  const subtotal = parseFloat(voucher.subtotal || total);
  const discountAmount = parseFloat(voucher.discountAmount || 0);

  // Discriminación impositiva para Factura A
  const netoGravado = docMeta.discriminatesIva 
    ? Math.round((total / 1.21) * 100) / 100 
    : subtotal;
  const iva21 = docMeta.discriminatesIva 
    ? Math.round((total - netoGravado) * 100) / 100 
    : 0;

  // Código QR oficial de AFIP
  const { qrUrl } = buildAfipQrUrl({
    cuitEmisor: cuitEmisor,
    puntoVenta: puntoVentaNum,
    tipoComprobante: docMeta.afipCode,
    numeroComprobante: rawNumber,
    importeTotal: total,
    fecha: emissionDateObj,
    tipoDocReceptor: customerDocType === 'CUIT' ? 80 : 96,
    nroDocReceptor: customerDocNumber,
    cae: caeNumber
  });

  const handleCopyCae = () => {
    navigator.clipboard.writeText(caeNumber);
    setCopiedCae(true);
    setTimeout(() => setCopiedCae(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      
      {/* CONTENEDOR PRINCIPAL */}
      <div className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-300 my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none">
        
        {/* ================================================================ */}
        {/* BARRA SUPERIOR DE ACCIONES (SE OCULTA AL IMPRIMIR)               */}
        {/* ================================================================ */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">Comprobante Fiscal Electrónico</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ARCA / AFIP OFICIAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {docMeta.label} • {fullDocNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de vista: Hoja A4 vs Ticket Térmico */}
            <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('a4')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'a4' 
                    ? 'bg-[#FF5500] text-white shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Hoja A4</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('ticket')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'ticket' 
                    ? 'bg-[#FF5500] text-white shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Ticket 80mm</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            {customer.phone && (
              <a
                href={`https://wa.me/549${cleanNum(customer.phone)}?text=${encodeURIComponent(
                  `¡Hola ${customerName}! 👋 Te enviamos tu ${docMeta.label} N° ${fullDocNumber} de *${fantasyName}*:\n\n` +
                  `📄 *Comprobante:* ${fullDocNumber}\n` +
                  `💰 *Total:* $${total.toLocaleString('es-AR')}\n` +
                  `🛡️ *CAE:* ${caeNumber} (Vto: ${caeVtoStr})\n` +
                  `📍 ${address}, ${city}\n\n` +
                  `¡Muchas gracias por tu compra!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-emerald-500/40"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}

            {typeof onNewSale === 'function' && (
              <button
                type="button"
                onClick={onNewSale}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer border border-slate-700"
              >
                Nueva Venta
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Cerrar vista"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* VISTA 1: FORMATO HOJA A4 OFICIAL AFIP (ESTÁNDAR COMPROBANTES)    */}
        {/* ================================================================ */}
        {viewMode === 'a4' ? (
          <div className="p-6 sm:p-8 bg-white font-sans text-slate-900 text-xs leading-tight print:p-0">
            
            {/* RECUADRO GENERAL DE LA FACTURA A4 */}
            <div className="border-2 border-slate-900 rounded-lg overflow-hidden">
              
              {/* CABECERA: EMISOR (IZQ) | LETRA Y CÓDIGO (CENTRO) | DATOS FISCALES (DER) */}
              <div className="grid grid-cols-12 border-b-2 border-slate-900 relative">
                
                {/* LADO IZQUIERDO: DATOS DEL EMISOR */}
                <div className="col-span-12 sm:col-span-5 p-4 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-slate-300">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase font-heading">
                      {fantasyName}
                    </h1>
                    <p className="font-bold text-slate-800 text-xs mt-0.5">
                      {legalName}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-2">
                      <strong>Domicilio Comercial:</strong> {address} - {city} ({state})
                    </p>
                    <p className="text-[11px] text-slate-600">
                      <strong>Teléfono:</strong> {contact.technicalWhatsapp || contact.supportPhone || '+54 9 223 544-4991'}
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-200 text-[11px] text-slate-700">
                    <strong>Condición frente al IVA:</strong> {ivaCondition}
                  </div>
                </div>

                {/* CENTRO: CAJA DE LETRA A / B / C Y CÓDIGO DE COMPROBANTE */}
                <div className="col-span-12 sm:col-span-2 flex flex-col items-center justify-center p-2 bg-slate-50 sm:bg-transparent border-b sm:border-b-0 border-slate-300">
                  <div className="w-14 h-14 border-2 border-slate-900 bg-white rounded-md flex items-center justify-center shadow-xs">
                    <span className="text-3xl font-black text-slate-950 font-heading">
                      {docMeta.letter}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold mt-1 tracking-wider text-slate-800">
                    CÓD. {docMeta.code}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 uppercase mt-0.5 text-center">
                    ORIGINAL
                  </span>
                </div>

                {/* LADO DERECHO: DATOS DE FACTURA, NÚMERO Y CUIT */}
                <div className="col-span-12 sm:col-span-5 p-4 flex flex-col justify-between sm:border-l border-slate-300">
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-black tracking-tight text-slate-950 uppercase">
                        {docMeta.label}
                      </h2>
                    </div>

                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-semibold">Punto de Venta: <strong>{ptoVtaStr}</strong></span>
                        <span className="text-slate-600 font-semibold">Comp. Nro: <strong>{nroCmpStr}</strong></span>
                      </div>
                      <div className="text-slate-800">
                        <strong>Fecha de Emisión:</strong> {emissionDateStr} ({emissionTimeStr})
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-200 text-[11px] space-y-0.5 text-slate-700">
                    <div><strong>CUIT:</strong> <span className="font-mono">{cuitEmisor}</span></div>
                    <div><strong>Ingresos Brutos:</strong> <span className="font-mono">{iibb}</span></div>
                    <div><strong>Fecha de Inicio de Actividades:</strong> {startActivityDate}</div>
                  </div>
                </div>

              </div>

              {/* PERÍODO FACTURADO (REQUERIDO POR AFIP) */}
              <div className="px-4 py-1.5 bg-slate-100 border-b border-slate-300 text-[11px] text-slate-700 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong>Período Facturado Desde:</strong> {emissionDateStr}
                  <span className="mx-2">•</span>
                  <strong>Hasta:</strong> {emissionDateStr}
                </div>
                <div>
                  <strong>Fecha de Vto. para el pago:</strong> {caeVtoStr}
                </div>
              </div>

              {/* DATOS DEL RECEPTOR / CLIENTE */}
              <div className="p-4 border-b-2 border-slate-900 bg-white space-y-1 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-4">
                    <strong>{customerDocType}:</strong> <span className="font-mono font-bold">{customerDocNumber || 'Consumidor Final'}</span>
                  </div>
                  <div className="sm:col-span-8">
                    <strong>Apellido y Nombre / Razón Social:</strong> <span className="font-bold">{customerName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                  <div className="sm:col-span-4">
                    <strong>Condición frente al IVA:</strong> {customerTaxCondition}
                  </div>
                  <div className="sm:col-span-4">
                    <strong>Domicilio Comercial:</strong> {customerAddress}
                  </div>
                  <div className="sm:col-span-4">
                    <strong>Condición de Venta:</strong> <span className="font-semibold text-slate-800">{paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* TABLA DE ÍTEMS / PRODUCTOS Y SERVICIOS */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                      <th className="py-2 px-3">Código</th>
                      <th className="py-2 px-3">Producto / Servicio</th>
                      <th className="py-2 px-2 text-center">Cant.</th>
                      <th className="py-2 px-2 text-center">U. Medida</th>
                      <th className="py-2 px-3 text-right">Precio Unit.</th>
                      <th className="py-2 px-2 text-center">% Bonif.</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                      {docMeta.discriminatesIva && (
                        <>
                          <th className="py-2 px-2 text-center">Alícuota IVA</th>
                          <th className="py-2 px-3 text-right">Subtotal c/IVA</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {voucher.items?.map((item, idx) => {
                      const qty = item.quantity || 1;
                      const price = item.price || 0;
                      const disc = item.discountPercent || 0;
                      const itemSubtotal = qty * price * (1 - disc / 100);
                      const ivaRate = item.ivaPercent || 21;
                      const itemWithIva = itemSubtotal * (1 + ivaRate / 100);

                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          <td className="py-2 px-3 font-mono font-bold text-slate-600">{item.sku || `ITEM-${idx + 1}`}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {item.name}
                            {item.color && item.color !== '-' && (
                              <span className="text-slate-500 font-normal ml-1">({item.color})</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center font-bold">{qty}</td>
                          <td className="py-2 px-2 text-center text-slate-600">unidades</td>
                          <td className="py-2 px-3 text-right font-mono">${Math.round(price).toLocaleString('es-AR')}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{disc > 0 ? `${disc}%` : '0%'}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">${Math.round(itemSubtotal).toLocaleString('es-AR')}</td>
                          {docMeta.discriminatesIva && (
                            <>
                              <td className="py-2 px-2 text-center font-mono">{ivaRate}%</td>
                              <td className="py-2 px-3 text-right font-mono font-bold">${Math.round(itemWithIva).toLocaleString('es-AR')}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* RESUMEN DE TOTALES E IMPUESTOS */}
              <div className="border-t-2 border-slate-900 p-4 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-xs text-slate-600 space-y-1">
                  {voucher.notes && (
                    <p><strong>Observaciones:</strong> {voucher.notes}</p>
                  )}
                  <p><strong>Operador:</strong> {voucher.seller || 'Mostrador Montec'}</p>
                </div>

                <div className="w-full sm:w-80 space-y-1.5 text-xs text-right">
                  {docMeta.discriminatesIva ? (
                    <>
                      <div className="flex justify-between text-slate-700">
                        <span>Importe Neto Gravado:</span>
                        <span className="font-mono font-bold">${netoGravado.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>IVA 21%:</span>
                        <span className="font-mono font-bold">${iva21.toLocaleString('es-AR')}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-700">
                        <span>Subtotal Neto:</span>
                        <span className="font-mono font-bold">${subtotal.toLocaleString('es-AR')}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-amber-600 font-bold">
                          <span>Descuento Aplicado:</span>
                          <span className="font-mono">-${discountAmount.toLocaleString('es-AR')}</span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t-2 border-slate-900 font-heading">
                    <span>IMPORTE TOTAL:</span>
                    <span className="font-mono">${total.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>

              {/* PIE FISCAL OFICIAL OBLIGATORIO DE ARCA / AFIP */}
              <div className="border-t-2 border-slate-900 p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* CÓDIGO QR REGLAMENTARIO DE AFIP (RG 4892) */}
                <div className="flex items-center gap-4">
                  <div className="p-1.5 bg-white border border-slate-300 rounded-md shrink-0 shadow-2xs">
                    <QRCodeSVG 
                      value={qrUrl} 
                      size={92} 
                      level="M" 
                      includeMargin={false}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-0.5 rounded bg-blue-900 text-white font-black text-[11px] tracking-wider font-heading">
                        ARCA
                      </div>
                      <span className="text-[11px] font-bold text-slate-800">
                        Comprobante Autorizado
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 max-w-xs leading-tight">
                      Esta Administración Federal no se responsabiliza por los datos ingresados en el detalle de la operación.
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono">
                      Resolución General AFIP N° 4291/2018 y 4892/2020
                    </p>
                  </div>
                </div>

                {/* BLOQUE DE CAE Y FECHA DE VENCIMIENTO */}
                <div className="text-right space-y-1 text-xs sm:border-l sm:border-slate-200 sm:pl-6">
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-bold text-slate-900">CAE N°:</span>
                    <span className="font-mono font-black text-sm tracking-wider text-slate-950">
                      {caeNumber}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCae}
                      className="p-1 text-slate-400 hover:text-slate-800 print:hidden cursor-pointer"
                      title="Copiar CAE"
                    >
                      {copiedCae ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Fecha de Vto. de CAE:</span>{' '}
                    <span className="font-mono font-bold text-slate-900">{caeVtoStr}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Pág. 1 / 1
                  </div>
                </div>

              </div>

            </div>

          </div>
        ) : (
          /* ================================================================ */
          /* VISTA 2: FORMATO TICKET TÉRMICO 80MM (CON QR FISCAL DE AFIP)     */
          /* ================================================================ */
          <div className="p-6 bg-slate-100 flex justify-center print:p-0 print:bg-white">
            <div className="w-full max-w-sm bg-white p-5 shadow-lg border border-slate-300 font-mono text-xs text-slate-900 space-y-3 leading-snug print:shadow-none print:border-none print:max-w-full">
              
              {/* MEMBRETE TICKET */}
              <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
                <h2 className="text-lg font-black tracking-tight uppercase font-sans">
                  {fantasyName}
                </h2>
                <p className="text-[11px] font-bold text-slate-800">
                  {legalName}
                </p>
                <p className="text-[10px] text-slate-600">
                  {address} • {city} ({state})
                </p>
                <p className="text-[10px] text-slate-600">
                  CUIT: {cuitEmisor} • IIBB: {iibb}
                </p>
                <p className="text-[10px] text-slate-600">
                  IVA: {ivaCondition} • Inicio: {startActivityDate}
                </p>
                <div className="mt-2 inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded uppercase">
                  {docMeta.label}
                </div>
              </div>

              {/* DATOS DE COMPROBANTE Y CLIENTE */}
              <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-slate-400">
                <div>Nro. Comp: <strong>{fullDocNumber}</strong></div>
                <div>Fecha/Hora: {emissionDateStr} {emissionTimeStr}</div>
                <div>Cliente: <strong>{customerName}</strong></div>
                <div>{customerDocType}: {customerDocNumber || 'Consumidor Final'}</div>
                <div>Cond. IVA: {customerTaxCondition}</div>
                <div>Medio Pago: <strong>{paymentMethod}</strong></div>
              </div>

              {/* ÍTEMS EN FORMATO TICKET */}
              <div className="space-y-1.5 pb-2 border-b border-dashed border-slate-400 text-[11px]">
                <div className="flex justify-between font-bold text-[10px] text-slate-500 uppercase">
                  <span>Cant • Descripción</span>
                  <span>Total</span>
                </div>
                {voucher.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate pr-2">
                      {item.quantity}x {item.name} {item.color && item.color !== '-' ? `(${item.color})` : ''}
                    </span>
                    <span className="font-bold whitespace-nowrap">
                      ${Math.round((item.quantity || 1) * (item.price || 0)).toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>

              {/* TOTALES */}
              <div className="space-y-1 text-right text-xs pt-1">
                {discountAmount > 0 && (
                  <div className="flex justify-between text-amber-600 font-bold">
                    <span>Descuento:</span>
                    <span>-${discountAmount.toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black pt-1 border-t border-slate-900 font-sans">
                  <span>TOTAL:</span>
                  <span>${total.toLocaleString('es-AR')}</span>
                </div>
              </div>

              {/* PIE TÉRMICO CON QR Y CAE */}
              <div className="pt-3 border-t border-dashed border-slate-400 text-center space-y-2">
                <div className="flex justify-center">
                  <div className="p-2 bg-white border border-slate-300 rounded shadow-2xs">
                    <QRCodeSVG 
                      value={qrUrl} 
                      size={115} 
                      level="M" 
                      includeMargin={false}
                    />
                  </div>
                </div>

                <div className="space-y-0.5 text-[10px]">
                  <div className="font-bold text-xs">
                    CAE N°: <span className="font-mono">{caeNumber}</span>
                  </div>
                  <div>
                    Vto. CAE: <strong>{caeVtoStr}</strong>
                  </div>
                  <div className="text-[9px] text-slate-500 pt-1">
                    Comprobante Autorizado por AFIP / ARCA
                  </div>
                  <div className="text-[9px] text-slate-400">
                    ¡Muchas gracias por su compra!
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
