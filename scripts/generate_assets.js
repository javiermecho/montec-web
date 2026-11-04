import sharp from 'sharp';
import fs from 'fs';

async function generateAssets() {
  console.log('--- Iniciando generación de activos de marca Montec ---');

  // 1. Crear el SVG perfecto del Favicon e Isotipo (Botón de Encendido Montec)
  // Geometría:
  // Viewbox: 0 0 100 100
  // Fondo: Dark Charcoal con esquinas redondeadas rx="22"
  // Borde sutil: #27272A
  // Isotipo Power: Arco circular perfecto + Barra vertical centrada en #FF5500
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="montecBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141418" />
      <stop offset="100%" stop-color="#09090B" />
    </linearGradient>
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <!-- Base con bordes redondeados (Squircle / App Icon) -->
  <rect width="100" height="100" rx="22" fill="url(#montecBg)" />
  <rect width="96" height="96" x="2" y="2" rx="20" fill="none" stroke="#27272A" stroke-width="1.5" />
  
  <!-- Isotipo Montec (Botón de Encendido / Standby) -->
  <!-- Arco circular: centro (50, 52), radio 28. Apertura superior simétrica -->
  <path d="M 27.5 35.5 A 28 28 0 1 0 72.5 35.5" fill="none" stroke="#FF5500" stroke-width="7.5" stroke-linecap="round" />
  <!-- Línea vertical superior centrada entrando al círculo -->
  <line x1="50" y1="19" x2="50" y2="46" stroke="#FF5500" stroke-width="7.5" stroke-linecap="round" />
</svg>`;

  fs.writeFileSync('public/favicon.svg', faviconSvg, 'utf8');
  console.log('✓ public/favicon.svg generado con geometría exacta');

  // 2. Generar iconos PNG de alta resolución a partir del SVG
  // Icono 512x512
  const icon512Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="montecBg512" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16161B" />
      <stop offset="100%" stop-color="#08080A" />
    </linearGradient>
    <radialGradient id="radialGlow" cx="50%" cy="52%" r="45%">
      <stop offset="0%" stop-color="#FF5500" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#FF5500" stop-opacity="0" />
    </radialGradient>
  </defs>
  <!-- Fondo redondeado con zona segura para maskable icons -->
  <rect width="512" height="512" rx="112" fill="url(#montecBg512)" />
  <circle cx="256" cy="266" r="210" fill="url(#radialGlow)" />
  <rect width="496" height="496" x="8" y="8" rx="104" fill="none" stroke="#27272A" stroke-width="6" />

  <!-- Símbolo Power Isotipo Montec HD -->
  <path d="M 141 182 A 143 143 0 1 0 371 182" fill="none" stroke="#FF5500" stroke-width="38" stroke-linecap="round" />
  <line x1="256" y1="97" x2="256" y2="236" stroke="#FF5500" stroke-width="38" stroke-linecap="round" />
</svg>`;

  await sharp(Buffer.from(icon512Svg))
    .resize(512, 512)
    .png()
    .toFile('public/icon-512.png');
  console.log('✓ public/icon-512.png (512x512) generado');

  // Icono 192x192
  await sharp(Buffer.from(icon512Svg))
    .resize(192, 192)
    .png()
    .toFile('public/icon-192.png');
  console.log('✓ public/icon-192.png (192x192) generado');

  // Apple Touch Icon (180x180)
  await sharp(Buffer.from(icon512Svg))
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('✓ public/apple-touch-icon.png (180x180) generado');

  // Reemplazar logo-mon.png con versión cuadrada para máxima compatibilidad con navegadores antiguos
  await sharp(Buffer.from(icon512Svg))
    .resize(192, 192)
    .png()
    .toFile('public/logo-mon.png');
  console.log('✓ public/logo-mon.png actualizado a 192x192');

  // 3. Crear el banner de Open Graph de 1200x630 (og-image.jpg) para WhatsApp, Redes y Previews
  // Vamos a tomar el logo oficial completo (logo-montec.png con 'mon' en naranja y 'tec' en blanco)
  // y colocarlo centrado sobre un fondo oscuro cinematográfico con brillo neón y textos descriptivos.
  const logoMontecMeta = await sharp('public/logo-montec.png').metadata();
  console.log('Logo oficial dimensiones:', logoMontecMeta.width, 'x', logoMontecMeta.height);

  // Escalamos el logo 'montec' a un tamaño generoso y nítido para el centro del banner
  // Proporción original: 266x50 (ratio 5.32). Si lo escalamos a ancho 580, alto ~109px
  const logoScaledWidth = 600;
  const logoScaledHeight = Math.round(600 * (logoMontecMeta.height / logoMontecMeta.width)); // ~113px
  const logoScaled = await sharp('public/logo-montec.png')
    .resize(logoScaledWidth, logoScaledHeight, {
      kernel: 'lanczos3'
    })
    .png()
    .toBuffer();

  // Creamos la plantilla de fondo en SVG de 1200x630 con diseño profesional
  const ogBackgroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#111116" />
      <stop offset="50%" stop-color="#08080A" />
      <stop offset="100%" stop-color="#050507" />
    </linearGradient>
    <radialGradient id="ogGlow" cx="50%" cy="40%" r="40%">
      <stop offset="0%" stop-color="#FF5500" stop-opacity="0.22" />
      <stop offset="50%" stop-color="#FF5500" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#FF5500" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF5500" stop-opacity="0.4" />
      <stop offset="50%" stop-color="#27272A" />
      <stop offset="100%" stop-color="#FF5500" stop-opacity="0.2" />
    </linearGradient>
  </defs>

  <!-- Fondo Premium Oscuro -->
  <rect width="1200" height="630" fill="url(#ogBg)" />
  <!-- Resplandor Naranja Neón Centrado -->
  <circle cx="600" cy="270" r="380" fill="url(#ogGlow)" />
  <!-- Borde perimetral refinado -->
  <rect width="1160" height="590" x="20" y="20" rx="24" fill="none" stroke="url(#borderGrad)" stroke-width="2" />

  <!-- Badge Superior -->
  <g transform="translate(600, 140)">
    <rect x="-170" y="-18" width="340" height="36" rx="18" fill="#1C1917" stroke="#FF5500" stroke-opacity="0.5" stroke-width="1.5" />
    <circle cx="-140" cy="0" r="4.5" fill="#FF5500" />
    <text x="-124" y="5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="3" fill="#FF5500" text-anchor="start">SERVICIO TÉCNICO ESPECIALIZADO</text>
  </g>

  <!-- Textos Inferiores (Dentro de la Safe Zone para que WhatsApp y Facebook lo lean al 100%) -->
  <g transform="translate(600, 415)">
    <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">
      Celulares • iPhone • Notebooks
    </text>
    <text x="0" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="500" fill="#A1A1AA" text-anchor="middle">
      Taller Multimarca &amp; Laboratorio Electrónico
    </text>
  </g>

  <!-- Barra de Ubicación y Dominio -->
  <g transform="translate(600, 525)">
    <rect x="-240" y="-20" width="480" height="40" rx="20" fill="#141417" stroke="#27272A" stroke-width="1.5" />
    <text x="0" y="6" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="16" font-weight="600" fill="#E4E4E7" text-anchor="middle">
      📍 Montes Carballo 943 • <tspan fill="#FF5500" font-weight="700">montec.ar</tspan>
    </text>
  </g>
</svg>`;

  // Componer el fondo con el logo oficial centrado
  const logoTop = Math.round(270 - (logoScaledHeight / 2)); // Centrado verticalmente alrededor de y=270
  const logoLeft = Math.round(600 - (logoScaledWidth / 2)); // Centrado horizontalmente en x=600

  const ogComposite = await sharp(Buffer.from(ogBackgroundSvg))
    .composite([
      {
        input: logoScaled,
        top: logoTop,
        left: logoLeft
      }
    ]);

  // Guardar og-image.jpg (JPEG con 90% calidad, tamaño ideal < 150KB)
  await ogComposite
    .clone()
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile('public/og-image.jpg');
  console.log('✓ public/og-image.jpg (1200x630 JPEG optimizado) generado');

  // Guardar og-image.png (PNG lossless)
  await ogComposite
    .clone()
    .png()
    .toFile('public/og-image.png');
  console.log('✓ public/og-image.png (1200x630 PNG) generado');

  console.log('--- ¡Todos los activos generados exitosamente! ---');
}

generateAssets().catch(err => {
  console.error('Error generando activos:', err);
  process.exit(1);
});

