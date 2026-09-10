import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya se está ejecutando como app instalada (standalone)
    const checkStandalone = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    // 2. Detectar si es dispositivo iOS (Safari maneja la instalación manualmente)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // 3. Capturar el evento nativo beforeinstallprompt (Chrome, Edge, Android, Opera)
    const handleBeforeInstallPrompt = (e) => {
      // Prevenir el banner automático intrusivo del navegador para controlarlo nosotros
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // 4. Capturar cuando la app fue instalada con éxito
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('✅ montec Taller instalado exitosamente en el escritorio');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Función para disparar la instalación nativa
  const installApp = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error('Error al invocar instalación de PWA:', err);
      }
    } else {
      // Instrucción visual para el usuario si el navegador no expone beforeinstallprompt en ese instante
      if (isIOS) {
        alert('Para instalar en iPhone/iPad:\n1. Tocá el botón Compartir (cuadrado con flecha hacia arriba).\n2. Seleccioná "Agregar a pantalla de inicio".');
      } else {
        alert('Para instalar en el escritorio:\n1. Hacé clic en el icono de instalación (⊕ o monitor) en la barra de direcciones de tu navegador (Chrome / Edge).\n2. O abrí el menú (⋮) y elegí "Instalar montec Taller".');
      }
    }
  };

  return {
    isInstallable,
    isInstalled,
    installApp,
    isIOS,
    canPromptDirectly: !!deferredPrompt
  };
}
