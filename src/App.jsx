import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import QuotationTool from './components/QuotationTool';
import Laboratory from './components/Laboratory';
import StoryTeaser from './components/StoryTeaser';
import InstagramFeed from './components/InstagramFeed';
import LocationContact from './components/LocationContact';
import Footer from './components/Footer';
import HistoryPage from './pages/HistoryPage';
import StorePage from './pages/StorePage';
import OrderStatusPage from './pages/OrderStatusPage';
import OrderTrackerModal from './components/common/OrderTrackerModal';
import AdminPanel from './components/AdminPanel';
import DiagnosticChatbot from './components/DiagnosticChatbot';
import RepairOrderReceiver from './components/taller/RepairOrderReceiver';
import OperatorCockpit from './components/taller/OperatorCockpit';
import TallerLoginScreen from './components/taller/TallerLoginScreen';
import { DataProvider, useData } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useSubdomain } from './hooks/useSubdomain';

function checkIsHistoryPage() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    path === '/historia' ||
    path === '/quienes-somos' ||
    path === '/nuestra-historia' ||
    path.startsWith('/historia') ||
    search.includes('page=historia') ||
    search.includes('p=historia') ||
    hash === '#historia' ||
    hash === '#quienes-somos'
  );
}

function checkIsOrderStatusPage() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    path === '/estado' ||
    path.startsWith('/estado/') ||
    path === '/seguimiento' ||
    path.startsWith('/seguimiento/') ||
    path === '/reparacion' ||
    path.startsWith('/reparacion/') ||
    search.includes('orden=') ||
    search.includes('order=') ||
    search.includes('page=estado') ||
    search.includes('page=seguimiento') ||
    hash === '#estado' ||
    hash === '#seguimiento'
  );
}

function AppContent() {
  const { isStore, navigateToStore, navigateToMain } = useSubdomain();
  const { isTallerSubdomain, isAuthenticated, isOperator, isAdmin } = useAuth();
  const { isAdminOpen, setIsAdminOpen, isTallerOpen, setIsTallerOpen, setIsAdminAuthenticated } = useData();
  const [isHistoryPage, setIsHistoryPage] = useState(checkIsHistoryPage);
  const [isOrderStatusPage, setIsOrderStatusPage] = useState(checkIsOrderStatusPage);
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);

  // Escuchar navegación por historial, popstate y hash
  useEffect(() => {
    const handleUrlChange = () => {
      setIsHistoryPage(checkIsHistoryPage());
      setIsOrderStatusPage(checkIsOrderStatusPage());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    const handleOpenTrackerEvent = () => {
      setIsTrackerModalOpen(true);
    };
    window.addEventListener('montec:openTracker', handleOpenTrackerEvent);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('montec:openTracker', handleOpenTrackerEvent);
    };
  }, []);

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    setIsHistoryPage(false);
    setIsOrderStatusPage(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHistory = () => {
    window.history.pushState({}, '', '/historia');
    setIsHistoryPage(true);
    setIsOrderStatusPage(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToOrderStatus = (orderNumber) => {
    const url = orderNumber ? `/estado?orden=${encodeURIComponent(orderNumber)}` : '/estado';
    window.history.pushState({}, '', url);
    setIsHistoryPage(false);
    setIsOrderStatusPage(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Si el usuario autenticado es Administrador (Dueño), abrir por defecto el Panel de Administrador
  useEffect(() => {
    if (isAdmin && isTallerSubdomain) {
      if (typeof setIsAdminAuthenticated === 'function') {
        setIsAdminAuthenticated(true);
      }
      const viewPref = sessionStorage.getItem('montec_taller_view_preference');
      if (viewPref !== 'mostrador') {
        setIsAdminOpen(true);
      }
    }
  }, [isAdmin, isTallerSubdomain, setIsAdminOpen, setIsAdminAuthenticated]);

  // MODO 0: SUBDOMINIO O ENTORNO EXCLUSIVO DE TIENDA ONLINE (tienda.montec.ar / /tienda)
  if (isStore) {
    return <StorePage />;
  }

  // MODO 1: SUBDOMINIO O ENTORNO EXCLUSIVO DE TALLER (taller.montec.ar / ?taller=1 / #taller)
  if (isTallerSubdomain) {
    if (!isAuthenticated) {
      return <TallerLoginScreen />;
    }

    // Si está abierto el panel de administrador, mostrar la interfaz integral de administración
    if (isAdminOpen) {
      return <AdminPanel />;
    }

    // Por defecto en taller, mostrar el Cockpit de Mostrador
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#08080A] text-white">
        <OperatorCockpit />
      </div>
    );
  }

  // MODO 2: PÁGINA INDEPENDIENTE DE NUESTRA HISTORIA (/historia, #historia)
  if (isHistoryPage) {
    return <HistoryPage onNavigateHome={navigateToHome} />;
  }

  // MODO 2.5: PÁGINA PÚBLICA DE SEGUIMIENTO EN VIVO (/estado, /seguimiento, ?orden=...)
  if (isOrderStatusPage) {
    return <OrderStatusPage onNavigateHome={navigateToHome} />;
  }

  // MODO 3: SITIO WEB PÚBLICO COMERCIAL (montec.ar)
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#0A0A0A] text-white flex flex-col selection:bg-[#FF5500] selection:text-white">
      {/* Navbar flotante superior con acceso a Tienda, admin y taller */}
      <Navbar 
        onNavigateHistory={navigateToHistory} 
        onNavigateStore={navigateToStore}
        onNavigateOrderStatus={() => navigateToOrderStatus()}
        onOpenTracker={() => setIsTrackerModalOpen(true)}
      />

      {/* Contenido Principal Comercial de Servicio Técnico y Laboratorio */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <Hero 
          onOpenTracker={() => setIsTrackerModalOpen(true)}
          onNavigateOrderStatus={navigateToOrderStatus}
        />
        <QuotationTool />
        <Laboratory />
        <StoryTeaser onOpenStory={navigateToHistory} />
        <InstagramFeed />
        <LocationContact />
      </main>

      {/* Footer */}
      <Footer onNavigateStore={navigateToStore} />

      {/* Modal Interactivo de Seguimiento de Reparación */}
      <OrderTrackerModal 
        isOpen={isTrackerModalOpen} 
        onClose={() => setIsTrackerModalOpen(false)}
        onNavigateToStatusPage={navigateToOrderStatus}
      />

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
