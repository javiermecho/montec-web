import React from 'react';
import { 
  MapPin, 
  Clock, 
  CreditCard, 
  Instagram, 
  Phone, 
  Navigation, 
  ExternalLink, 
  CheckCircle, 
  Banknote, 
  QrCode,
  Sparkles
} from 'lucide-react';

export default function LocationContact() {
  const paymentMethods = [
    { name: 'Efectivo', icon: Banknote, desc: '10% de descuento en reparaciones' },
    { name: 'Transferencia', icon: QrCode, desc: 'Alias / CBU inmediato' },
    { name: 'Mercado Pago', icon: QrCode, desc: 'Dinero en cuenta o QR' },
    { name: 'Tarjetas Débito y Crédito', icon: CreditCard, desc: 'Visa, Mastercard, Cabal' }
  ];

  const address = 'Montes Carballo 943, B7600 Mar del Plata, Provincia de Buenos Aires';
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  const instagramUrl = 'https://instagram.com/montec.arg';

  return (
    <section id="ubicacion" className="py-20 px-4 sm:px-6 lg:px-8 relative bg-zinc-950/80 border-t border-zinc-900">
      
      {/* Background Glow */}
      <div className="absolute bottom-10 right-10 w-[400px] h-[350px] bg-[#FF5500]/10 blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto">
        
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5500]/10 border border-[#FF5500]/30 text-[#FF5500] text-xs font-bold uppercase tracking-wider mb-4">
            <MapPin className="w-3.5 h-3.5" />
            <span>Punto de Atención y Laboratorio</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight mb-4">
            Vení a nuestro taller en <span className="text-[#FF5500]">Mar del Plata</span>
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg">
            Estamos ubicados en Zona Norte / Constitución. Te esperamos para revisar tu celular o computadora en persona y brindarte un diagnóstico sin cargo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Columna Izquierda: Información de Contacto, Horarios y Pagos (5 cols) */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            
            {/* Card Dirección */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-[#FF5500]/15 text-[#FF5500] shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#FF5500]">
                    Dirección Física
                  </div>
                  <h3 className="text-lg font-heading font-bold text-white mt-0.5">
                    Montes Carballo 943
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                    Mar del Plata (Zona Norte / Constitución), Bs. As.
                  </p>
                  
                  <a
                    href={googleMapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5500] hover:text-[#FF6600] mt-3 group"
                  >
                    <span>¿Cómo llegar con Google Maps?</span>
                    <Navigation className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </div>

            {/* Card Horarios de Atención */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-[#FF5500]/15 text-[#FF5500] shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#FF5500]">
                    Horarios de Atención
                  </div>
                  <div className="mt-2 space-y-1.5 text-xs sm:text-sm">
                    <div className="flex justify-between text-zinc-300">
                      <span>Lunes a Viernes:</span>
                      <strong className="text-white font-mono">09:30 - 19:00 hs</strong>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Sábados:</span>
                      <strong className="text-white font-mono">10:00 - 14:00 hs</strong>
                    </div>
                    <div className="flex justify-between text-zinc-500 text-xs">
                      <span>Domingos y Feriados:</span>
                      <span>Guardia WhatsApp</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Medios de Pago */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-[#FF5500] mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Medios de Pago Aceptados</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {paymentMethods.map((pm, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                    <div className="text-xs font-bold text-zinc-200">{pm.name}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{pm.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instagram Oficial */}
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-pink-950/30 to-orange-950/40 border border-pink-500/30 hover:border-pink-500/60 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Seguinos en Instagram</div>
                  <div className="text-sm font-heading font-bold text-white">@montec.arg</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
            </a>

          </div>

          {/* Columna Derecha: Mapa Interactivo Embebido (7 cols) */}
          <div className="lg:col-span-7 bg-[#121212] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative min-h-[420px] flex flex-col">
            
            <div className="px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-ping" />
                <span>Ubicación en Tiempo Real: Montes Carballo 943</span>
              </div>
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#FF5500] hover:underline flex items-center gap-1 font-semibold"
              >
                Abrir Mapa Completo
              </a>
            </div>

            <div className="flex-1 w-full h-full min-h-[380px] relative">
              <iframe
                title="Ubicación montec Mar del Plata"
                src="https://maps.google.com/maps?q=Montes+Carballo+943,+Mar+del+Plata,+Buenos+Aires&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(90%)' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full min-h-[380px]"
              />
            </div>

            <div className="p-3 bg-zinc-950 border-t border-zinc-850 text-center text-xs text-zinc-400">
              Facilidad de estacionamiento en la cuadra • A metros de Av. Constitución
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
