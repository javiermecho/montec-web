import React, { useState } from 'react';
import { 
  Lock, 
  Key, 
  Shield, 
  Wrench, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Smartphone, 
  Store, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import MontecLogo from '../MontecLogo';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export default function TallerLoginScreen({ onCancel }) {
  const { login, isTallerSubdomain } = useAuth();
  const { loginAdmin, setIsAdminOpen, setIsAdminAuthenticated } = useData();
  
  const [selectedRole, setSelectedRole] = useState('operador'); // 'operador' | 'admin'
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const res = login(pinInput, selectedRole);
    if (!res.success) {
      setErrorMsg(res.error || 'Credenciales incorrectas');
    } else {
      // Si ingresa con rol Administrador (Dueño), abrir directamente el panel de administración
      if (selectedRole === 'admin' || res.user?.role === 'admin') {
        if (typeof setIsAdminAuthenticated === 'function') setIsAdminAuthenticated(true);
        if (typeof loginAdmin === 'function') loginAdmin(pinInput);
        if (typeof setIsAdminOpen === 'function') setIsAdminOpen(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070709] bg-gradient-to-b from-[#0e0e12] to-[#060608] text-white selection:bg-[#FF5500] selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF5500]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#121215] border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative z-10 backdrop-blur-xl">
        
        {/* LOGO & ENCABEZADO */}
        <div className="text-center space-y-3 pb-6 border-b border-zinc-800/80">
          <div className="inline-block">
            <MontecLogo size="md" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FF5500]/15 border border-[#FF5500]/30 text-[#FF5500] text-xs font-mono font-bold tracking-wider uppercase">
              Taller & Cockpit de Mostrador
            </span>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white mt-2">
              Acceso a Operaciones
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {isTallerSubdomain ? 'taller.montec.ar • Sistema Central' : 'Entorno privado de gestión técnica y comercial'}
            </p>
          </div>
        </div>

        {/* SELECTOR DE ROL */}
        <div className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('operador');
                setErrorMsg('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedRole === 'operador'
                  ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Operador Mostrador</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setErrorMsg('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.35)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Administrador</span>
            </button>
          </div>

          {/* DESCRIPCIÓN DEL ROL SELECCIONADO */}
          <div className="text-[11px] p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60 text-zinc-400">
            {selectedRole === 'operador' ? (
              <div className="space-y-0.5">
                <span className="text-[#FF5500] font-semibold block">Perfil Operador / Técnico:</span>
                <span>Ingreso de órdenes, estados en mesa de trabajo, presupuestos, cobro y POS de mostrador.</span>
              </div>
            ) : (
              <div className="space-y-0.5">
                <span className="text-[#FF5500] font-semibold block">Perfil Administrador (Dueño):</span>
                <span>Acceso total a márgenes, fórmulas de mano de obra, finanzas, métricas e inventario.</span>
              </div>
            )}
          </div>

          {/* FORMULARIO DE LOGIN */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>{selectedRole === 'operador' ? 'PIN de Mostrador / Empleado:' : 'Contraseña de Administrador:'}</span>
                {selectedRole === 'operador' && (
                  <span className="text-[10px] text-zinc-500 font-mono">Por defecto: 1234</span>
                )}
              </label>

              <div className="relative">
                <Key className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder={selectedRole === 'operador' ? '•••• (PIN 4 dígitos)' : 'Contraseña de dueño...'}
                  autoFocus
                  className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-[#FF5500] rounded-xl pl-10 pr-12 py-3 text-sm text-white font-mono placeholder-zinc-600 outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 font-semibold"
                >
                  {showPin ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] text-white font-heading font-bold text-sm shadow-[0_0_20px_rgba(255,85,0,0.4)] hover:shadow-[0_0_28px_rgba(255,85,0,0.6)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ingresar al Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* ACCIÓN SECUNDARIA */}
          {onCancel && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Volver a la web pública montec.ar
              </button>
            </div>
          )}

          {!onCancel && !isTallerSubdomain && (
            <div className="pt-2 text-center">
              <a
                href="/"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1"
              >
                <span>Ir al sitio web comercial</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
