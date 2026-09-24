import React from 'react';
import { MessageCircle, Instagram, MapPin, ShieldCheck, ArrowUp, Clock, Phone, Car } from 'lucide-react';
import MontecLogo from './MontecLogo';
import { useData } from '../context/DataContext';
import { trackClickLlamadaOMapa, trackWhatsAppClick } from '../services/analytics';

export default function Footer() {
  const { businessConfig } = useData();
  const rawWhatsapp = businessConfig?.contact?.quotationWhatsapp || businessConfig?.contact?.supportPhone || '5492235444991';
  const whatsappNumber = rawWhatsapp.replace(/[^0-9]/g, '') || '5492235444991';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('¡Hola montec! Quisiera hacer una consulta sobre servicio técnico.')}`;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0A0A0A] border-t border-zinc-900 pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-zinc-400 text-sm w-full max-w-full overflow-hidden">
      <div className="max-w-6xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-zinc-900">
          
          {/* Col 1 & 2: Branding y Propuesta de Valor */}
          <div className="lg:col-span-2 space-y-4">
            <a href="#inicio" className="inline-block">
              <MontecLogo size="lg" />
            </a>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Servicio Técnico Independiente y Laboratorio Multimarca en Mar del Plata. Especialistas en reparación de hardware físico de celulares, iPhone y notebooks con repuestos de calidad y garantía escrita.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (typeof window.gtag === 'function') {
                    window.gtag('event', 'conversion', { 'send_to': 'AW-18464752657' });
                  }
                  trackWhatsAppClick({ source: 'footer', whatsappUrl });
                  trackClickLlamadaOMapa({ type: 'whatsapp_footer', label: 'WhatsApp Footer', url: whatsappUrl });
                }}
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-[#FF5500] text-zinc-300 hover:text-white transition-colors border border-zinc-800"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/montec.arg"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClickLlamadaOMapa({ type: 'instagram_footer', label: 'Instagram Footer', url: 'https://instagram.com/montec.arg' })}
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-pink-600 text-zinc-300 hover:text-white transition-colors border border-zinc-800"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 3: Navegación Rápida */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 font-heading">
              Navegación
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a href="#inicio" className="hover:text-white transition-colors">Inicio</a>
              </li>
              <li>
                <a href="#cotizador" className="hover:text-[#FF5500] transition-colors">Cotizador de Reparación</a>
              </li>
              <li>
                <a href="#laboratorio" className="hover:text-white transition-colors">Laboratorio Propio</a>
              </li>
              <li>
                <a href="#accesorios" className="hover:text-white transition-colors">Catálogo de Accesorios</a>
              </li>
              <li>
                <a href="#ubicacion" className="hover:text-white transition-colors">Ubicación y Contacto</a>
              </li>
            </ul>
          </div>

          {/* Col 4: Servicios Físicos de Hardware */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 font-heading">
              Servicios de Hardware
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>Cambio de Módulo y Pantalla</li>
              <li>Baterías Calidad Premium / OEM</li>
              <li>Reparación Pines de Carga</li>
              <li>Microsoldadura en Placa Madre</li>
              <li>Mantenimiento Térmico PC/Notebook</li>
              <li>Actualización Memoria y SSD</li>
            </ul>
          </div>

          {/* Col 5: Local, Contacto Directo & Horarios */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-heading">
              Local & Contacto Directo
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#FF5500] shrink-0 mt-0.5" />
                <span className="text-zinc-300 leading-tight">
                  <strong className="text-white block">Montes Carballo 943</strong>
                  Mar del Plata (Constitución, a metros de ex Sobremonte)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Car className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-emerald-300 text-[11px] font-medium leading-tight">
                  Estacionamiento libre y gratuito en la puerta
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#FF5500] shrink-0 mt-0.5" />
                <span className="text-zinc-300 text-[11px]">
                  Lun a Vie: 09:30 a 19:00 hs<br />
                  Sábados: 10:00 a 14:00 hs
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Phone className="w-4 h-4 text-[#FF5500] shrink-0" />
                <a href="tel:+5492235444991" className="text-white hover:text-[#FF5500] font-mono font-semibold">
                  +54 9 223 544-4991
                </a>
              </div>
              <div className="pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (typeof window.gtag === 'function') {
                      window.gtag('event', 'conversion', { 'send_to': 'AW-18464752657' });
                    }
                    trackWhatsAppClick({ source: 'footer_cta', whatsappUrl });
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>Pedir Turno por WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bloque Obligatorio de Compliance para Google Ads & Descargo de Responsabilidad Legal */}
        <div className="my-8 p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-400 leading-relaxed space-y-2">
          <p className="font-bold text-zinc-200 text-xs sm:text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500]"></span>
            <span>Aviso Legal y Descargo de Responsabilidad:</span>
          </p>
          <p className="text-zinc-300">
            Montec es un taller de reparación electrónica y servicio técnico independiente y multimarca ubicado en Montes Carballo 943, Mar del Plata, Argentina. No somos servicio técnico oficial ni poseemos afiliación, patrocinio, certificación ni vinculación comercial directa con Apple Inc., Samsung Electronics Co., Ltd., Motorola Mobility LLC, Xiaomi Inc., ni con ninguna de las marcas comerciales mencionadas.
          </p>
          <p className="text-zinc-400">
            Los nombres de marcas, marcas registradas, logotipos y modelos se citan única y exclusivamente a título informativo y descriptivo para indicar la compatibilidad técnica de nuestros servicios de reparación de hardware y repuestos ofrecidos.
          </p>
        </div>

        {/* Barra Inferior con Enlaces Legales Requeridos por Google Ads */}
        <div className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            © {new Date().getFullYear()} <strong className="text-zinc-300">montec</strong>. Taller multimarca independiente de hardware. Montes Carballo 943, Mar del Plata, Argentina.
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href="/privacidad.html"
              className="text-zinc-400 hover:text-[#FF5500] underline transition-colors"
            >
              Política de Privacidad
            </a>
            <span className="text-zinc-700">•</span>
            <a
              href="/terminos.html"
              className="text-zinc-400 hover:text-[#FF5500] underline transition-colors"
            >
              Términos del Servicio y Garantías
            </a>
          </div>
          
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <span>Volver arriba</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
}
