import React from 'react';
import { History, ArrowRight, Sparkles } from 'lucide-react';

export default function StoryTeaser({ onOpenStory }) {
  const handleNavigate = (e) => {
    if (e) e.preventDefault();
    if (onOpenStory) {
      onOpenStory();
    } else {
      window.history.pushState({}, '', '/historia');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 bg-zinc-950/40 border-y border-zinc-900 w-full max-w-full overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div 
          onClick={handleNavigate}
          className="group relative rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 hover:border-[#FF5500]/50 p-5 sm:p-6 shadow-xl transition-all duration-300 hover:shadow-[0_10px_35px_rgba(255,85,0,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-5 cursor-pointer"
        >
          {/* Glow sutil */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#FF5500]/10 blur-3xl pointer-events-none rounded-full" />

          <div className="flex items-start sm:items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500] shrink-0 group-hover:scale-110 group-hover:bg-[#FF5500] group-hover:text-white transition-all duration-300">
              <History className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[#FF5500] bg-[#FF5500]/10 px-2 py-0.5 rounded-full border border-[#FF5500]/20">
                  Quiénes Somos • 12 Años
                </span>
                <span className="text-xs text-zinc-400 hidden sm:inline">•</span>
                <span className="text-xs text-zinc-400 hidden sm:inline">Trayectoria y Oficio</span>
              </div>
              <h3 className="text-base sm:text-lg font-heading font-bold text-white group-hover:text-amber-300 transition-colors">
                El camino que forjó a montec: la historia de Javier Villar
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                De los primeros pasos en Mechongué al laboratorio de microelectrónica en Mar del Plata.
              </p>
            </div>
          </div>

          <div className="relative z-10 self-start md:self-auto shrink-0">
            <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 group-hover:bg-[#FF5500] text-zinc-200 group-hover:text-white font-bold text-xs shadow-md transition-all">
              <span>Leer historia completa</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
