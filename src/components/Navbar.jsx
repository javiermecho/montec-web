import React, { useState, useEffect } from 'react';
import { MessageCircle, Menu, X, Shield, Lock, MapPin, Phone } from 'lucide-react';
import MontecLogo from './MontecLogo';
import { useData } from '../context/DataContext';
import { trackClickLlamadaOMapa, trackWhatsAppClick } from '../services/analytics';

export default function Navbar() {
  const { setIsQuoteModalOpen, businessConfig } = useData();
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

    // Lun a Vie: 9:30 a 19:00 hs (1 a 5)
    if (day >= 1 && day <= 5) {
      setIsOpenNow(timeInMinutes >= 9 * 60 + 30 && timeInMinutes <= 19 * 60);
    } else if (day === 6) {
      // Sáb: 10:00 a 14:00 hs
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

  const rawWhatsapp = businessConfig?.contact?.quotationWhatsapp || businessConfig?.contact?.supportPhone || '5492235444991';
  const whatsappNumber = rawWhatsapp.replace(/[^0-9]/g, '') || '5492235444991';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('¡Hola montec! Quisiera hacer una consulta técnica sobre mi equipo.')}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-3 sm:px-6 lg:px-8 pt-2 sm:pt-3 w-full max-w-full">
      {/* Top Banner de Transparencia Comercial & Políticas de Google Ads */}
      <div className="max-w-7xl mx-auto mb-1.5 px-3 py-1 rounded-xl bg-zinc-950/90 border border-zinc-800/80 text-[10px] sm:text-[11px] text-zinc-300 flex items-center justify-between gap-2 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-zinc-200 font-medium">
            <MapPin className="w-3 h-3 text-[#FF5500] shrink-0" />
            <span>Montes Carballo 943 (Constitución, a metros de ex Sobremonte)</span>
          </span>
          <span className="hidden md:inline text-zinc-600">•</span>
          <span className="hidden md:inline text-emerald-400 font-medium">🚗 Estacionamiento libre en la puerta</span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="hidden sm:inline text-zinc-400">Lun a Vie 09:30-19:00 | Sáb 10:00-14:00</span>
          <a
            href="tel:+5492235444991"
            className="text-white hover:text-[#FF5500] font-mono font-bold flex items-center gap-1"
          >
            <Phone className="w-3 h-3 text-[#FF5500]" />
            <span>223 544-4991</span>
          </a>
        </div>
      </div>
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
            {navLinks.map((link) => {
              if (link.name === 'Cotizador') {
                return (
                  <button
                    key={link.name}
                    onClick={() => setIsQuoteModalOpen(true)}
                    className="relative px-3.5 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30 animate-pulse">
                        {link.badge}
                      </span>
                    )}
                  </button>
                );
              }

              return (
                <a
                  key={link.name}
                  href={link.href}
                  className="relative px-3.5 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5 flex items-center gap-1.5"
                >
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30 animate-pulse">
                      {link.badge}
                    </span>
                  )}
                </a>
              );
            })}
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
              onClick={() => {
                if (typeof window.gtag === 'function') {
                  window.gtag('event', 'conversion', { 'send_to': 'AW-18464752657' });
                }
                trackWhatsAppClick({ source: 'navbar_desktop', whatsappUrl });
                trackClickLlamadaOMapa({ type: 'whatsapp_navbar_desktop', label: 'WhatsApp Navbar Desktop', url: whatsappUrl });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#FF5500] hover:bg-[#FF6600] rounded-xl shadow-[0_0_15px_rgba(255,85,0,0.4)] hover:shadow-[0_0_22px_rgba(255,85,0,0.65)] transition-all duration-300 transform active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white text-transparent" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Botón menú móvil */}
          <div className="flex md:hidden items-center space-x-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (typeof window.gtag === 'function') {
                  window.gtag('event', 'conversion', { 'send_to': 'AW-18464752657' });
                }
                trackWhatsAppClick({ source: 'navbar_mobile', whatsappUrl });
                trackClickLlamadaOMapa({ type: 'whatsapp_navbar_mobile', label: 'WhatsApp Navbar Mobile', url: whatsappUrl });
              }}
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
            {navLinks.map((link) => {
              if (link.name === 'Cotizador') {
                return (
                  <button
                    key={link.name}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsQuoteModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors text-left"
                  >
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[#FF5500]/20 text-[#FF5500]">
                        {link.badge}
                      </span>
                    )}
                  </button>
                );
              }

              return (
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
              );
            })}
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
