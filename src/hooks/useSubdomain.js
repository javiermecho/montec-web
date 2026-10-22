import { useState, useEffect } from 'react';

/**
 * Analiza el entorno actual (hostname, pathname, query params, hash)
 * para determinar si estamos en la Tienda, en el Taller o en el Sitio Principal.
 */
export function checkSubdomainState() {
  if (typeof window === 'undefined') {
    return { isStore: false, isTaller: false, isMain: true };
  }

  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  // 1. Detección de Tienda Online (tienda.montec.ar, tienda.localhost, /tienda, ?tienda=1, #tienda)
  const isStore = (
    hostname.startsWith('tienda.') ||
    hostname.includes('tienda-montec') ||
    pathname === '/tienda' ||
    pathname.startsWith('/tienda/') ||
    pathname === '/store' ||
    pathname.startsWith('/store/') ||
    search.includes('tienda=1') ||
    search.includes('page=tienda') ||
    search.includes('mode=tienda') ||
    hash === '#tienda' ||
    hash === '#store'
  );

  // 2. Detección de Taller / Cockpit (taller.montec.ar, taller.localhost, /taller, ?taller=1, #taller)
  const isTaller = !isStore && (
    hostname.startsWith('taller.') ||
    hostname.includes('taller-montec') ||
    pathname === '/taller' ||
    pathname.startsWith('/taller/') ||
    search.includes('taller=1') ||
    search.includes('mode=taller') ||
    hash === '#taller' ||
    hash === '#cockpit' ||
    hash === '#empleados'
  );

  return {
    isStore,
    isTaller,
    isMain: !isStore && !isTaller
  };
}

/**
 * Obtiene la URL canónica de la Tienda según el entorno (producción o desarrollo)
 */
export function getStoreTargetUrl() {
  if (typeof window === 'undefined') return '/tienda';

  const hostname = window.location.hostname.toLowerCase();
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol;

  // Si estamos en producción con montec.ar
  if (hostname.includes('montec.ar')) {
    return 'https://tienda.montec.ar';
  }

  // Si estamos en localhost o 127.0.0.1
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Si el usuario prefiere subdominio local o ruta
    // El navegador soporta tienda.localhost nativamente
    return `${protocol}//tienda.localhost${port}`;
  }

  // Si ya estamos en tienda.localhost o tienda.montec.ar
  if (hostname.startsWith('tienda.')) {
    return '/';
  }

  return '/tienda';
}

/**
 * Obtiene la URL canónica del sitio principal (servicio técnico / laboratorio)
 */
export function getMainSiteTargetUrl() {
  if (typeof window === 'undefined') return '/';

  const hostname = window.location.hostname.toLowerCase();
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol;

  if (hostname.includes('montec.ar')) {
    return 'https://montec.ar';
  }

  if (hostname === 'tienda.localhost' || hostname === 'taller.localhost') {
    return `${protocol}//localhost${port}`;
  }

  return '/';
}

/**
 * Hook reactivo para consumir el estado del subdominio en componentes React
 */
export function useSubdomain() {
  const [subdomainState, setSubdomainState] = useState(checkSubdomainState);

  useEffect(() => {
    const handleUrlChange = () => {
      setSubdomainState(checkSubdomainState());
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const navigateToStore = () => {
    const hostname = window.location.hostname.toLowerCase();
    
    // Si estamos en montec.ar en producción, navegar entre subdominios
    if (hostname.includes('montec.ar') && !hostname.startsWith('tienda.')) {
      window.location.href = 'https://tienda.montec.ar';
      return;
    }

    // Si estamos en localhost y no estamos en tienda.localhost, intentamos tienda.localhost o ruta /tienda
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      window.history.pushState({}, '', '/tienda');
      setSubdomainState(checkSubdomainState());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Fallback estándar
    window.history.pushState({}, '', '/tienda');
    setSubdomainState(checkSubdomainState());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToMain = () => {
    const hostname = window.location.hostname.toLowerCase();

    if (hostname.startsWith('tienda.') && hostname.includes('montec.ar')) {
      window.location.href = 'https://montec.ar';
      return;
    }

    if (hostname === 'tienda.localhost') {
      const port = window.location.port ? `:${window.location.port}` : '';
      window.location.href = `${window.location.protocol}//localhost${port}`;
      return;
    }

    window.history.pushState({}, '', '/');
    setSubdomainState(checkSubdomainState());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    ...subdomainState,
    navigateToStore,
    navigateToMain,
    storeUrl: getStoreTargetUrl(),
    mainUrl: getMainSiteTargetUrl()
  };
}
