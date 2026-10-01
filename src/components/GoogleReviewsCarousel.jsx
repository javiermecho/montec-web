import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, CheckCircle2, ExternalLink, Quote, MessageSquare } from 'lucide-react';
import { trackClickLlamadaOMapa } from '../services/analytics';

// Reseñas 100% REALES extraídas directamente de la ficha oficial de Google Maps:
// "Montec - Servicio Técnico Celulares" (32 opiniones • 5.0 estrellas)
const REAL_GOOGLE_REVIEWS = [
  {
    id: 1,
    name: 'Silvia Rebay',
    role: '2 opiniones',
    date: 'Hace pocos días',
    avatar: 'SR',
    avatarBg: 'bg-emerald-600',
    stars: 5,
    comment: 'Sin dudas lo recomiendo, por su prolijidad, predisposición y precio acorde. Muchas gracias! Muy conforme',
    ownerResponse: null
  },
  {
    id: 2,
    name: 'Javier Falip',
    role: 'Cliente verificado',
    date: 'Hace pocos días',
    avatar: 'JF',
    avatarBg: 'bg-blue-600',
    stars: 5,
    comment: 'Un servicio rápido y confiable! Muy buen precio! Recomiendo',
    ownerResponse: 'Gracias Javi! 💪🏾'
  },
  {
    id: 3,
    name: 'Lean Cler',
    role: '3 opiniones',
    date: 'Hace pocos días',
    avatar: 'LC',
    avatarBg: 'bg-orange-600',
    stars: 5,
    comment: 'Excelente servicio! Rapidez, compromiso y buen precio. Recomiendo!!',
    ownerResponse: null
  },
  {
    id: 4,
    name: 'martin baillieau',
    role: 'Local Guide · 4 opiniones',
    date: 'Hace pocos días',
    avatar: 'MB',
    avatarBg: 'bg-purple-600',
    stars: 5,
    comment: 'Excelente servicio y atencion. Muy buen precio!',
    ownerResponse: null
  },
  {
    id: 5,
    name: 'Franco Lamatina',
    role: 'Cliente verificado',
    date: 'Hace pocos días',
    avatar: 'FL',
    avatarBg: 'bg-cyan-600',
    stars: 5,
    comment: 'Excelentes productos, muy buena atención, lo recomiendo.',
    ownerResponse: null
  },
  {
    id: 6,
    name: 'marcelo orsini',
    role: '3 opiniones',
    date: 'Hace pocos días',
    avatar: 'MO',
    avatarBg: 'bg-rose-600',
    stars: 5,
    comment: 'Calidad en atención. Exelente calidad en repuestos y celus nuevos!!',
    ownerResponse: 'Gracias 🫂 Marce!'
  },
  {
    id: 7,
    name: 'Anyi Romano',
    role: '5 opiniones',
    date: 'Hace pocos días',
    avatar: 'AR',
    avatarBg: 'bg-amber-600',
    stars: 5,
    comment: 'Excelente atención! Lo recomiendo',
    ownerResponse: null
  },
  {
    id: 8,
    name: 'Lautaro Sanchez',
    role: 'Cliente verificado',
    date: 'Hace pocos días',
    avatar: 'LS',
    avatarBg: 'bg-teal-600',
    stars: 5,
    comment: 'Excelente servicio',
    ownerResponse: null
  },
  {
    id: 9,
    name: 'Gabriel Mocciaro',
    role: '2 opiniones',
    date: 'Hace pocos días',
    avatar: 'GM',
    avatarBg: 'bg-indigo-600',
    stars: 5,
    comment: 'Excelente servicio ! Muchas gracias',
    ownerResponse: null
  },
  {
    id: 10,
    name: 'Ayeray Bonansea',
    role: 'Local Guide · 39 opiniones',
    date: 'Hace pocos días',
    avatar: 'AB',
    avatarBg: 'bg-pink-600',
    stars: 5,
    comment: 'Excelente servicio',
    ownerResponse: null
  }
];

export default function GoogleReviewsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const googleMapsReviewsUrl = 'https://maps.app.goo.gl/83JQkwGBdY3tLGtd7';

  // Rotación automática cada 5.5s (pausa al poner el mouse encima)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % REAL_GOOGLE_REVIEWS.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + REAL_GOOGLE_REVIEWS.length) % REAL_GOOGLE_REVIEWS.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % REAL_GOOGLE_REVIEWS.length);
  };

  const current = REAL_GOOGLE_REVIEWS[currentIndex];

  return (
    <div
      className="w-full max-w-4xl mx-auto my-10 px-2 sm:px-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative rounded-2xl bg-zinc-900/85 border border-zinc-800/90 p-5 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden transition-all duration-300">
        
        {/* Glow sutil ambiental */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#FF5500]/10 blur-[80px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-amber-500/10 blur-[70px] pointer-events-none rounded-full" />

        {/* Encabezado del Carrusel: Google Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            {/* Logo oficial de Google */}
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
                <span className="text-sm font-bold text-white tracking-wide">Opiniones Reales en Google Maps</span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  5.0 ★★★★★ (32 opiniones)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Montec - Servicio Técnico Celulares • Montes Carballo 943, Mar del Plata
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
            <span>Ver todas las 32 en Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Tarjeta de la Reseña Activa */}
        <div className="relative min-h-[140px] flex flex-col justify-between">
          <Quote className="absolute -top-2 -left-2 w-8 h-8 text-zinc-800 pointer-events-none -z-0" />
          
          <div className="relative z-10">
            {/* Texto del Testimonio Real */}
            <p className="text-sm sm:text-base text-zinc-100 font-normal leading-relaxed italic mb-4">
              "{current.comment}"
            </p>

            {/* Respuesta del Propietario si existe */}
            {current.ownerResponse && (
              <div className="mb-4 pl-3 py-1.5 border-l-2 border-[#FF5500] bg-zinc-950/60 rounded-r-lg text-xs text-zinc-300 flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-[#FF5500] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Respuesta de Montec:</span> {current.ownerResponse}
                </div>
              </div>
            )}

            {/* Datos del Cliente */}
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
                      Google Maps
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <span>{current.role}</span>
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
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-none">
            {REAL_GOOGLE_REVIEWS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Ver testimonio ${idx + 1}`}
                className={`transition-all rounded-full shrink-0 ${
                  idx === currentIndex
                    ? 'w-6 h-2 bg-[#FF5500]'
                    : 'w-2 h-2 bg-zinc-700 hover:bg-zinc-500'
                }`}
              />
            ))}
          </div>

          {/* Flechas Anterior / Siguiente */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-mono text-zinc-500 mr-2 hidden sm:inline">
              {currentIndex + 1} de {REAL_GOOGLE_REVIEWS.length}
            </span>
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
