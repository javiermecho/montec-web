import React, { useState, useEffect } from 'react';
import { 
  History, 
  Cpu, 
  Smartphone, 
  Wrench, 
  MapPin, 
  Award, 
  Quote, 
  CheckCircle2, 
  MessageCircle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  Monitor, 
  Users, 
  Microscope,
  ZoomIn,
  X,
  ExternalLink
} from 'lucide-react';
import MontecLogo from '../components/MontecLogo';
import Footer from '../components/Footer';
import { trackWhatsAppClick, trackClickLlamadaOMapa } from '../services/analytics';
import { useData } from '../context/DataContext';

export default function HistoryPage({ onNavigateHome }) {
  const { setIsQuoteModalOpen, businessConfig } = useData();
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Asegurar scroll al tope al ingresar a la página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const originalTitle = document.title;
    document.title = 'Nuestra Historia • 12 Años de Trayectoria | Montec Mar del Plata';
    return () => {
      document.title = originalTitle;
    };
  }, []);

  const rawWhatsapp = businessConfig?.contact?.quotationWhatsapp || businessConfig?.contact?.supportPhone || '5492235444991';
  const whatsappNumber = rawWhatsapp.replace(/[^0-9]/g, '') || '5492235444991';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('¡Hola Javier! Leí la historia de Montec en la web y me gustaría hacer una consulta técnica.')}`;

  const handleGoHome = (e) => {
    if (e) e.preventDefault();
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hitos de la historia del fundador Javier Villar
  const timelineMilestones = [
    {
      year: '2000',
      period: 'El origen en Mechongué',
      icon: Monitor,
      title: 'Los primeros pasos entre cables y motherboards',
      description: 'El entusiasmo nació desarmando y reparando computadoras con curiosidad autodidacta en Mechongué. Horas investigando cada circuito, fuente y sistema operativo cuando Internet todavía hacía ruido al conectar.',
      tag: 'Primeros Pasos'
    },
    {
      year: '2004 - 2008',
      period: 'JAVA Computación',
      icon: Cpu,
      title: 'Estudios de programación y soporte técnico a domicilio',
      description: 'Años de formación intensiva en sistemas y lógica de programación. Nacía el primer servicio técnico formal: asistencia de PC a domicilio, diagnósticos en el acto y fidelización de los primeros clientes por honestidad y rapidez.',
      tag: 'Nace el Servicio Técnico'
    },
    {
      year: '2014',
      period: 'La era de los celulares',
      icon: Smartphone,
      title: 'Del Motorola V3 y BlackBerry al iPhone 4',
      description: 'La telefonía móvil revolucionó la electrónica. Comenzó el reemplazo de flex de Motorola V3, la recuperación por software de BlackBerry y las primeras reparaciones modulares de iPhone 4 y Galaxy S, sentando las bases del oficio móvil.',
      tag: 'Evolución Móvil'
    },
    {
      year: 'Crecimiento',
      period: 'Oficio, colegas y trayectoria',
      icon: Users,
      title: 'De técnico a comerciante: del centro a Constitución',
      description: 'Aprender al lado de grandes colegas, técnicos y socios en cada proyecto. Pasar del banco de trabajo a entender la necesidad real del cliente que necesita su herramienta de trabajo resuelta sin vueltas ni demoras.',
      tag: 'Maduración y Oficio'
    },
    {
      year: 'Hoy',
      period: 'Montec - Servicio Técnico Celulares',
      icon: Microscope,
      title: 'Todo ese recorrido volcado en un laboratorio propio',
      description: 'Un espacio pensado desde cero en Montes Carballo 943: instrumental de microelectrónica de nivel quirúrgico, microscopio trinocular, soldadura SMD y diagnóstico certero con el compromiso de siempre.',
      tag: 'Proyecto Propio'
    }
  ];

  // Galería de fotos del local y banco de trabajo
  const galleryPhotos = [
    {
      id: 1,
      src: '/historia/local-apertura1.png',
      title: 'Local Montec en Mar del Plata',
      subtitle: 'Montes Carballo 943 (Constitución)',
      category: 'Fachada y Atención',
      badge: 'Local Oficial'
    },
    {
      id: 2,
      src: '/historia/local-apertura2.png',
      title: 'Apertura y Mostrador Comercial',
      subtitle: 'Espacio cálido y profesional para recibir a cada cliente',
      category: 'Atención al Público',
      badge: 'Inauguración'
    },
    {
      id: 3,
      src: '/instagram/post3.jpg',
      title: 'Banco de Trabajo & Diagnóstico en Placa',
      subtitle: 'Inspección de líneas y cortos bajo instrumental de precisión',
      category: 'Microelectrónica',
      badge: 'Laboratorio'
    },
    {
      id: 4,
      src: '/instagram/post2.jpg',
      title: 'Estación de Baterías y Pruebas Técnicas',
      subtitle: 'Calibración, reemplazos en el día y chequeo de consumo',
      category: 'Hardware y Repuestos',
      badge: 'Precisión'
    }
  ];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#0A0A0A] text-white flex flex-col selection:bg-[#FF5500] selection:text-white">
      
      {/* ============================================================== */}
      {/* BARRA SUPERIOR EXCLUSIVA DE LA PÁGINA HISTORIA                 */}
      {/* ============================================================== */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-[#121212]/90 backdrop-blur-xl border-b border-zinc-800/90 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handleGoHome}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 text-[#FF5500] group-hover:-translate-x-0.5 transition-transform" />
              <span>Volver al Inicio</span>
            </button>

            <a href="/" onClick={handleGoHome} className="hidden sm:inline-block">
              <MontecLogo size="sm" />
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Mar del Plata • Constitución</span>
            </span>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsAppClick({ source: 'history_page_header', whatsappUrl })}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Consultar por WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>
          </div>

        </div>
      </header>

      {/* ============================================================== */}
      {/* CONTENIDO PRINCIPAL DE LA HISTORIA                             */}
      {/* ============================================================== */}
      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        
        {/* Glows Ambientales */}
        <div className="absolute top-10 left-1/4 w-[420px] h-[350px] bg-[#FF5500]/10 blur-[150px] pointer-events-none rounded-full" />
        <div className="absolute bottom-40 right-1/4 w-[380px] h-[320px] bg-amber-500/10 blur-[140px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto relative z-10">

          {/* Breadcrumb / Navegación rápida */}
          <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-8">
            <button onClick={handleGoHome} className="hover:text-white transition-colors cursor-pointer">
              Inicio
            </button>
            <span>/</span>
            <span className="text-[#FF5500] font-medium">Nuestra Historia</span>
          </nav>

          {/* 1. ENCABEZADO */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF5500]/10 border border-[#FF5500]/30 text-[#FF5500] text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
              <History className="w-3.5 h-3.5" />
              <span>De la pasión por la informática al laboratorio de microelectrónica</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-white tracking-tight leading-tight mb-5">
              12 Años de Experiencia en un Nuevo Proyecto: <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5500] to-amber-400">montec</span>
            </h1>

            <p className="text-zinc-300 text-base sm:text-lg leading-relaxed">
              Detrás de cada teléfono o computadora que ingresa al taller hay una historia de esfuerzo continuo, aprendizaje junto a grandes personas y pasión genuina por resolver lo que parece no tener arreglo.
            </p>
          </div>

          {/* 2. CITA DESTACADA DEL FUNDADOR (JAVIER VILLAR) */}
          <div className="mb-20">
            <div className="relative rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 sm:p-10 shadow-[0_15px_50px_rgba(0,0,0,0.6)] overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#FF5500]/15 blur-3xl pointer-events-none rounded-full" />
              
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 relative z-10">
                <div className="shrink-0 flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-[#FF5500] via-amber-500 to-[#FF7722] p-1 shadow-xl">
                      <div className="w-full h-full rounded-[14px] bg-zinc-950 flex flex-col items-center justify-center text-white border border-zinc-800">
                        <span className="font-heading font-black text-2xl sm:text-3xl text-white tracking-wider">JV</span>
                        <span className="text-[10px] uppercase font-mono text-[#FF5500] font-bold">Fundador</span>
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1 border-2 border-zinc-950 shadow-md">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <h3 className="text-lg font-heading font-bold text-white mt-3">Javier Villar</h3>
                  <p className="text-xs text-[#FF5500] font-medium">Fundador & Técnico Especialista</p>
                  <span className="text-[11px] text-zinc-400 mt-0.5">Mar del Plata</span>
                </div>

                <div className="flex-1 relative">
                  <Quote className="w-10 h-10 text-[#FF5500]/30 mb-2 -ml-2" />
                  <blockquote className="text-lg sm:text-2xl text-zinc-100 font-light italic leading-relaxed">
                    "Pasaron muchas personas de las que aprendí: socios, amigos, diferentes proyectos. Arrancamos con el Motorola V3 y hasta hoy nunca paré de aprender. Toda esa experiencia hoy está en Montec."
                  </blockquote>
                  
                  <div className="mt-5 flex items-center gap-3">
                    <div className="h-0.5 w-12 bg-gradient-to-r from-[#FF5500] to-transparent" />
                    <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                      Servicio técnico honesto, directo y sin intermediarios en Zona Norte / Constitución.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. LÍNEA DE TIEMPO INTERACTIVA */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-[#FF5500]">
                Trayectoria Paso a Paso
              </span>
              <h2 className="text-2xl sm:text-4xl font-heading font-bold text-white mt-1">
                El camino que forjó nuestro oficio
              </h2>
            </div>

            <div className="relative">
              <div className="hidden md:block absolute left-1/2 top-4 bottom-4 -translate-x-1/2 w-0.5 bg-gradient-to-b from-[#FF5500] via-amber-500/50 to-[#FF5500]/20" />

              <div className="space-y-8 md:space-y-12">
                {timelineMilestones.map((item, index) => {
                  const Icon = item.icon;
                  const isEven = index % 2 === 0;

                  return (
                    <div 
                      key={index} 
                      className={`relative flex flex-col md:flex-row items-center ${
                        isEven ? 'md:flex-row-reverse' : ''
                      }`}
                    >
                      <div className="w-full md:w-1/2 md:px-8">
                        <div className="group rounded-2xl bg-zinc-900/80 border border-zinc-800/90 hover:border-[#FF5500]/50 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,85,0,0.15)]">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <span className="px-3 py-1 rounded-full bg-[#FF5500]/15 border border-[#FF5500]/30 text-[#FF5500] font-mono font-bold text-xs">
                              {item.year}
                            </span>
                            <span className="text-xs font-semibold text-zinc-400">
                              {item.period}
                            </span>
                          </div>

                          <h3 className="text-lg font-heading font-bold text-white group-hover:text-amber-300 transition-colors mb-2">
                            {item.title}
                          </h3>

                          <p className="text-sm text-zinc-300 leading-relaxed">
                            {item.description}
                          </p>

                          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                            <span className="text-zinc-500 font-medium">Hito de aprendizaje</span>
                            <span className="text-amber-400/90 font-medium">{item.tag}</span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-zinc-950 border-2 border-[#FF5500] items-center justify-center text-[#FF5500] shadow-[0_0_20px_rgba(255,85,0,0.4)] z-10">
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="hidden md:block w-1/2" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. GALERÍA DE BANCO DE TRABAJO Y FOTOS REALES */}
          <div className="mb-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#FF5500]">
                  Transparencia Total
                </span>
                <h2 className="text-2xl sm:text-4xl font-heading font-bold text-white mt-1">
                  Nuestro Banco de Trabajo y Local
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Conocé dónde tratamos tu dispositivo. Instrumental cuidado y un espacio pensado para dar el mejor servicio.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {galleryPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group relative rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#FF5500]/60 overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_35px_rgba(255,85,0,0.2)] cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-950">
                    <img
                      src={photo.src}
                      alt={photo.title}
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 text-[10px] font-semibold text-zinc-200">
                      {photo.badge}
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                      <div className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20">
                        <ZoomIn className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between bg-zinc-900/80">
                    <div>
                      <span className="text-[11px] font-mono text-[#FF5500] font-semibold uppercase tracking-wider">
                        {photo.category}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors mt-0.5 leading-snug">
                        {photo.title}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {photo.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal de Foto Ampliada */}
          {selectedPhoto && (
            <div 
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setSelectedPhoto(null)}
            >
              <div 
                className="relative max-w-3xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedPhoto(null)}
                  aria-label="Cerrar vista ampliada"
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="rounded-2xl overflow-hidden max-h-[70vh] bg-black flex items-center justify-center mb-4">
                  <img
                    src={selectedPhoto.src}
                    alt={selectedPhoto.title}
                    className="max-h-[70vh] w-auto object-contain"
                  />
                </div>

                <div>
                  <span className="text-xs font-mono font-bold text-[#FF5500] uppercase tracking-wider">
                    {selectedPhoto.category}
                  </span>
                  <h3 className="text-xl font-heading font-bold text-white mt-1">
                    {selectedPhoto.title}
                  </h3>
                  <p className="text-sm text-zinc-300 mt-1">
                    {selectedPhoto.subtitle}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. LLAMADO A LA ACCIÓN (CTA FINAL) */}
          <div className="rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-60 h-60 bg-[#FF5500]/15 blur-3xl pointer-events-none rounded-full" />
            
            <div className="max-w-2xl mx-auto relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Diagnóstico Honesto • Presupuesto Sin Cargo</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-white mb-3">
                ¿Tu equipo no enciende o tiene una falla compleja?
              </h2>

              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-8">
                Dejá tu celular o notebook en manos de un técnico con 12 años de oficio real. Te decimos exactamente lo que tiene sin sorpresas ni sobrecostos.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (typeof window.gtag === 'function') {
                      window.gtag('event', 'conversion', { 'send_to': 'AW-18464752657' });
                    }
                    trackWhatsAppClick({ source: 'historia_cta_diagnostico_page', whatsappUrl });
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white font-bold text-sm shadow-[0_0_25px_rgba(255,85,0,0.4)] transition-all hover:scale-102 cursor-pointer active:scale-98"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>Traé tu equipo a diagnóstico</span>
                </a>

                <button
                  onClick={() => {
                    handleGoHome();
                    setTimeout(() => {
                      setIsQuoteModalOpen(true);
                    }, 100);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white font-bold text-sm transition-all cursor-pointer"
                >
                  <span>Calcular presupuesto online</span>
                  <ArrowRight className="w-4 h-4 text-[#FF5500]" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER OFICIAL DE LA PÁGINA */}
      <Footer />

    </div>
  );
}
