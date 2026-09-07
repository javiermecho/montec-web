import React from 'react';
import { X, Printer, MessageSquare, CheckCircle2, ShieldCheck, Smartphone, Clock, Calendar, AlertCircle } from 'lucide-react';
import { PatternThumbnail } from './PatternLockInput';

const TALLER_PHONE = '5492235000000';
const TALLER_ADDRESS = 'Montes Carballo 943, Mar del Plata';

export default function OrderTicketModal({ order, onClose }) {
  if (!order) return null;

  const { customer, device, service } = order;

  const handlePrint = () => {
    window.print();
  };

  const generateWhatsAppMessage = () => {
    const balanceStr = service.balanceDue > 0 
      ? `$${service.balanceDue.toLocaleString('es-AR')}` 
      : '$0 (Totalmente abonado)';

    const depositStr = service.deposit > 0 
      ? `$${service.deposit.toLocaleString('es-AR')}` 
      : '$0';

    const deliveryDateStr = service.estimatedDeliveryDate 
      ? new Date(service.estimatedDeliveryDate).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) 
      : 'A coordinar';

    const text = 
      `¡Hola ${customer.name || 'Cliente'}! 👋 En *montec* hemos recibido tu equipo para servicio técnico.%0A%0A` +
      `📋 *ORDEN DE REPARACIÓN:* ${order.orderNumber}%0A` +
      `📱 *Equipo:* ${device.brand} ${device.model}%0A` +
      `🛠️ *Trabajo a realizar:* ${service.requestedRepair || 'Diagnóstico y reparación general'}%0A` +
      `💰 *Presupuesto Total:* $${(service.budgetTotal || 0).toLocaleString('es-AR')}%0A` +
      `💵 *Seña abonada:* ${depositStr}%0A` +
      `⚖️ *Saldo pendiente al retirar:* ${balanceStr}%0A` +
      `⏱️ *Fecha estimada de entrega:* ${deliveryDateStr}%0A` +
      `📍 *Taller:* ${TALLER_ADDRESS}%0A` +
      `🛡️ *Garantía escrita:* 30 días%0A%0A` +
      `Te avisaremos por este medio cuando tu equipo esté en mesa de trabajo o listo para retirar. ¡Gracias por confiar en montec!`;

    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`;
    return `https://wa.me/${finalPhone}?text=${text}`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static print:inset-auto">
      
      {/* Contenedor del Modal / Ticket */}
      <div className="bg-[#18181B] border border-zinc-800 rounded-2xl max-w-xl w-full shadow-2xl flex flex-col overflow-hidden max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:bg-white print:text-black">
        
        {/* Barra superior de acciones (Oculta al imprimir) */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-black tracking-wider text-[#FF5500]">
              Comprobante de Recepción
            </span>
            <span className="font-mono text-xs font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">
              {order.orderNumber}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Imprimir Ticket (80mm / A4)</span>
            </button>

            <a
              href={generateWhatsAppMessage()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#FF5500] hover:bg-[#FF6600] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-white" />
              <span>Enviar WhatsApp</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CUERPO DEL TICKET (Diseñado para pantalla y óptimo para impresión térmica de 80mm) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 print:p-0 print:overflow-visible text-xs print:text-[11px] print:leading-tight">
          
          {/* Encabezado Taller */}
          <div className="text-center border-b border-zinc-800 print:border-black pb-3">
            <h2 className="text-lg print:text-base font-black uppercase tracking-wider text-white print:text-black font-heading">
              MONTEC
            </h2>
            <p className="text-[11px] text-zinc-400 print:text-gray-700 font-medium">
              Servicio Técnico y Laboratorio de Microelectrónica
            </p>
            <p className="text-[10px] text-zinc-500 print:text-gray-600">
              {TALLER_ADDRESS} • Mar del Plata
            </p>
            <p className="text-[10px] text-zinc-500 print:text-gray-600 font-mono">
              WhatsApp: +54 9 223 500-0000 • montec.ar
            </p>
          </div>

          {/* Datos de la Orden */}
          <div className="flex items-center justify-between bg-zinc-900/90 print:bg-gray-100 p-2.5 rounded-xl border border-zinc-800 print:border-gray-300">
            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-400 print:text-gray-600 block">
                Orden de Servicio
              </span>
              <span className="text-base font-black font-heading text-[#FF5500] print:text-black">
                {order.orderNumber}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-zinc-400 print:text-gray-600 block">
                Fecha de Ingreso
              </span>
              <span className="font-mono text-[11px] text-zinc-200 print:text-black font-semibold">
                {formatDate(order.createdAt)}
              </span>
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="space-y-1 bg-zinc-900/50 print:bg-transparent p-2.5 rounded-xl border border-zinc-800/80 print:border-gray-300">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 print:text-black flex items-center gap-1">
              <span>👤 Datos del Cliente</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-zinc-500 print:text-gray-600 block text-[10px]">Nombre y Apellido:</span>
                <span className="font-bold text-white print:text-black text-xs">{customer.name}</span>
              </div>
              <div>
                <span className="text-zinc-500 print:text-gray-600 block text-[10px]">Teléfono / WhatsApp:</span>
                <span className="font-mono text-zinc-200 print:text-black font-semibold">{customer.phone}</span>
              </div>
              <div>
                <span className="text-zinc-500 print:text-gray-600 block text-[10px]">{customer.docType || 'DNI'}:</span>
                <span className="font-mono text-zinc-300 print:text-black">{customer.docNumber || 'No especificado'}</span>
              </div>
              <div>
                <span className="text-zinc-500 print:text-gray-600 block text-[10px]">Condición IVA:</span>
                <span className="text-zinc-300 print:text-black">{customer.taxCondition || 'Consumidor Final'}</span>
              </div>
            </div>
          </div>

          {/* Datos del Equipo & Desbloqueo */}
          <div className="space-y-2 bg-zinc-900/50 print:bg-transparent p-2.5 rounded-xl border border-zinc-800/80 print:border-gray-300">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 print:text-black flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-[#FF5500] print:text-black" />
              <span>Equipo a Reparar</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-zinc-500 print:text-gray-600 block text-[10px]">Marca y Modelo:</span>
                <span className="font-bold text-white print:text-black">{device.brand} {device.model}</span>
              </div>
              <div>
                <span className="text-zinc-500 print:text-gray-600 block text-[10px]">Color:</span>
                <span className="text-zinc-200 print:text-black">{device.color || 'Estándar'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-zinc-500 print:text-gray-600 block text-[10px]">IMEI / Serie:</span>
                <span className="font-mono text-zinc-300 print:text-black">{device.imei || 'No registrado'}</span>
              </div>
              {device.aestheticCondition && (
                <div className="col-span-2">
                  <span className="text-zinc-500 print:text-gray-600 block text-[10px]">Estado Estético Externo:</span>
                  <span className="text-zinc-300 print:text-black italic">{device.aestheticCondition}</span>
                </div>
              )}
            </div>

            {/* Bloque de Seguridad / Desbloqueo */}
            <div className="mt-2 pt-2 border-t border-zinc-800 print:border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-zinc-500 print:text-gray-600 block text-[10px] font-bold uppercase">
                  Seguridad / Desbloqueo:
                </span>
                {device.security?.type === 'pin' && (
                  <span className="font-mono text-sm font-bold text-[#FF5500] print:text-black">
                    PIN: {device.security.pin || 'Sin PIN'}
                  </span>
                )}
                {device.security?.type === 'password' && (
                  <span className="font-mono text-xs font-bold text-zinc-200 print:text-black">
                    Clave: {device.security.pin}
                  </span>
                )}
                {device.security?.type === 'none' && (
                  <span className="text-zinc-400 print:text-gray-700 text-xs italic">
                    Sin clave de bloqueo
                  </span>
                )}
                {device.security?.type === 'pattern' && (
                  <span className="text-[10px] text-zinc-400 print:text-black block">
                    Patrón gráfico 3x3:
                  </span>
                )}
              </div>

              {device.security?.type === 'pattern' && device.security?.patternSequence?.length > 0 && (
                <div className="shrink-0">
                  <PatternThumbnail sequence={device.security.patternSequence} size={65} isPrint={true} />
                </div>
              )}
            </div>
          </div>

          {/* Falla Solicitada & Checklist */}
          <div className="space-y-2 bg-zinc-900/50 print:bg-transparent p-2.5 rounded-xl border border-zinc-800/80 print:border-gray-300">
            <div>
              <span className="text-zinc-500 print:text-gray-600 block text-[10px] font-bold uppercase">
                Trabajo / Reparación Solicitada:
              </span>
              <p className="font-bold text-white print:text-black text-xs mt-0.5">
                {service.requestedRepair}
              </p>
            </div>

            {service.preliminaryDiagnosis && (
              <div>
                <span className="text-zinc-500 print:text-gray-600 block text-[10px] uppercase">
                  Diagnóstico Previo / Observaciones:
                </span>
                <p className="text-zinc-300 print:text-gray-800 text-[11px]">
                  {service.preliminaryDiagnosis}
                </p>
              </div>
            )}

            {/* Checklist rápido */}
            <div className="pt-2 border-t border-zinc-800 print:border-gray-200">
              <span className="text-zinc-500 print:text-gray-600 block text-[10px] uppercase font-bold mb-1">
                Checklist de Entrada en Mostrador:
              </span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-mono">
                <span className={service.checklist?.turnsOn ? "text-emerald-400 print:text-black font-bold" : "text-zinc-500 print:text-gray-500"}>
                  • Enciende: {service.checklist?.turnsOn ? "SÍ [OK]" : "NO"}
                </span>
                <span className={service.checklist?.touchOk ? "text-emerald-400 print:text-black font-bold" : "text-zinc-500 print:text-gray-500"}>
                  • Táctil: {service.checklist?.touchOk ? "SÍ [OK]" : "NO"}
                </span>
                <span className={service.checklist?.camerasOk ? "text-emerald-400 print:text-black font-bold" : "text-zinc-500 print:text-gray-500"}>
                  • Cámaras: {service.checklist?.camerasOk ? "SÍ [OK]" : "NO"}
                </span>
                <span className={service.checklist?.audioOk ? "text-emerald-400 print:text-black font-bold" : "text-zinc-500 print:text-gray-500"}>
                  • Sonido: {service.checklist?.audioOk ? "SÍ [OK]" : "NO"}
                </span>
                <span className={service.checklist?.chargingOk ? "text-emerald-400 print:text-black font-bold" : "text-zinc-500 print:text-gray-500"}>
                  • Carga: {service.checklist?.chargingOk ? "SÍ [OK]" : "NO"}
                </span>
                <span className={service.checklist?.biometricsOk ? "text-emerald-400 print:text-black font-bold" : "text-zinc-500 print:text-gray-500"}>
                  • Huella/Face ID: {service.checklist?.biometricsOk ? "SÍ [OK]" : "NO"}
                </span>
              </div>
            </div>
          </div>

          {/* Desglose de Costos & Saldos */}
          <div className="bg-zinc-950 print:bg-gray-100 p-3 rounded-xl border border-zinc-800 print:border-gray-400 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400 print:text-gray-700">Presupuesto Estimado Total:</span>
              <span className="font-bold text-white print:text-black font-mono">
                ${(service.budgetTotal || 0).toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400 print:text-gray-700">Pago Anticipado / Seña:</span>
              <span className="font-bold text-emerald-400 print:text-black font-mono">
                ${(service.deposit || 0).toLocaleString('es-AR')}
              </span>
            </div>
            <div className="pt-1 border-t border-zinc-800 print:border-gray-300 flex justify-between items-baseline">
              <span className="font-bold text-xs uppercase text-zinc-200 print:text-black">
                Saldo a Pagar al Retirar:
              </span>
              <span className="text-base font-black text-[#FF5500] print:text-black font-mono">
                ${(service.balanceDue || 0).toLocaleString('es-AR')}
              </span>
            </div>
            {service.estimatedDeliveryDate && (
              <div className="text-[10px] text-zinc-400 print:text-gray-600 pt-1 flex items-center justify-between">
                <span>Fecha pactada de entrega:</span>
                <span className="font-bold text-zinc-200 print:text-black">
                  {formatDate(service.estimatedDeliveryDate)}
                </span>
              </div>
            )}
          </div>

          {/* Términos y Condiciones Legales & Firmas */}
          <div className="text-[9px] print:text-[8px] text-zinc-500 print:text-gray-700 leading-tight space-y-1.5 pt-2 border-t border-zinc-800 print:border-gray-400">
            <p className="font-semibold text-zinc-400 print:text-black">
              TÉRMINOS Y CONDICIONES DEL SERVICIO TÉCNICO:
            </p>
            <ul className="list-disc pl-3 space-y-0.5">
              <li>Todas las reparaciones cuentan con <strong>30 días de garantía formal escrita</strong> exclusivamente sobre la pieza reemplazada o trabajo realizado. No cubre roturas físicas, humedad o manipulación de terceros.</li>
              <li>El cliente declara que el equipo no es de procedencia ilícita y autoriza las pruebas de banco de trabajo pertinentes.</li>
              <li>Pasados los 60 días corridos de la fecha de entrega pactada sin retiro del equipo, se devengarán cargos por depósito y guarda según legislación civil vigente.</li>
            </ul>

            {/* Espacio para firmas */}
            <div className="grid grid-cols-2 gap-6 pt-6 print:pt-10 text-center font-mono text-[9px] print:text-[9px]">
              <div className="border-t border-zinc-700 print:border-black pt-1">
                <span>Firma del Cliente</span>
                <div className="text-[8px] text-zinc-500">Aclaración y DNI</div>
              </div>
              <div className="border-t border-zinc-700 print:border-black pt-1">
                <span>Taller Montec</span>
                <div className="text-[8px] text-zinc-500">Recepción autorizada</div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer del Modal (Oculto al imprimir) */}
        <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#FF5500] hover:bg-[#FF6600] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>

      </div>
    </div>
  );
}
