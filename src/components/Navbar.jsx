import React, { useState, useEffect } from 'react';
import { MessageCircle, Menu, X, Shield, Lock, Sliders } from 'lucide-react';
import MontecLogo from './MontecLogo';
import { useData } from '../context/DataContext';

export default function Navbar() {
  const { setIsAdminOpen, isAdminAuthenticated } = useData();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOpenNow, setIsOpenNow] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    // Comprobar horario de atención de Mar del Plata
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    if (day >= 1 && day <= 5) {
      setIsOpenNow(timeInMinutes >= 9 * 60 + 30 && timeInMinutes <= 19 * 60);
    } else if (day === 6) {
      setIsOpenNow(timeInMinutes >= 10 * 60 && timeInMinutes <= 14 * 60);
    } else {
      setIsOpenNow(false);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', href: '#inicio' },
    { name: 'Cotizador', href: '#cotizador', badge: 'Online' },
    { name: 'Laboratorio', href: '#laboratorio' },
    { name: 'Accesorios', href: '#accesorios' },
    { name: 'Ubicación', href: '#ubicacion' },
  ];

  const whatsappNumber = '5492235000000';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('¡Hola montec! Quisiera hacer una consulta técnica sobre mi equipo.')}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4">
      <nav 
        className={`max-w-7xl mx-auto rounded-2xl transition-all duration-300 border ${
          scrolled 
            ? 'bg-[#121212]/90 backdrop-blur-xl border-[#27272A] shadow-[0_8px_30px_rgba(0,0,0,0.85)] py-3 px-4 sm:px-6' 
            : 'bg-[#121212]/60 backdrop-blur-md border-[#27272A]/60 py-3.5 px-4 sm:px-6'
        }`}
      >
        <div className="flex items-center justify-between">
          
          {/* Logo Oficial */}
          <a href="#inicio" className="group flex items-center space-x-2 focus:outline-none">
            <MontecLogo size="md" className="group-hover:opacity-90 transition-opacity" />
          </a>

          {/* Links para Desktop */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="relative px-3.5 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5 flex items-center gap-1.5"
              >
                {link.name}
                {link.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30 animate-pulse">
                    {link.badge}
                  </span>
                )}
              </a>
            ))}
          </div>

          {/* CTA WhatsApp + Estado de Local + Botón Admin */}
          <div className="hidden sm:flex items-center space-x-2.5">
            {/* Badge de Horario */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              <span className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]' : 'bg-[#FF5500] shadow-[0_0_8px_#FF5500]'} animate-pulse`} />
              <span className="font-medium text-[11px]">{isOpenNow ? 'Local Abierto' : 'Online 24hs'}</span>
            </div>

            {/* Botón WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#FF5500] hover:bg-[#FF6600] rounded-xl shadow-[0_0_15px_rgba(255,85,0,0.4)] hover:shadow-[0_0_22px_rgba(255,85,0,0.65)] transition-all duration-300 transform active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white text-transparent" />
              <span>WhatsApp</span>
            </a>

            {/* Acceso directo al Panel Administrador */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-zinc-800 rounded-xl transition-colors relative group"
              title="Panel Técnico / Administrador"
            >
              <Sliders className="w-4 h-4 text-[#FF5500]" />
              {isAdminAuthenticated && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#121212]" />
              )}
            </button>
          </div>

          {/* Botón menú móvil */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="p-2 text-[#FF5500] bg-zinc-900 border border-zinc-800 rounded-lg"
              aria-label="Panel Admin"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-white bg-[#FF5500] rounded-lg shadow-sm"
              aria-label="Contactar por WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
            </a>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg focus:outline-none"
              aria-label="Menú principal"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menú desplegable Móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-zinc-800/80 space-y-1 pb-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[#FF5500]/20 text-[#FF5500]">
                    {link.badge}
                  </span>
                )}
              </a>
            ))}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsAdminOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-[#FF5500] bg-zinc-900/60 rounded-lg mt-2"
            >
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>Panel Técnico / Admin</span>
              </span>
              <span className="text-xs text-zinc-500 font-mono">PIN</span>
            </button>
            
            <div className="pt-2 flex items-center justify-between px-3 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-emerald-500' : 'bg-[#FF5500]'}`} />
                <span>{isOpenNow ? 'Local Abierto en Montes Carballo 943' : 'Respondemos consultas online'}</span>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
