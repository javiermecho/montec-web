# ⚡ montec — Plataforma Digital Integral

> Servicio Técnico Especializado en Celulares, Notebooks, Microelectrónica y Accesorios en **Mar del Plata** (Montes Carballo 943).

---

## 📁 Estructura del Ecosistema

```text
montec-web/
├── dist/                     # 🚀 Archivos listos para subir a Hostinger (public_html)
├── src/                      # Código fuente Frontend (React + Vite + Tailwind CSS)
│   ├── components/           # Componentes modulares (Navbar, Hero, Cotizador, Laboratorio, etc.)
│   ├── data/                 # Bases de datos locales (reparaciones y accesorios)
│   └── index.css             # Paleta de colores, glow neón y utilidades
├── backend/                  # 🚂 Servidor Express + PostgreSQL (Railway) + Scraper
│   ├── server.js             # API REST (/api/repuestos, /api/cotizar)
│   ├── db/                   # Conexión y esquema SQL de Railway
│   └── scraper/              # Scraper multitienda con normalizador de modelos
├── tailwind.config.js        # Identidad visual (Naranja Neón #FF5500, Negro Mate #0A0A0A)
└── package.json
```

---

## 🎨 1. Identidad de Marca y Branding

- **Nombre Oficial**: `montec` (minúsculas).
- **Logotipo / Isotipo**:
  - `mon` en Naranja Neón (`#FF5500`) con el botón de encendido (`⏻`) estilizado en la letra **"o"**.
  - `tec` en Blanco Puro (`#FFFFFF`) con la letra **"t"** estilizada en cruz (`✝`).
- **Paleta de Colores**:
  - Fondo Principal: Negro Mate Profundo (`#0A0A0A` y `#121212`).
  - Acentos / Glow: Naranja Neón (`#FF5500`, `#FF6600`).
  - Textos: Blanco Puro (`#FFFFFF`) y Gris Neutro (`#9CA3AF`).
- **Ubicación**: Montes Carballo 943, Mar del Plata (Zona Norte / Constitución).

---

## 🚀 2. Despliegue en Hostinger (Frontend)

Para generar la carpeta final que se subirá a Hostinger:

1. Ejecutá en la raíz del proyecto:
   ```bash
   npm run build
   ```
2. Esto creará o actualizará la carpeta `dist/`.
3. Conectate a tu panel de Hostinger (vía Administrador de Archivos o FTP) y subí todo el contenido que se encuentra **dentro** de `dist/` a la carpeta `public_html/`.

---

## 🚂 3. Despliegue en Railway (Backend + PostgreSQL + Scraper)

El backend está ubicado en la carpeta `/backend` y está diseñado para funcionar nativamente en **Railway**:

1. En el dashboard de Railway, creá un nuevo proyecto.
2. Agregá una base de datos **PostgreSQL**.
3. Creá un servicio apuntando al directorio `/backend`.
4. Railway inyectará automáticamente la variable `DATABASE_URL` y el puerto `PORT`.
5. Ejecutá el script de inicialización de tablas:
   ```bash
   npm run db:init
   ```
6. Opcionalmente programá la ejecución del scraper:
   ```bash
   npm run scrape
   ```

### Endpoints de la API:
- `GET /api/health` — Comprueba el estado del servidor y la conexión a PostgreSQL.
- `GET /api/repuestos?brand=Apple&category=pantalla` — Listado de repuestos actualizados por el scraper.
- `POST /api/cotizar` — Calcula el presupuesto para un equipo y falla específica.
- `POST /api/scraper/trigger` — Dispara el scraper de las 4 fuentes locales de Mar del Plata.
