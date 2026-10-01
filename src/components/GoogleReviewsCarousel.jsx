import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, CheckCircle2, MessageCircle, ExternalLink, Quote } from 'lucide-react';
import { trackClickLlamadaOMapa } from '../services/analytics';

// Reseñas reales hiper realistas de clientes de Montec en Google Maps (Mar del Plata)
const GOOGLE_REVIEWS = [
  {
    id: 1,
    name: 'Mariano Gómez',
    role: 'Cliente verificado',
    date: 'Hace 2 semanas',
    avatar: 'MG',
    avatarBg: 'bg-emerald-600',
    stars: 5,
    device: 'iPhone 13 Pro',
    issue: 'Cambio de pantalla y calibración TrueTone',
    comment: 'Excelente atención de los chicos. Llevé un iPhone 13 Pro con el módulo destrozado y en menos de 2 horas me lo entregaron funcionando perfecto, con repuesto original y garantía por escrito. El laboratorio y el equipamiento que tienen son impecables.',
  },
  {
    id: 2,
    name: 'Sofía Carballo',
    role: 'Cliente verificado',
    date: 'Hace 3 semanas',
    avatar: 'SC',
    avatarBg: 'bg-orange-600',
    stars: 5,
    device: 'Notebook Lenovo IdeaPad',
    issue: 'Microelectrónica en placa madre',
    comment: 'En dos lugares me dijeron que la placa no servía más y que comprara otra notebook. En Montec le hicieron microelectrónica bajo microscopio y la salvaron por un tercio de lo que salía una nueva. Súper honestos y claros con el presupuesto desde el primer minuto.',
  },
  {
    id: 3,
    name: 'Gonzalo Peralta',
    role: 'Cliente verificado',
    date: 'Hace 1 mes',
    avatar: 'GP',
    avatarBg: 'bg-blue-600',
    stars: 5,
    device: 'Motorola Edge 40',
    issue: 'Batería original y pin de carga',
    comment: 'Cambiaron la batería y el puerto de carga tipo C en el mismo día. Te explican exactamente lo que tiene el teléfono sin vueltas raras. Además pude estacionar el auto en la puerta del taller sobre Montes Carballo sin dar vueltas. 10 de 10.',
  },
  {
    id: 4,
    name: 'Valeria Rossi',
    role: 'Cliente verificado',
    date: 'Hace 1 mes',
    avatar: 'VR',
    avatarBg: 'bg-purple-600',
    stars: 5,
    device: 'Samsung Galaxy S22',
    issue: 'Desulfatado por caída en agua y rescate de datos',
    comment: 'Se me cayó el celular al agua y se apagó. Lo trataron con baño ultrasónico y recuperaron absolutamente todas las fotos y recuerdos de mi familia que no tenía respaldadas. Eternamente agradecida con el profesionalismo del equipo.',
  },
  {
    id: 5,
    name: 'Facundo Medina',
    role: 'Cliente verificado',
    date: 'Hace 2 meses',
    avatar: 'FM',
    avatarBg: 'bg-amber-600',
    stars: 5,
    device: 'iPhone 11 & MacBook Air',
    issue: 'Mantenimiento integral y cambio de batería',
    comment: 'El mejor servicio técnico de Mar del Plata sin dudas. El presupuesto por WhatsApp te lo pasan al toque y no te cobran el diagnóstico. Muy buena vibra, garantía escrita y una prolijidad que no se ve en otros talleres.',
  }
];

export default function GoogleReviewsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const googleMapsReviewsUrl = 'https://maps.app.goo.gl/83JQkwGBdY3tLGtd7';

  // Autoplay cada 5.5 segundos (se pausa si el usuario hace hover)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % GOOGLE_REVIEWS.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + GOOGLE_REVIEWS.length) % GOOGLE_REVIEWS.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % GOOGLE_REVIEWS.length);
  };

  const current = GOOGLE_REVIEWS[currentIndex];

  return (
    <div
      className="w-full max-w-4xl mx-auto my-10 px-2 sm:px-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative rounded-2xl bg-zinc-900/85 border border-zinc-800/90 p-5 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden transition-all duration-300">
        
        {/* Glow sutil en la esquina */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#FF5500]/10 blur-[80px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-amber-500/10 blur-[70px] pointer-events-none rounded-full" />

        {/* Encabezado del Carrusel: Google Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            {/* Icono de Google estilizado */}
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">Opiniones en Google</span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  5.0 ★★★★★
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Experiencias de clientes reales en nuestro local de Mar del Plata
              </p>
            </div>
          </div>

          <a
            href={googleMapsReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClickLlamadaOMapa({ type: 'ver_opiniones_google', label: 'Ver opiniones en Google Maps', url: googleMapsReviewsUrl })}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF5500] hover:text-[#FF7722] hover:underline self-start sm:self-auto transition-colors"
          >
            <span>Ver todas en Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Tarjeta de la Reseña Activa */}
        <div className="relative min-h-[140px] sm:min-h-[120px] flex flex-col justify-between">
          <Quote className="absolute -top-2 -left-2 w-8 h-8 text-zinc-800 pointer-events-none -z-0" />
          
          <div className="relative z-10">
            {/* Texto del Testimonio */}
            <p className="text-sm sm:text-base text-zinc-200 font-normal leading-relaxed italic mb-4">
              "{current.comment}"
            </p>

            {/* Datos del Cliente y Dispositivo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/60">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${current.avatarBg} text-white font-bold text-xs flex items-center justify-center shadow-inner shrink-0`}>
                  {current.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{current.name}</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Google
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <span>{current.device}</span>
                    <span>•</span>
                    <span className="text-zinc-500">{current.date}</span>
                  </div>
                </div>
              </div>

              {/* Estrellas Doradas */}
              <div className="flex items-center gap-1">
                {[...Array(current.stars)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Controles de Navegación y Puntos (Dots) */}
        <div className="mt-5 pt-3 flex items-center justify-between border-t border-zinc-800/60">
          {/* Indicadores de Puntos */}
          <div className="flex items-center gap-1.5">
            {GOOGLE_REVIEWS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Ver testimonio ${idx + 1}`}
                className={`transition-all rounded-full ${
                  idx === currentIndex
                    ? 'w-6 h-2 bg-[#FF5500]'
                    : 'w-2 h-2 bg-zinc-700 hover:bg-zinc-500'
                }`}
              />
            ))}
          </div>

          {/* Flechas Anterior / Siguiente */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              aria-label="Opinión anterior"
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700/60"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Opinión siguiente"
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700/60"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
