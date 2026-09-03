import React from 'react';
import { MessageCircle, Instagram, MapPin, ShieldCheck, ArrowUp, Sliders } from 'lucide-react';
import MontecLogo from './MontecLogo';
import { useData } from '../context/DataContext';

export default function Footer() {
  const { setIsAdminOpen } = useData();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0A0A0A] border-t border-zinc-900 pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-zinc-400 text-sm">
      <div className="max-w-6xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-zinc-900">
          
          {/* Col 1 & 2: Branding y Propuesta de Valor */}
          <div className="lg:col-span-2 space-y-4">
            <a href="#inicio" className="inline-block">
              <MontecLogo size="lg" />
            </a>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Servicio Técnico de Alta Precisión y Laboratorio de Microelectrónica en Mar del Plata. Reparación honesta de iPhone, Smartphones Android y Notebooks.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://wa.me/5492235000000"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-[#FF5500] text-zinc-300 hover:text-white transition-colors border border-zinc-800"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/montec.arg"
                target="_blank"
                rel="noopener noreferrer"
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
              <li><a href="#inicio" className="hover:text-[#FF5500] transition-colors">Inicio</a></li>
              <li><a href="#cotizador" className="hover:text-[#FF5500] transition-colors">Cotizador Online</a></li>
              <li><a href="#laboratorio" className="hover:text-[#FF5500] transition-colors">Laboratorio Técnico</a></li>
              <li><a href="#accesorios" className="hover:text-[#FF5500] transition-colors">Catálogo de Accesorios</a></li>
              <li><a href="#ubicacion" className="hover:text-[#FF5500] transition-colors">Ubicación y Horarios</a></li>
            </ul>
          </div>

          {/* Col 4: Servicios Principales */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 font-heading">
              Servicios
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-400">
              <li>Cambio de Módulos y Displays</li>
              <li>Reemplazo de Baterías 100%</li>
              <li>Reparación Pines de Carga</li>
              <li>Microelectrónica y Placas</li>
              <li>Mantenimiento Térmico PC/Mac</li>
              <li>Corte Láser de Hidrogel HD</li>
            </ul>
          </div>

          {/* Col 5: Local, Garantía & Acceso Admin */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 font-heading">
              Garantía & Local
            </h4>
            <div className="space-y-3 text-xs mb-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#FF5500] shrink-0 mt-0.5" />
                <span>Montes Carballo 943, Mar del Plata</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>90 días de garantía formal escrita en todas las reparaciones</span>
              </div>
            </div>

            {/* Botón de acceso técnico */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#FF5500] transition-colors pt-2 border-t border-zinc-850"
            >
              <Sliders className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Panel Técnico / Admin</span>
            </button>
          </div>

        </div>

        {/* Barra Inferior */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            © {new Date().getFullYear()} <strong className="text-zinc-300">montec</strong>. Todos los derechos reservados. Mar del Plata, Argentina.
          </div>
          
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
          >
            <span>Volver arriba</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
}
