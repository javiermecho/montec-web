import React from 'react';
import { Microscope, Award, Zap, ShieldCheck, Cpu, CheckCircle2, FileCheck, Layers } from 'lucide-react';

export default function Laboratory() {
  const pillars = [
    {
      icon: Award,
      title: '12 Años de Trayectoria',
      subtitle: 'Microelectrónica Avanzada',
      desc: 'Solucionamos fallas complejas a nivel de componentes (PMIC, cortocircuitos, líneas rotas, fallas de backlight) que otros servicios técnicos descartan.'
    },
    {
      icon: FileCheck,
      title: 'Diagnóstico Honesto',
      subtitle: 'Presupuesto 100% Sin Cargo',
      desc: 'Revisamos tu equipo en nuestro laboratorio de Montes Carballo 943 sin costo. Te explicamos exactamente el problema antes de realizar cualquier intervención.'
    },
    {
      icon: Zap,
      title: 'Reparaciones en el Día',
      subtitle: '2 a 3 hs • Express con Cita Previa',
      desc: 'Realizamos reparaciones en el día (de 2 a 3 hs). Servicio express en 45 min únicamente con cita previa y seña confirmada para que no te quedes incomunicado.'
    },
    {
      icon: ShieldCheck,
      title: 'Repuestos Seleccionados',
      subtitle: 'Garantía Escrita de 90 Días',
      desc: 'Trabajamos con repuestos OEM y módulos testeados individualmente. Todas nuestras reparaciones incluyen comprobante de garantía formal.'
    }
  ];

  const tools = [
    { name: 'Microscopio Triocular de Alta Definición', desc: 'Soldadura de pistas BGA y microcomponentes' },
    { name: 'Estaciones de Soldado JBC y Aire Caliente', desc: 'Control de perfil térmico exacto sin dañar la placa' },
    { name: 'Reprogramadores EEPROM & TrueTone', desc: 'Conservación de funciones originales y calibración' },
    { name: 'Fuentes de Laboratorio Reguladas de 4 Dígitos', desc: 'Detección inmediata de cortos y fugas de consumo' }
  ];

  return (
    <section id="laboratorio" className="py-20 px-4 sm:px-6 lg:px-8 relative bg-zinc-950/60 border-y border-zinc-900">
      
      {/* Glow de ambientación */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-[#FF5500]/10 blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto">
        
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5500]/10 border border-[#FF5500]/30 text-[#FF5500] text-xs font-bold uppercase tracking-wider mb-4">
            <Microscope className="w-3.5 h-3.5" />
            <span>Laboratorio Propio en Mar del Plata</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight mb-4">
            Los 4 Pilares de Confianza de <span className="text-[#FF5500]">montec</span>
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg">
            No somos intermediarios. Contamos con equipamiento de nivel quirúrgico para reparar lo que otros dan por perdido.
          </p>
        </div>

        {/* Los 4 Pilares en Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {pillars.map((pilar, index) => {
            const Icon = pilar.icon;
            return (
              <div
                key={index}
                className="bg-[#121212] border border-zinc-800/90 hover:border-[#FF5500]/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,85,0,0.2)] hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500] mb-5 group-hover:scale-110 group-hover:bg-[#FF5500] group-hover:text-white transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-mono uppercase text-[#FF5500] font-semibold tracking-wider mb-1">
                    {pilar.subtitle}
                  </div>
                  <h3 className="text-xl font-heading font-bold text-white mb-3">
                    {pilar.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {pilar.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner de Instrumental y Especialidades */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            <div className="lg:col-span-5">
              <span className="text-xs font-bold uppercase tracking-widest text-[#FF5500]">
                Tecnología e Instrumental
              </span>
              <h3 className="text-2xl font-heading font-bold text-white mt-1">
                Reparación quirúrgica de hardware
              </h3>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tools.map((tool, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-850 flex items-start gap-2.5">
                  <Cpu className="w-4 h-4 text-[#FF5500] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-zinc-200">{tool.name}</div>
                    <div className="text-[11px] text-zinc-400">{tool.desc}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
