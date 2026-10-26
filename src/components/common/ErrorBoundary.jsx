import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('⚠️ [Montec ErrorBoundary] Excepción interceptada:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 my-4 mx-auto max-w-2xl bg-zinc-900/90 border border-rose-500/40 rounded-2xl shadow-2xl text-white animate-fadeIn">
          <div className="flex items-center gap-3 mb-3 text-rose-400">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Ocurrió un error al cargar esta sección
              </h3>
              <p className="text-xs text-zinc-400">
                {this.props.title || 'Se interceptó una excepción en tiempo de ejecución para proteger la sesión.'}
              </p>
            </div>
          </div>

          <div className="my-3 p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs font-mono text-rose-300 break-words max-h-36 overflow-y-auto">
            {this.state.error?.message || 'Error desconocido'}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FF5500] hover:bg-[#FF6600] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reintentar cargar</span>
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <span>Recargar Página</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
