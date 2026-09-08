import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import QuotationTool from './components/QuotationTool';
import Laboratory from './components/Laboratory';
import Accessories from './components/Accessories';
import LocationContact from './components/LocationContact';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';
import DiagnosticChatbot from './components/DiagnosticChatbot';
import RepairOrderReceiver from './components/taller/RepairOrderReceiver';
import OperatorCockpit from './components/taller/OperatorCockpit';
import TallerLoginScreen from './components/taller/TallerLoginScreen';
import { DataProvider, useData } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { isTallerSubdomain, isAuthenticated, isOperator, isAdmin } = useAuth();
  const { isAdminOpen, setIsAdminOpen, isTallerOpen, setIsTallerOpen } = useData();

  // MODO 1: SUBDOMINIO O ENTORNO EXCLUSIVO DE TALLER (taller.montec.ar / ?taller=1 / #taller)
  if (isTallerSubdomain) {
    if (!isAuthenticated) {
      return <TallerLoginScreen />;
    }

    return (
      <div className="min-h-screen bg-[#08080A] text-white">
        {/* Cockpit de Mostrador Principal */}
        <OperatorCockpit />

        {/* Panel Administrador (si el dueño abre la solapa de finanzas/márgenes) */}
        {isAdminOpen && <AdminPanel />}
      </div>
    );
  }

  // MODO 2: SITIO WEB PÚBLICO COMERCIAL (montec.ar)
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col selection:bg-[#FF5500] selection:text-white">
      {/* Navbar flotante superior con acceso admin y taller */}
      <Navbar />

      {/* Contenido Principal Comercial */}
      <main className="flex-1">
        <Hero />
        <QuotationTool />
        <Laboratory />
        <Accessories />
        <LocationContact />
      </main>

      {/* Footer */}
      <Footer />

      {/* Asistente Virtual Interactivo de Diagnóstico Técnico */}
      <DiagnosticChatbot />

      {/* Módulo Privado de Taller / Cockpit de Mostrador */}
      {isTallerOpen && (
        isAuthenticated ? (
          <OperatorCockpit onClose={() => setIsTallerOpen(false)} />
        ) : (
          <TallerLoginScreen onCancel={() => setIsTallerOpen(false)} />
        )
      )}

      {/* Panel Administrador (Modal overlay cuando se activa) */}
      {isAdminOpen && <AdminPanel />}

      {/* Receptor de Órdenes en caso de llamada directa */}
      <RepairOrderReceiver />
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </DataProvider>
  );
}
