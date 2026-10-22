// Catálogo oficial de productos & inventario de Montec Store (Montes Carballo 943, Mar del Plata)

export const STORE_CATEGORIES = [
  'Todos',
  'iPhones & Smartphones',
  'Smartwatches & Relojes',
  'Audio & AirPods',
  'Carga & Energía',
  'Accesorios & Fundas',
  'Gadgets & Electrónica Pequeña'
];

// Compatibilidad con versiones anteriores
export const ACCESSORIES_CATEGORIES = STORE_CATEGORIES;

export const ACCESSORIES_DATABASE = [
  // ─────────────────────────────────────────────────────────────
  // 1. iPHONES & SMARTPHONES (Seleccionados, Nuevos y Seminuevos)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'iphone-13-128gb-selected',
    sku: 'IPH-13-128-SEL',
    barcode: '779123400201',
    category: 'iPhones & Smartphones',
    name: 'iPhone 13 128GB - Seminuevo Seleccionado Batería 92%+',
    compatible: 'Libre de fábrica para todas las compañías',
    features: [
      'Pantalla Super Retina XDR OLED 6.1"',
      'Chip A15 Bionic ultra veloz',
      'Cámara dual de 12 MP con Modo Cine',
      'Batería original con salud comprobada superior al 90%',
      'Incluye cable de carga rápida y 3 meses de garantía escrita'
    ],
    costPrice: 480000,
    price: 685000,
    stock: 3,
    minStock: 1,
    visibleInWeb: true,
    badge: 'Seminuevo Premium',
    condition: 'Seminuevo Clase A+',
    variants: {
      colors: ['Midnight', 'Starlight', 'Blue', 'Pink'],
      storage: ['128GB', '256GB']
    },
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'iphone-15-pro-128gb',
    sku: 'IPH-15P-128-NEW',
    barcode: '779123400202',
    category: 'iPhones & Smartphones',
    name: 'iPhone 15 Pro 128GB - Titanio Natural (Nuevo Sellado)',
    compatible: 'Libre de fábrica mundial (eSIM / NanoSIM)',
    features: [
      'Diseño en Titanio de grado aeroespacial ultraligero',
      'Chip A17 Pro con GPU de 6 núcleos para gaming',
      'Botón de Acción personalizable y puerto USB-C 3.0',
      'Cámara Pro de 48 MP con 7 lentes profesionales',
      'Garantía Oficial Apple de 1 año'
    ],
    costPrice: 1150000,
    price: 1390000,
    stock: 2,
    minStock: 1,
    visibleInWeb: true,
    badge: 'Nuevo Sellado',
    condition: 'Nuevo en Caja Sellada',
    variants: {
      colors: ['Titanio Natural', 'Titanio Negro', 'Titanio Azul', 'Titanio Blanco'],
      storage: ['128GB', '256GB', '512GB']
    },
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'iphone-11-64gb-grade-a',
    sku: 'IPH-11-64-A',
    barcode: '779123400203',
    category: 'iPhones & Smartphones',
    name: 'iPhone 11 64GB - Excelente Estado Certificado',
    compatible: 'Libre de fábrica todas las empresas',
    features: [
      'Pantalla Liquid Retina HD 6.1"',
      'Chip A13 Bionic confiable y fluido',
      'Sistema de dos cámaras con Gran Angular y Ultra Gran Angular',
      'Batería original en óptimo estado (85%+)',
      'Chequeo técnico de 25 puntos en laboratorio Montec'
    ],
    costPrice: 280000,
    price: 395000,
    stock: 4,
    minStock: 1,
    visibleInWeb: true,
    badge: 'Mejor Precio/Calidad',
    condition: 'Seminuevo Certificado',
    variants: {
      colors: ['Negro', 'Blanco', 'Rojo (Product RED)', 'Verde'],
      storage: ['64GB', '128GB']
    },
    image: 'https://images.unsplash.com/photo-1574755393849-623942496936?w=800&auto=format&fit=crop&q=80'
  },

  // ─────────────────────────────────────────────────────────────
  // 2. SMARTWATCHES & RELOJES
  // ─────────────────────────────────────────────────────────────
  {
    id: 'apple-watch-s9-45mm',
    sku: 'AW-S9-45-ALUM',
    barcode: '779123400204',
    category: 'Smartwatches & Relojes',
    name: 'Apple Watch Series 9 45mm GPS Aluminio',
    compatible: 'Compatible con iPhone XS o posterior (iOS 17+)',
    features: [
      'Pantalla siempre activa Retina de hasta 2000 nits',
      'Gesto de Doble Toque (Double Tap) revolucionario',
      'Chip S9 SiP súper veloz con Siri en el dispositivo',
      'Sensor de oxígeno en sangre y ECG de alta precisión',
      'Resistencia al agua hasta 50 metros'
    ],
    costPrice: 380000,
    price: 520000,
    stock: 2,
    minStock: 1,
    visibleInWeb: true,
    badge: 'Serie 9',
    condition: 'Nuevo en Caja Sellada',
    variants: {
      colors: ['Medianoche', 'Luz de Estrella', 'Plata'],
      sizes: ['41mm', '45mm']
    },
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'strap-alpine-ocean-loop',
    sku: 'COR-ALP-LOOP',
    barcode: '779123400205',
    category: 'Smartwatches & Relojes',
    name: 'Correa Deportiva Alpine Loop / Ocean para Apple Watch',
    compatible: 'Apple Watch Ultra, Series 9/8/7/SE (38/40/41mm y 42/44/45/49mm)',
    features: [
      'Tejido continuo de poliéster de alta tenacidad',
      'Gancho en G de titanio resistente a la corrosión',
      'Transpirable, ultraligera y lavable',
      'Ajuste seguro para deportes extremos y uso diario'
    ],
    costPrice: 5800,
    price: 15900,
    stock: 15,
    minStock: 4,
    visibleInWeb: true,
    badge: 'Popular',
    variants: {
      colors: ['Naranja Titanium', 'Verde Militar', 'Blanco Polar', 'Negro Obsidiana'],
      sizes: ['38/40/41mm', '42/44/45/49mm']
    },
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'charging-dock-watch-fast',
    sku: 'CARG-MAG-WATCH',
    barcode: '779123400206',
    category: 'Smartwatches & Relojes',
    name: 'Cargador Rápido Magnético USB-C para Apple Watch 1m',
    compatible: 'Todas las generaciones de Apple Watch (1 al Ultra 2)',
    features: [
      'Módulo magnético de acople instantáneo',
      'Soporta carga rápida en Series 7, 8, 9 y Ultra',
      'Cable blindado con conector de aluminio reforzado',
      'Protección inteligente contra sobrecalentamiento'
    ],
    costPrice: 6500,
    price: 18900,
    stock: 11,
    minStock: 3,
    visibleInWeb: true,
    badge: 'Carga Rápida',
    image: 'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&auto=format&fit=crop&q=80'
  },

  // ─────────────────────────────────────────────────────────────
  // 3. AUDIO & AIRPODS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'airpods-pro-2-usbc',
    sku: 'AUD-APP2-USBC',
    barcode: '779123400207',
    category: 'Audio & AirPods',
    name: 'AirPods Pro 2ª Gen con Estuche MagSafe (USB-C)',
    compatible: 'iPhone, iPad, Mac, Apple Watch y dispositivos Android',
    features: [
      'Cancelación Activa de Ruido 2 veces superior',
      'Modo Ambiente adaptable y Audio Espacial personalizado',
      'Estuche con parlante integrado y enganche para correa',
      'Hasta 30 horas de reproducción de audio',
      'Resistencia IP54 al polvo, sudor y agua'
    ],
    costPrice: 240000,
    price: 335000,
    stock: 4,
    minStock: 2,
    visibleInWeb: true,
    badge: 'Top Audio',
    condition: 'Nuevo en Caja Sellada',
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'airpods-3-magsafe',
    sku: 'AUD-AP3-MAG',
    barcode: '779123400208',
    category: 'Audio & AirPods',
    name: 'AirPods 3ª Generación con Audio Espacial y Estuche MagSafe',
    compatible: 'Universal iOS y Android con Bluetooth 5.0+',
    features: [
      'Audio Espacial con seguimiento dinámico de la cabeza',
      'Ecualización adaptativa que afina la música en tiempo real',
      'Diseño anatómico ergonómico sin gomitas',
      'Sensor de fuerza para controlar reproducción y llamadas',
      'Hasta 30 horas de batería combinada'
    ],
    costPrice: 175000,
    price: 249000,
    stock: 3,
    minStock: 1,
    visibleInWeb: true,
    badge: 'Recomendado',
    image: 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'speaker-bluetooth-waterproof',
    sku: 'SPK-BT-MINI',
    barcode: '779123400209',
    category: 'Audio & AirPods',
    name: 'Parlante Bluetooth Portátil Ultra Bass IPX7 Waterproof',
    compatible: 'Smartphones, Tablets, Computadoras y Smart TVs',
    features: [
      'Sonido estéreo 360° con graves potenciados',
      'Certificación IPX7 sumergible y resistente a caídas',
      'Batería recargable con hasta 14 horas continuas',
      'Micrófono integrado para manos libres'
    ],
    costPrice: 18500,
    price: 42000,
    stock: 7,
    minStock: 2,
    visibleInWeb: true,
    badge: 'Resistente al Agua',
    variants: {
      colors: ['Negro Matte', 'Gris Grafito', 'Rojo Carmesí']
    },
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'tws-earbuds-anc',
    sku: 'AUD-TWS-ANC',
    barcode: '779123400108',
    category: 'Audio & AirPods',
    name: 'Auriculares Inalámbricos TWS con Cancelación Activa de Ruido',
    compatible: 'Bluetooth 5.3 universal (iOS y Android)',
    features: [
      'Hasta 28 horas con estuche de carga USB-C',
      'Bajos profundos y sonido nítido para llamadas',
      'Micrófonos duales con cancelación de ruido ambiental',
      'Diseño ultraligero con 3 pares de almohadillas'
    ],
    costPrice: 14200,
    price: 36000,
    stock: 8,
    minStock: 3,
    visibleInWeb: true,
    badge: 'Excelente Relación Precio/Calidad',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80'
  },

  // ─────────────────────────────────────────────────────────────
  // 4. CARGA & ENERGÍA
  // ─────────────────────────────────────────────────────────────
  {
    id: 'charger-20w-usbc',
    sku: 'CARG-20W-PD',
    barcode: '779123400101',
    category: 'Carga & Energía',
    name: 'Cargador Rápido 20W Power Delivery USB-C Certificado',
    compatible: 'iPhone 11 al 16, iPad, Samsung Galaxy, Motorola',
    features: [
      'Carga rápida certificada: 50% de batería en 30 minutos',
      'Chip con protección contra sobretensión y sobrecalentamiento',
      'Carcasa ignífuga compacta de alta durabilidad',
      'No degrada la salud de la batería'
    ],
    costPrice: 8200,
    price: 18500,
    stock: 14,
    minStock: 4,
    visibleInWeb: true,
    badge: 'Más Vendido',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'charger-gan-45w',
    sku: 'CARG-45W-GAN',
    barcode: '779123400102',
    category: 'Carga & Energía',
    name: 'Cargador GaN Ultra Compacto 45W Dual USB-C + USB-A',
    compatible: 'Smartphones de alta gama, MacBook Air, iPad Pro, Tablets',
    features: [
      'Tecnología de Nitruro de Galio (GaN) fría y eficiente',
      'Doble puerto de salida con distribución inteligente',
      'Super Fast Charging 2.0 (45W)',
      'Diseño 40% más chico que cargadores convencionales'
    ],
    costPrice: 15500,
    price: 34000,
    stock: 9,
    minStock: 3,
    visibleInWeb: true,
    badge: 'Gama Premium',
    image: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'dock-3in1-magsafe-fold',
    sku: 'EST-3IN1-MAG',
    barcode: '779123400210',
    category: 'Carga & Energía',
    name: 'Estación de Carga Inalámbrica 3 en 1 MagSafe Plegable',
    compatible: 'iPhone con MagSafe (12 al 16), Apple Watch y AirPods',
    features: [
      'Carga 3 dispositivos en simultáneo con un solo cable',
      'Diseño plegable ultra compacto ideal para mesa de luz o viaje',
      'Imanes de neodimio N52 de máxima fijación',
      'Luz LED indicadora suave no invasiva'
    ],
    costPrice: 22000,
    price: 48900,
    stock: 5,
    minStock: 2,
    visibleInWeb: true,
    badge: 'Estación Escritorio',
    image: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'powerbank-10000-magsafe',
    sku: 'BAT-10K-MAG',
    barcode: '779123400211',
    category: 'Carga & Energía',
    name: 'Powerbank Magnético MagSafe 10.000mAh 22.5W Fast Charge',
    compatible: 'iPhone 12 al 16 con MagSafe y cualquier móvil por USB-C',
    features: [
      'Batería portátil de 10.000mAh: hasta 2 cargas completas',
      'Se adhiere magnéticamente a la parte trasera del teléfono',
      'Salida USB-C PD 20W bidireccional y carga inalámbrica 15W',
      'Soporte plegable integrado para ver videos mientras carga'
    ],
    costPrice: 19500,
    price: 44500,
    stock: 6,
    minStock: 2,
    visibleInWeb: true,
    badge: 'Viajes & Batería Extra',
    image: 'https://images.unsplash.com/photo-1609592424314-12344795b8d2?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'cable-lightning-braided',
    sku: 'CAB-CL-12M',
    barcode: '779123400103',
    category: 'Carga & Energía',
    name: 'Cable USB-C a Lightning Reforzado Malla Nylon 1.2m',
    compatible: 'iPhone 8 al 14 Pro Max, iPad, estuches de AirPods',
    features: [
      'Malla de nylon trenzado de alta densidad antiroturas',
      'Soporta hasta 27W Power Delivery de velocidad máxima',
      'Conectores reforzados testeados en 15.000 flexiones',
      'Transferencia de fotos y datos a 480 Mbps'
    ],
    costPrice: 4800,
    price: 12500,
    stock: 22,
    minStock: 5,
    visibleInWeb: true,
    badge: 'Antiroturas',
    image: 'https://images.unsplash.com/photo-1588515724527-074a7a56616c?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'cable-usbc-60w',
    sku: 'CAB-CC-60W',
    barcode: '779123400104',
    category: 'Carga & Energía',
    name: 'Cable USB-C a USB-C Mallado 60W 1.5m',
    compatible: 'iPhone 15/16, Samsung Galaxy, iPad, MacBooks y Notebooks',
    features: [
      'Potencia soportada de 60W para celulares y notebooks',
      'Chip E-Marker con control térmico dinámico',
      'Blindaje doble con terminales metálicos anodizados'
    ],
    costPrice: 5200,
    price: 13900,
    stock: 18,
    minStock: 5,
    visibleInWeb: true,
    badge: 'Uso Rudo',
    image: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=800&auto=format&fit=crop&q=80'
  },

  // ─────────────────────────────────────────────────────────────
  // 5. ACCESORIOS & FUNDAS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'case-military-grade',
    sku: 'FND-MAG-MIL',
    barcode: '779123400107',
    category: 'Accesorios & Fundas',
    name: 'Funda Antishock MagSafe con Protección de Cámara Reforzada',
    compatible: 'iPhone 11 al 16 Pro Max, Samsung S23/S24 Series',
    features: [
      'Bordes con airbags absorbe-impactos en las 4 esquinas',
      'Aro magnético N52 integrado de alta adherencia',
      'Policarbonato anti-amarilleo con tratamiento UV',
      'Bisel elevado de 1.5mm para proteger lentes y pantalla'
    ],
    costPrice: 5900,
    price: 16500,
    stock: 16,
    minStock: 4,
    visibleInWeb: true,
    badge: 'Grado Militar',
    variants: {
      colors: ['Transparente MagSafe', 'Borde Negro MagSafe', 'Titanio MagSafe']
    },
    image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'case-silicone-felpa',
    sku: 'FND-SIL-FEL',
    barcode: '779123400212',
    category: 'Accesorios & Fundas',
    name: 'Funda Silicona Case Soft Touch con Interior de Microfibra',
    compatible: 'iPhone todos los modelos y Samsung Galaxy A/S Series',
    features: [
      'Exterior de silicona líquida suave con agarre antideslizante',
      'Interior forrado en suave felpa para evitar rayar la tapa trasera',
      'Fácil de limpiar con un paño húmedo',
      'Colores mate sobrios y elegantes'
    ],
    costPrice: 4200,
    price: 12900,
    stock: 24,
    minStock: 6,
    visibleInWeb: true,
    badge: 'Tacto Suave',
    variants: {
      colors: ['Negro Matte', 'Midnight Blue', 'Verde Pino', 'Palo Rosa', 'Arena']
    },
    image: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'hydrogel-custom-laser',
    sku: 'HID-HD-LASER',
    barcode: '779123400105',
    category: 'Accesorios & Fundas',
    name: 'Lámina de Hidrogel HD / Mate con Corte Láser en el Momento',
    compatible: 'Cualquier Celular, Tablet, Smartwatch o Consola portátil',
    features: [
      'Corte de precisión milimétrica láser en 2 minutos en el local',
      'Tecnología de autorreparación de micro rayones en 24 horas',
      'Sensación táctil ultra suave compatible con lector de huellas',
      'Colocación profesional sin burbujas incluida sin cargo'
    ],
    costPrice: 2200,
    price: 9500,
    stock: 45,
    minStock: 10,
    visibleInWeb: true,
    badge: 'Colocación en el Local',
    variants: {
      finishes: ['HD Brillante', 'Mate Antirreflejo Gamer']
    },
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'hydrogel-uv-privacy',
    sku: 'HID-PRIV-UV',
    barcode: '779123400106',
    category: 'Accesorios & Fundas',
    name: 'Hidrogel de Privacidad Antiespía + Capa Oleofóbica',
    compatible: 'iPhone y smartphones Android gama media/alta',
    features: [
      'Ángulo de visión privado: solo visible directamente de frente',
      'Bloquea miradas indiscretas desde ambos laterales',
      'Tratamiento oleofóbico que repele grasa y huellas dactilares'
    ],
    costPrice: 3500,
    price: 13500,
    stock: 20,
    minStock: 5,
    visibleInWeb: true,
    badge: 'Privacidad Total',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'camera-lens-protector',
    sku: 'PROT-CAM-ZAF',
    barcode: '779123400213',
    category: 'Accesorios & Fundas',
    name: 'Protectores Individuales de Lente de Cámara con Vidrio Zafiro 9H',
    compatible: 'iPhone 11 al 16 Pro Max y Galaxy S23/S24 Ultra',
    features: [
      'Vidrio templado dureza 9H con marco metálico del color del equipo',
      'Cero destello ni reflejos en fotos nocturnas con flash',
      'Pegamento óptico impermeable anti-polvo'
    ],
    costPrice: 2800,
    price: 8900,
    stock: 18,
    minStock: 4,
    visibleInWeb: true,
    badge: 'Protege las Lentes',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80'
  },

  // ─────────────────────────────────────────────────────────────
  // 6. GADGETS & ELECTRÓNICA PEQUEÑA
  // ─────────────────────────────────────────────────────────────
  {
    id: 'apple-airtag-single',
    sku: 'GAD-AIRTAG-1PK',
    barcode: '779123400214',
    category: 'Gadgets & Electrónica Pequeña',
    name: 'Apple AirTag - Localizador Inteligente de Precisión',
    compatible: 'Dispositivos Apple con app Encontrar (Find My)',
    features: [
      'Rastreo preciso con chip U1 y tecnología Ultra Wideband',
      'Red de millones de dispositivos Apple para ubicar llaves, mochila o auto',
      'Parlante integrado para reproducir sonido de ayuda',
      'Batería CR2032 reemplazable de más de 1 año de duración',
      'Resistencia al agua y al polvo IP67'
    ],
    costPrice: 38000,
    price: 54900,
    stock: 8,
    minStock: 2,
    visibleInWeb: true,
    badge: 'Imprescindible',
    condition: 'Nuevo Sellado',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'hub-usbc-7in1-aluminum',
    sku: 'HUB-7IN1-USBC',
    barcode: '779123400215',
    category: 'Gadgets & Electrónica Pequeña',
    name: 'Hub Adaptador Multi-puerto USB-C 7 en 1 Aluminio 4K HDMI',
    compatible: 'MacBook Air/Pro, iPad Pro, iPhone 15/16, Laptops Windows',
    features: [
      'Puerto HDMI 4K@60Hz para monitores y proyectores',
      'Puerto USB-C PD con carga passthrough de 100W',
      '2 puertos USB 3.0 de alta velocidad 5Gbps',
      'Lectores de tarjetas SD y MicroSD de transferencia veloz',
      'Cuerpo de aluminio unibody para óptima disipación de calor'
    ],
    costPrice: 19000,
    price: 43500,
    stock: 6,
    minStock: 2,
    visibleInWeb: true,
    badge: 'Productividad',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'support-car-magsafe',
    sku: 'SOP-AUTO-MAG',
    barcode: '779123400109',
    category: 'Gadgets & Electrónica Pequeña',
    name: 'Soporte Magnético de Auto para Rejilla 360° con MagSafe',
    compatible: 'Universal (iPhone 12 al 16 directo, otros con aro incluido)',
    features: [
      'Agarre ultra firme antideslizante que no se cae con baches',
      'Cabezal esférico con rotación 360° para GPS horizontal o vertical',
      'Compatible nativo con MagSafe'
    ],
    costPrice: 4200,
    price: 11900,
    stock: 12,
    minStock: 3,
    visibleInWeb: true,
    badge: 'Ideal Auto',
    image: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'adapter-otg-usbc-usba',
    sku: 'ADP-OTG-METAL',
    barcode: '779123400216',
    category: 'Gadgets & Electrónica Pequeña',
    name: 'Adaptador OTG USB-C a USB-A 3.0 Metálico Miniatura',
    compatible: 'iPhone 15/16, iPad, Mac, Smartphones Android y Laptops',
    features: [
      'Permite conectar pendrives, mouse, teclados y cámaras',
      'Velocidad de transferencia USB 3.0 de 5Gbps',
      'Carcasa de aleación de zinc resistente a rayones',
      'Diseño ultra compacto de bolsillo plug and play'
    ],
    costPrice: 1800,
    price: 5500,
    stock: 25,
    minStock: 5,
    visibleInWeb: true,
    badge: 'Super Útil',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'
  }
];
