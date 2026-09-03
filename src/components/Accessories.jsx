import React, { useState } from 'react';
import { 
  ShoppingBag, 
  MessageCircle, 
  Zap, 
  Sparkles, 
  Check, 
  Cable, 
  Headphones, 
  Smartphone 
} from 'lucide-react';
import { ACCESSORIES_CATEGORIES } from '../data/accessoriesData';
import { useData } from '../context/DataContext';

export default function Accessories() {
  const { accessories } = useData();
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const filteredItems = selectedCategory === 'Todos'
    ? accessories
    : accessories.filter(item => item.category === selectedCategory);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Cargadores': return <Zap className="w-8 h-8 text-[#FF5500]" />;
      case 'Cables': return <Cable className="w-8 h-8 text-[#FF5500]" />;
      case 'Hidrogel': return <Sparkles className="w-8 h-8 text-[#FF5500]" />;
      case 'Fundas': return <Smartphone className="w-8 h-8 text-[#FF5500]" />;
      case 'Audio': return <Headphones className="w-8 h-8 text-[#FF5500]" />;
      default: return <ShoppingBag className="w-8 h-8 text-[#FF5500]" />;
    }
  };

  return (
    <section id="accesorios" className="py-20 px-4 sm:px-6 lg:px-8 relative">
      
      {/* Background Glow */}
      <div className="absolute top-1/3 left-10 w-[350px] h-[350px] bg-[#FF5500]/10 blur-[130px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto">
        
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5500]/10 border border-[#FF5500]/30 text-[#FF5500] text-xs font-bold uppercase tracking-wider mb-4">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Stock Permanente en Local</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight mb-4">
            Accesorios Esenciales de <span className="text-[#FF5500]">Alta Rotación</span>
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg">
            Cargadores certificados para no dañar la batería, protección antigolpes real y corte láser de hidrogel en el momento.
          </p>
        </div>

        {/* Filtros de Categorías */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {ACCESSORIES_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.4)]'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grilla de Productos Reactiva */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const itemWhatsappMsg = `¡Hola montec! Quisiera consultar stock y disponibilidad del accesorio: "${item.name}" ($${Number(item.price).toLocaleString('es-AR')}) para retirar en Montes Carballo 943.`;
            const itemWhatsappUrl = `https://wa.me/5492235000000?text=${encodeURIComponent(itemWhatsappMsg)}`;
            const featuresList = Array.isArray(item.features) ? item.features : [];

            return (
              <div
                key={item.id}
                className="bg-[#121212] border border-zinc-850 hover:border-[#FF5500]/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,85,0,0.2)] hover:-translate-y-1 group"
              >
                <div>
                  {/* Visual del Producto */}
                  <div className="w-full h-36 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 flex flex-col items-center justify-center relative overflow-hidden mb-4 group-hover:border-[#FF5500]/40 transition-colors">
                    {/* Badge de estado */}
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30 font-mono">
                      {item.badge}
                    </span>
                    <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 group-hover:scale-110 transition-transform duration-300">
                      {getCategoryIcon(item.category)}
                    </div>
                  </div>

                  {/* Nombre y Compatibilidad */}
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#FF5500] mb-1">
                    {item.category}
                  </div>
                  <h3 className="font-heading font-bold text-base text-white line-clamp-2 mb-1.5 leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-1 mb-3">
                    {item.compatible}
                  </p>

                  {/* Features */}
                  <ul className="space-y-1 mb-4">
                    {featuresList.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <Check className="w-3 h-3 text-[#FF5500] shrink-0" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Precio y Botón WhatsApp */}
                <div className="pt-3 border-t border-zinc-850">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-xs text-zinc-500">Precio Local:</span>
                    <span className="text-lg font-heading font-extrabold text-white">
                      ${Number(item.price).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <a
                    href={itemWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-[#FF5500] text-zinc-200 hover:text-white text-xs font-bold transition-all duration-200 border border-zinc-800 hover:border-[#FF5500] shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>Pedir por WhatsApp</span>
                  </a>
                </div>

              </div>
            );
          })}
        </div>

        {/* Banner de Hidrogel a medida en 2 minutos */}
        <div className="mt-12 bg-gradient-to-r from-orange-950/40 via-zinc-900 to-zinc-900 border border-[#FF5500]/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-[#FF5500]/20 text-[#FF5500] shrink-0">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-heading font-bold text-white">
                ¿Necesitás lámina de Hidrogel para tu modelo exacto?
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Contamos con plóter de corte computarizado con más de 10.000 plantillas para teléfonos, smartwatches y cámaras. Instalación profesional sin cargo en el local.
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/5492235000000?text=Hola%20montec!%20Quiero%20colocar%20hidrogel%20en%20mi%20equipo.%20%C2%BFTienen%20para%20mi%20modelo?"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-6 py-3 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
          >
            Consultar mi modelo
          </a>
        </div>

      </div>
    </section>
  );
}
