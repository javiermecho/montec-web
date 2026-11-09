import { useEffect } from 'react';

/**
 * Hook para gestión dinámica y estricta de SEO, Canónicas y Directivas de Rastreo.
 * Evita penalizaciones y advertencias de "Página alternativa con etiqueta canónica adecuada"
 * en Google Search Console.
 */
export function useSEO({ title, description, canonical, noindex = false }) {
  useEffect(() => {
    // 1. Título de la pestaña y motor de búsqueda
    if (title) {
      document.title = title;
    }

    // 2. Meta description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    // 3. Meta robots: marcar como 'noindex, nofollow' en páginas privadas/transaccionales
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', noindex ? 'noindex, nofollow' : 'index, follow');

    // 4. URL Canónica exacta
    if (canonical) {
      let linkCanonical = document.querySelector('link[rel="canonical"]');
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute('href', canonical);
    }

    // 5. Open Graph URL (WhatsApp, Facebook, Twitter)
    if (canonical) {
      let ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) {
        ogUrl.setAttribute('content', canonical);
      }
    }
  }, [title, description, canonical, noindex]);
}
