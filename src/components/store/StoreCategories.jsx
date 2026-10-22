import React from 'react';
import { 
  Sparkles, 
  Smartphone, 
  Watch, 
  Headphones, 
  Zap, 
  Shield, 
  Cpu 
} from 'lucide-react';
import { STORE_CATEGORIES } from '../../data/accessoriesData';

const CATEGORY_ICONS = {
  'Todos': Sparkles,
  'iPhones & Smartphones': Smartphone,
  'Smartwatches & Relojes': Watch,
  'Audio & AirPods': Headphones,
  'Carga & Energía': Zap,
  'Accesorios & Fundas': Shield,
  'Gadgets & Electrónica Pequeña': Cpu
};

export default function StoreCategories({ 
  selectedCategory, 
  onSelectCategory,
  categoryCounts = {} 
}) {
  return (
    <div className="w-full bg-[#0d0d12]/90 border-b border-zinc-800/80 py-3.5 px-3 sm:px-6 sticky top-[108px] sm:top-[116px] z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
          {STORE_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category] || Sparkles;
            const isSelected = selectedCategory === category;
            const count = categoryCounts[category];

            return (
              <button
                key={category}
                onClick={() => onSelectCategory(category)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-[0_0_18px_rgba(255,85,0,0.45)] scale-[1.02]'
                    : 'bg-[#15151e] hover:bg-[#1a1a26] text-zinc-300 hover:text-white border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#FF5500]'}`} />
                <span>{category}</span>
                {count !== undefined && count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isSelected ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
