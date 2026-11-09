import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');

if (!fs.existsSync(distDir)) {
  console.error('El directorio dist no existe. Ejecuta vite build primero.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

function createPrerenderedPage({ subDir, title, description, canonical, robots = 'index, follow' }) {
  const targetDir = path.join(distDir, subDir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let html = baseHtml;

  // Reemplazar Title
  if (title) {
    html = html.replace(/<title>.*?<\/title>/s, `<title>${title}</title>`);
    html = html.replace(/<meta property=["']og:title["'] content=["'].*?["'] \/>/s, `<meta property="og:title" content="${title}" />`);
    html = html.replace(/<meta name=["']twitter:title["'] content=["'].*?["'] \/>/s, `<meta name="twitter:title" content="${title}" />`);
  }

  // Reemplazar Description
  if (description) {
    html = html.replace(/<meta name=["']description["'] content=["'].*?["'] \/>/s, `<meta name="description" content="${description}" />`);
    html = html.replace(/<meta property=["']og:description["'] content=["'].*?["'] \/>/s, `<meta property="og:description" content="${description}" />`);
    html = html.replace(/<meta name=["']twitter:description["'] content=["'].*?["'] \/>/s, `<meta name="twitter:description" content="${description}" />`);
  }

  // Reemplazar Canonical y OG URL
  if (canonical) {
    html = html.replace(/<link rel=["']canonical["'] href=["'].*?["'] \/>/s, `<link rel="canonical" href="${canonical}" />`);
    html = html.replace(/<meta property=["']og:url["'] content=["'].*?["'] \/>/s, `<meta property="og:url" content="${canonical}" />`);
  }

  // Reemplazar Robots
  if (robots) {
    html = html.replace(/<meta name=["']robots["'] content=["'].*?["'] \/>/s, `<meta name="robots" content="${robots}" />`);
  }

  const targetFile = path.join(targetDir, 'index.html');
  fs.writeFileSync(targetFile, html, 'utf8');
  console.log(`✓ Generado prerendering SEO estático: ${subDir}/index.html (${canonical}) [${robots}]`);
}

console.log('--- Iniciando optimización SEO estática post-build ---');

// 1. Historia
createPrerenderedPage({
  subDir: 'historia',
  title: 'Nuestra Historia • 12 Años de Trayectoria | Montec Mar del Plata',
  description: 'Conocé la historia de Montec en Mar del Plata. Desde 2012 reparando celulares, iPhone, Mac y notebooks con laboratorio propio y honestidad técnica.',
  canonical: 'https://montec.ar/historia',
  robots: 'index, follow'
});

// 2. Tienda
createPrerenderedPage({
  subDir: 'tienda',
  title: 'Tienda Online de Accesorios y Repuestos | montec Mar del Plata',
  description: 'Comprá fundas, cargadores, vidrios templados y repuestos para celulares en la tienda oficial de montec Mar del Plata.',
  canonical: 'https://montec.ar/tienda',
  robots: 'index, follow'
});

// 3. Estado de Reparación (Privado - NoIndex para Google)
createPrerenderedPage({
  subDir: 'estado',
  title: 'Consulta de Estado de Reparación en Tiempo Real | montec',
  description: 'Consultá el estado y avance de tu equipo en reparación en el laboratorio de Montec Mar del Plata.',
  canonical: 'https://montec.ar/estado',
  robots: 'noindex, nofollow'
});

// 4. Taller (Privado - NoIndex para Google)
createPrerenderedPage({
  subDir: 'taller',
  title: 'Panel de Taller & Gestión de Mostrador | montec',
  description: 'Acceso privado para operadores y técnicos de montec.',
  canonical: 'https://montec.ar/taller',
  robots: 'noindex, nofollow'
});

console.log('--- ¡Optimización SEO estática finalizada con éxito! ---');
