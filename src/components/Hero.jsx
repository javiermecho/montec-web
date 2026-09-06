import React from 'react';
import { Wrench, ShieldCheck, Clock, ArrowRight, Sparkles, CheckCircle2, ChevronDown } from 'lucide-react';
import MontecLogo from './MontecLogo';
import { useData } from '../context/DataContext';

export default function Hero() {
  const { setIsQuoteModalOpen } = useData();
  const brands = [
    { name: 'Apple', icon: '', desc: 'iPhone • iPad • Mac' },
    { name: 'Samsung', icon: 'SAMSUNG', desc: 'Galaxy S • A • Z' },
    { name: 'Motorola', icon: 'M', desc: 'Edge • Moto G • E' },
    { name: 'Xiaomi', icon: 'mi', desc: 'Redmi • Poco • Xiaomi' },
    { name: 'Lenovo', icon: 'Lenovo', desc: 'IdeaPad • ThinkPad' },
    { name: 'HP', icon: 'hp', desc: 'Pavilion • Victus • Envy' }
  ];

  const highlights = [
    { text: 'Reparaciones en el día (2 a 3 hs)' },
    { text: '90 días de Garantía Escrita' },
    { text: 'Diagnóstico Honesto Sin Cargo' },
    { text: 'Laboratorio Propio en Mar del Plata' }
  ];

  return (
    <section id="inicio" className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      
      {/* Luces de Fondo Neón Ambientales */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] sm:w-[650px] h-[350px] bg-[#FF5500]/15 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[250px] bg-orange-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />
      
      {/* Grid sutil de fondo tecnológico */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none -z-10" 
      />

      <div className="max-w-5xl mx-auto text-center">
        
        {/* Badge superior */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700/80 shadow-inner mb-6 animate-pulse-glow">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5500] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5500]"></span>
          </span>
          <span className="text-xs sm:text-sm font-semibold text-zinc-200">
            Laboratorio Especializado en <span className="text-[#FF5500]">Mar del Plata</span>
          </span>
        </div>

        {/* Titular Principal */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-heading text-white tracking-tight leading-[1.15] mb-6">
          Servicio Técnico Especializado & <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            Microelectrónica en
          </span>{' '}
          <span className="text-[#FF5500] drop-shadow-[0_0_25px_rgba(255,85,0,0.45)]">
            Mar del Plata
          </span>
        </h1>

        {/* Subtítulo descriptivo */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg lg:text-xl text-zinc-400 font-normal leading-relaxed mb-8">
          Reparación profesional de celulares <strong className="text-zinc-200">iPhone</strong>, <strong className="text-zinc-200">Android</strong> y <strong className="text-zinc-200">Notebooks</strong> con repuestos seleccionados, instrumental de precisión y entrega en el día en Montes Carballo 943.
        </p>

        {/* Botones de Acción (CTAs) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setIsQuoteModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white bg-[#FF5500] hover:bg-[#FF6600] rounded-xl shadow-[0_0_25px_rgba(255,85,0,0.45)] hover:shadow-[0_0_35px_rgba(255,85,0,0.7)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Wrench className="w-5 h-5 text-white" />
            <span>Cotizar Reparación</span>
            <ArrowRight className="w-4 h-4 text-white/80" />
          </button>

          <a
            href="#accesorios"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 text-base font-semibold text-zinc-200 hover:text-white bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all duration-200"
          >
            <span>Ver Accesorios Esenciales</span>
          </a>
        </div>

        {/* Puntos destacados / Pilares inmediatos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-14 text-left">
          {highlights.map((item, idx) => (
            <div 
              key={idx} 
              className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-[#FF5500] shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-zinc-300 leading-tight">
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* Marcas Soportadas */}
        <div className="border-t border-zinc-800/80 pt-8 max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-5 text-center">
            Laboratorio multimarca con repuestos en stock permanente
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {brands.map((b) => (
              <div 
                key={b.name} 
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:border-[#FF5500]/40 transition-colors group"
              >
                <span className="font-heading font-bold text-base text-zinc-300 group-hover:text-white transition-colors">
                  {b.name}
                </span>
                <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 text-center mt-0.5">
                  {b.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Flecha indicadora de scroll */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-zinc-600 animate-bounce">
        <a href="#cotizador" aria-label="Desplazarse al cotizador">
          <ChevronDown className="w-6 h-6 hover:text-[#FF5500] transition-colors" />
        </a>
      </div>
    </section>
  );
}
