import Link from 'next/link';
import { School, ArrowRight, ShieldCheck, Clock, Award } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-unt-primary/5 to-unt-accent/10 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-unt-primary/10 to-transparent rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-unt-primary rounded-xl flex items-center justify-center shadow-lg shadow-unt-primary/10">
            <School className="text-white w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-bold text-gray-800 tracking-tight block leading-none">Horarios UNT</span>
            <span className="text-[10px] text-unt-primary font-medium tracking-wide uppercase">Ingeniería de Sistemas</span>
          </div>
        </div>
        <Link
          href="/auth/login"
          className="px-5 py-2.5 bg-unt-primary hover:bg-[#002244] text-white text-sm font-semibold rounded-xl shadow-md shadow-unt-primary/15 transition-all duration-200"
        >
          Acceso Plataforma
        </Link>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-6 text-center z-10 py-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-unt-accent/10 border border-unt-accent/20 rounded-full text-xs font-semibold text-unt-primary tracking-wide mb-6 uppercase">
          <Award className="w-4 h-4 text-unt-primary" />
          Excelencia Académica y Tecnológica
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
          Gestión Inteligente de <br />
          <span className="bg-gradient-to-r from-unt-primary to-unt-accent bg-clip-text text-transparent">
            Horarios Universitarios
          </span>
        </h1>

        <p className="text-gray-600 text-base md:text-lg max-w-2xl leading-relaxed mb-10">
          Optimiza la distribución de aulas, laboratorios y carga docente en tiempo real. 
          Un sistema intuitivo y moderno para la Escuela de Ingeniería de Sistemas de la UNT.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-sm">
          <Link
            href="/auth/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-unt-primary to-[#002244] hover:from-[#002244] hover:to-unt-primary text-white font-bold rounded-xl shadow-lg shadow-unt-primary/20 transition-all duration-300 group"
          >
            Iniciar Sesión
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full text-left">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-800 text-base">Tiempo Real</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Selección interactiva de horas libres y ocupadas con sincronización inmediata vía WebSocket.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-gray-800 text-base">Validación Robusta</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Detección y prevención instantánea de colisiones en carga docente, grupos lectivos y laboratorios.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <School className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-gray-800 text-base">Control de Infraestructura</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Monitorización detallada de aforos, mantenimientos y optimización del uso físico de pabellones.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-gray-100 bg-white py-6 z-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>© {new Date().getFullYear()} Escuela de Ingeniería de Sistemas - UNT. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <span className="hover:text-gray-600 transition-colors">Normativas</span>
            <span className="hover:text-gray-600 transition-colors">Soporte Técnico</span>
          </div>
        </div>
      </footer>
    </main>
  );
}