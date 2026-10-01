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
      {/* Barra superior de confianza / Top Announcement Bar */}
      <div className="max-w-7xl mx-auto mb-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-zinc-950/95 border border-zinc-800/90 text-[10px] sm:text-[11px] text-zinc-300 flex items-center justify-between gap-2 shadow-xs backdrop-blur-md overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 sm:gap-3 flex-nowrap shrink-0">
          <a
            href="https://maps.app.goo.gl/83JQkwGBdY3tLGtd7"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClickLlamadaOMapa({ type: 'topbar_google_reviews', label: 'Top Bar Google 5.0', url: 'https://maps.app.goo.gl/83JQkwGBdY3tLGtd7' })}
            className="flex items-center gap-1.5 text-zinc-200 hover:text-white transition-colors group"
          >
            <span className="text-amber-400">⭐</span>
            <strong className="text-white group-hover:text-amber-300 transition-colors">5.0 en Google</strong>
            <span className="hidden sm:inline text-zinc-400 group-hover:text-zinc-200">(Montec - Servicio Técnico Celulares)</span>
          </a>

          <span className="text-zinc-700">•</span>

          <a
            href="https://maps.app.goo.gl/83JQkwGBdY3tLGtd7"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-zinc-300 hover:text-[#FF5500] transition-colors whitespace-nowrap"
          >
            <span>📍</span>
            <span className="font-medium">Montes Carballo 943, Mar del Plata</span>
          </a>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden lg:inline text-zinc-700">•</span>
          <span className="hidden lg:inline text-emerald-400 font-medium">🚗 Estacionamiento libre en la puerta</span>
          
          <span className="text-zinc-700 hidden sm:inline">•</span>

          <a
            href="https://instagram.com/montec.arg"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClickLlamadaOMapa({ type: 'topbar_instagram', label: 'Top Bar Instagram @montec.ar', url: 'https://instagram.com/montec.arg' })}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-pink-300 hover:text-white transition-all whitespace-nowrap font-medium"
            title="Seguinos en Instagram"
          >
            <svg className="w-3 h-3 text-pink-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span>@montec.ar</span>
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
