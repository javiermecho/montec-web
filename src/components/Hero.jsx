import React from 'react';
import {
  Wrench,
  ShieldCheck,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  MessageCircle,
  MapPin,
  Star,
  ExternalLink,
  Award
} from 'lucide-react';
import MontecLogo from './MontecLogo';
import GoogleReviewsCarousel from './GoogleReviewsCarousel';
import { useData } from '../context/DataContext';
import { trackWhatsAppClick, trackClickLlamadaOMapa } from '../services/analytics';

export default function Hero() {
  const { setIsQuoteModalOpen, businessConfig } = useData();

  const brands = [
    { name: 'Apple', icon: '', desc: 'iPhone • iPad • Mac' },
    { name: 'Samsung', icon: 'SAMSUNG', desc: 'Galaxy S • A • Z' },
    { name: 'Motorola', icon: 'M', desc: 'Edge • Moto G • E' },
    { name: 'Xiaomi', icon: 'mi', desc: 'Redmi • Poco • Xiaomi' },
    { name: 'Lenovo', icon: 'Lenovo', desc: 'IdeaPad • ThinkPad' },
    { name: 'HP', icon: 'hp', desc: 'Pavilion • Victus • Envy' }
  ];

  const highlights = [
    { text: 'Reparaciones en el día (2 a 3 hs)' },
    { text: '30 días de Garantía Escrita' },
    { text: 'Diagnóstico Honesto Sin Cargo' },
    { text: 'Laboratorio Propio en Mar del Plata' }
  ];

  const rawWhatsapp = businessConfig?.contact?.quotationWhatsapp || businessConfig?.contact?.supportPhone || '5492235444991';
  const whatsappNumber = rawWhatsapp.replace(/[^0-9]/g, '') || '5492235444991';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('¡Hola montec! Quisiera consultar por el diagnóstico/reparación de mi equipo.')}`;
  const googleMapsUrl = businessConfig?.business?.googleMapsUrl || 'https://maps.app.goo.gl/83JQkwGBdY3tLGtd7';
  const instagramUrl = businessConfig?.contact?.instagramUrl || 'https://instagram.com/montec.arg';

  return (
    <section
      id="inicio"
      className="relative w-full max-w-full min-h-[95vh] flex flex-col items-center justify-center pt-32 sm:pt-36 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#0A0A0A]"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(10, 10, 10, 0.82) 0%, rgba(10, 10, 10, 0.88) 45%, rgba(10, 10, 10, 0.98) 85%, #0A0A0A 100%), url('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=2000&q=85')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Luces de Fondo Neón Ambientales */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] sm:w-[700px] h-[350px] bg-[#FF5500]/15 blur-[130px] rounded-full pointer-events-none -z-0" />
      <div className="absolute bottom-20 right-10 w-[300px] h-[250px] bg-amber-500/10 blur-[110px] rounded-full pointer-events-none -z-0" />

      {/* Grid sutil de fondo tecnológico */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none -z-0"
      />

      <div className="max-w-5xl mx-auto text-center relative z-10">

        {/* Badge superior de especialidad */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700/80 shadow-lg mb-5 backdrop-blur-md">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5500] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5500]"></span>
          </span>
          <span className="text-xs sm:text-sm font-semibold text-zinc-200">
            Servicio Técnico Independiente • Taller Multimarca en Mar del Plata
          </span>
        </div>

        {/* Titular Principal */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-heading text-white tracking-tight leading-[1.12] mb-4">
          Servicio Técnico <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
            de Celulares y PC
          </span>{' '}
          <span className="block text-2xl sm:text-4xl lg:text-5xl font-bold text-[#FF5500] drop-shadow-[0_0_30px_rgba(255,85,0,0.5)] mt-2">
            Mar del Plata - Constitución
          </span>
        </h1>

        {/* ============================================================== */}
        {/* BADGE DE CONFIANZA (SOCIAL PROOF) JUSTO DEBAJO DEL TÍTULO      */}
        {/* ============================================================== */}
        <div className="inline-flex items-center gap-2 sm:gap-2.5 px-4 py-2 rounded-2xl bg-zinc-900/90 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] backdrop-blur-md mb-6 flex-wrap justify-center">
          <div className="flex items-center gap-0.5 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
            ))}
          </div>
          <span className="text-xs sm:text-sm font-semibold text-white">
            Laboratorio Especializado Multimarca • Garantía Escrita • Calificación 5 estrellas en Google
          </span>
        </div>

        {/* Subtítulo descriptivo */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg lg:text-xl text-zinc-300 font-normal leading-relaxed mb-8">
          Reparación profesional de hardware para celulares <strong className="text-white">iPhone</strong>, <strong className="text-white">Android</strong> y <strong className="text-white">Notebooks</strong> con repuestos seleccionados de calidad premium, instrumental de precisión y entrega en el día en Montes Carballo 943 (Constitución • a metros de ex Sobremonte • estacionamiento libre en la puerta).
        </p>

        {/* ============================================================== */}
        {/* BOTONES DE ACCIÓN PRINCIPALES (CTAs)                           */}
        {/* ============================================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-6">
          {/* Botón 1 (Primario): WhatsApp / Diagnóstico */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (typeof window.gtag === 'function') {
                window.gtag('event', 'conversion', { 'send_to': 'AW-18464752657' });
              }
              trackWhatsAppClick({ source: 'hero_primary_whatsapp', whatsappUrl });
              trackClickLlamadaOMapa({ type: 'whatsapp_hero', label: 'Consultar por WhatsApp Hero', url: whatsappUrl });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 text-base font-bold text-white bg-[#FF5500] hover:bg-[#FF6600] rounded-xl shadow-[0_0_25px_rgba(255,85,0,0.5)] hover:shadow-[0_0_35px_rgba(255,85,0,0.75)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <MessageCircle className="w-5 h-5 fill-white text-transparent" />
            <span>Consultar por WhatsApp / Diagnóstico</span>
          </a>

          {/* Botón 2 (Secundario / Confianza): Ver en Google Maps */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClickLlamadaOMapa({ type: 'hero_google_maps', label: 'Ver en Google Maps Hero', url: googleMapsUrl })}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-zinc-200 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded-xl transition-all duration-200 shadow-md"
          >
            <MapPin className="w-5 h-5 text-[#FF5500]" />
            <span>Ver en Google Maps</span>
            <ExternalLink className="w-4 h-4 text-zinc-400" />
          </a>

          {/* Botón Cotizar en la Web (Modal) */}
          <button
            onClick={() => setIsQuoteModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-zinc-300 hover:text-white bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all duration-200"
          >
            <Wrench className="w-4 h-4 text-orange-400" />
            <span>Cotizar Online</span>
          </button>
        </div>

        {/* Enlace o botón secundario: Instagram */}
        <div className="mb-10">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClickLlamadaOMapa({ type: 'hero_instagram', label: 'Seguinos en Instagram Hero', url: instagramUrl })}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-400 hover:text-pink-300 transition-colors py-1 px-3 rounded-full hover:bg-zinc-900/70 border border-transparent hover:border-pink-500/30 group"
          >
            <svg className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span>Seguinos en Instagram para ver reparaciones reales (<strong>@montec.ar</strong>)</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-pink-300 transition-colors" />
          </a>
        </div>

        {/* Puntos destacados / Pilares inmediatos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-6 text-left">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md"
            >
              <CheckCircle2 className="w-4 h-4 text-[#FF5500] shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-zinc-200 leading-tight">
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* ============================================================== */}
        {/* CARRUSEL DE RESEÑAS REALES DE GOOGLE MAPS                      */}
        {/* ============================================================== */}
        <GoogleReviewsCarousel />

        {/* Marcas Soportadas */}
        <div className="border-t border-zinc-800/80 pt-8 max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-5 text-center">
            Laboratorio multimarca con repuestos en stock permanente
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {brands.map((b) => (
              <div
                key={b.name}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:border-[#FF5500]/40 transition-colors group backdrop-blur-sm"
              >
                <span className="font-heading font-bold text-base text-zinc-300 group-hover:text-white transition-colors">
                  {b.name}
                </span>
                <span className="text-[10px] text-zinc-400 group-hover:text-zinc-300 text-center mt-0.5">
                  {b.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Flecha indicadora de scroll */}
      <div className="mt-8 text-zinc-500 animate-bounce">
        <a href="#cotizador" aria-label="Desplazarse al cotizador">
          <ChevronDown className="w-6 h-6 hover:text-[#FF5500] transition-colors" />
        </a>
      </div>
    </section>
  );
}
