import React from 'react';
import { 
  Instagram, 
  ExternalLink, 
  Play, 
  Layers, 
  Image as ImageIcon, 
  Sparkles,
  Heart,
  MessageCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { trackClickLlamadaOMapa } from '../services/analytics';

const INSTAGRAM_POSTS = [
  {
    id: 'Dd9QCzUkcLR',
    type: 'carousel',
    typeLabel: 'Última Publicación',
    url: 'https://www.instagram.com/montec.arg/p/Dd9QCzUkcLR/',
    image: '/instagram/post1.jpg',
    title: 'Reparaciones y reemplazo de pantallas en el día',
    subtitle: 'Trabajos de microelectrónica y módulos originales en nuestro taller',
    date: '1 de Octubre, 2026',
    likesCount: '48',
    commentsCount: '6'
  },
  {
    id: 'Dd6gZFjRAy0',
    type: 'reel',
    typeLabel: 'Reel / Video',
    url: 'https://www.instagram.com/montec.arg/reel/Dd6gZFjRAy0/',
    image: '/instagram/post2.jpg',
    title: 'Baterías, diagnóstico y calibración de carga',
    subtitle: 'Proceso de prueba y reemplazo seguro en banco de trabajo',
    date: '30 de Septiembre, 2026',
    likesCount: '84',
    commentsCount: '12'
  },
  {
    id: 'DdrhT42m0uA',
    type: 'image',
    typeLabel: 'En Laboratorio',
    url: 'https://www.instagram.com/montec.arg/p/DdrhT42m0uA/',
    image: '/instagram/post3.jpg',
    title: 'Solución a fallas de encendido y display',
    subtitle: 'Diagnóstico honesto y presupuesto previo sin sorpresas',
    date: '24 de Septiembre, 2026',
    likesCount: '62',
    commentsCount: '9'
  },
  {
    id: 'DdhvQkLRRMU',
    type: 'image',
    typeLabel: 'Guía de Servicios',
    url: 'https://www.instagram.com/montec.arg/p/DdhvQkLRRMU/',
    image: '/instagram/post4.jpg',
    title: 'Servicio integral: iPhone, Android, Mac y PC',
    subtitle: 'Montes Carballo 943 • Mar del Plata (Zona Constitución)',
    date: '20 de Septiembre, 2026',
    likesCount: '95',
    commentsCount: '15'
  }
];

export default function InstagramFeed() {
  const instagramProfileUrl = 'https://www.instagram.com/montec.arg';

  return (
    <section id="instagram" className="py-20 px-4 sm:px-6 lg:px-8 relative bg-zinc-950/90 border-t border-zinc-900 w-full max-w-full overflow-hidden">
      
      {/* Luces de Fondo Estilo Instagram */}
      <div className="absolute top-10 left-1/4 w-[380px] h-[300px] bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-orange-500/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-1/4 w-[340px] h-[280px] bg-[#FF5500]/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Encabezado Principal */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/15 via-pink-500/15 to-orange-500/15 border border-pink-500/30 text-pink-400 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
              <Instagram className="w-3.5 h-3.5" />
              <span>Comunidad y Trabajos en Vivo</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight mb-3">
              Seguinos en <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045]">Instagram</span>
            </h2>
            
            <p className="text-zinc-400 text-sm sm:text-base max-w-xl">
              Mirá las últimas reparaciones reales, procesos de laboratorio y novedades directamente desde nuestra cuenta oficial.
            </p>
          </div>

          {/* Tarjeta Perfil Rápido + Botón Seguir */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl backdrop-blur-md self-start md:self-auto">
            <div className="relative">
              {/* Anillo de Historias con Degradado de Instagram */}
              <div className="w-13 h-13 p-0.5 rounded-full bg-gradient-to-tr from-[#FFB703] via-[#FD1D1D] to-[#833AB4] shadow-md flex items-center justify-center">
                <img
                  src="/instagram/avatar.jpg"
                  alt="Perfil oficial Montec"
                  className="w-12 h-12 rounded-full object-cover border-2 border-zinc-950"
                  onError={(e) => {
                    // Fallback visual si la imagen tarda en responder
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-zinc-950">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">@montec.arg</span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  Oficial
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Servicio Técnico • Mar del Plata</p>
            </div>

            <a
              href={instagramProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClickLlamadaOMapa({ type: 'instagram_follow_header', label: 'Seguir en Instagram', url: instagramProfileUrl })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] hover:opacity-90 text-white font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer active:scale-95"
            >
              <span>Seguir</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Grid de las 4 publicaciones recientes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {INSTAGRAM_POSTS.map((post) => {
            const isReel = post.type === 'reel';
            const isCarousel = post.type === 'carousel';

            return (
              <a
                key={post.id}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClickLlamadaOMapa({ type: 'instagram_post_click', label: `Post ${post.id}`, url: post.url })}
                className="group relative flex flex-col rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-pink-500/50 overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(253,29,29,0.15)] cursor-pointer"
              >
                {/* Contenedor de la Imagen Cuadrada con Aspect Ratio 1:1 */}
                <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Overlay Gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Badge de tipo de contenido en la esquina superior derecha */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white shadow-md">
                    {isReel ? (
                      <>
                        <Play className="w-3 h-3 fill-current text-pink-400" />
                        <span>Reel</span>
                      </>
                    ) : isCarousel ? (
                      <>
                        <Layers className="w-3 h-3 text-orange-400" />
                        <span>Galería</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3 text-amber-400" />
                        <span>Foto</span>
                      </>
                    )}
                  </div>

                  {/* Badge de Fecha / Novedad en la esquina superior izquierda */}
                  <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-md bg-zinc-900/80 backdrop-blur-md border border-zinc-700/80 text-[10px] font-semibold text-zinc-300">
                    {post.typeLabel}
                  </div>

                  {/* Hover Overlay con Botón Instagram Central */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-zinc-950 font-bold text-xs shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                      <Instagram className="w-4 h-4 text-[#FD1D1D]" />
                      <span>Ver en Instagram</span>
                    </div>
                  </div>
                </div>

                {/* Contenido descriptivo del post */}
                <div className="p-4 flex-1 flex flex-col justify-between bg-zinc-900/70">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {post.subtitle}
                    </p>
                  </div>

                  {/* Footer del card con fecha e interacciones */}
                  <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="font-mono">{post.date}</span>
                    <div className="flex items-center gap-2.5 text-zinc-400">
                      <span className="flex items-center gap-1 group-hover:text-pink-400 transition-colors">
                        <Heart className="w-3 h-3" />
                        {post.likesCount}
                      </span>
                      <span className="flex items-center gap-1 group-hover:text-zinc-200 transition-colors">
                        <MessageCircle className="w-3 h-3" />
                        {post.commentsCount}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Banner Inferior de Llamado a la Acción (CTA) */}
        <div className="mt-10 p-5 rounded-2xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">¿Querés ver el paso a paso de una reparación?</h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Subimos videos semanales de microelectrónica, cambios de módulo y consejos para prolongar la vida útil de tu equipo.
              </p>
            </div>
          </div>

          <a
            href={instagramProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClickLlamadaOMapa({ type: 'instagram_cta_bottom', label: 'Abrir perfil @montec.arg', url: instagramProfileUrl })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 hover:border-pink-500/50 shadow-sm transition-all whitespace-nowrap cursor-pointer"
          >
            <Instagram className="w-4 h-4 text-pink-400" />
            <span>Explorar @montec.arg</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>
        </div>

      </div>
    </section>
  );
}
