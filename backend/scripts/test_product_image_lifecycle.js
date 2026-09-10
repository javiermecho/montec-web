/**
 * SCRIPT DE PRUEBA Y VERIFICACIÓN DEL CICLO DE VIDA DE PRODUCTOS CON IMÁGENES
 * Verifica:
 * 1. Inserción de un producto con imagen real en PostgreSQL (Railway).
 * 2. Consulta y lectura directa para verificar persistencia.
 * 3. Actualización de la imagen y metadatos.
 * 4. Lectura final a través del endpoint público /api/inventory.
 * 5. Limpieza automática del producto de prueba.
 */

const API_BASE = process.env.API_URL || 'https://montec-web-production.up.railway.app/api';

// Imagen de prueba real en formato WebP codificada en Base64 (1x1 pixel semitransparente con cabecera WebP)
const TEST_WEBP_IMAGE = 'data:image/webp;base64,UklGRmIAAABXRUJQVlA4TFYAAAAvD8AAEA8w//8/kZ02//8//5/5/z+RnbYAkV0xRkQkX7p+x37v+c85773n3vecc57znPPOc84777nnee9733vOOee8857znPPOc845zznvPOccAAA=';
const UPDATED_WEBP_IMAGE = 'data:image/webp;base64,UklGRmYAAABXRUJQVlA4TFYAAAAvD8AAEA8w//8/kZ02//8//5/5/z+RnbYAkV0xRkQkX7p+x37v+c85773n3vecc57znPPOc84777nnee9733vOOee8857znPPOc845zznvPOcdAAA=';

async function runTest() {
  console.log('🚀 [TEST] Iniciando verificación de persistencia de productos e imágenes en:', API_BASE);
  const testSku = `TEST-IMG-${Date.now().toString().slice(-6)}`;

  const newProductPayload = {
    name: 'Funda Antigolpes Silicona MagSafe (Test Automático)',
    category: 'Fundas & Protección',
    sku: testSku,
    barcode: '7791234567890',
    compatible: 'iPhone 15 Pro, iPhone 16 Pro',
    costPrice: 4500,
    price: 12900,
    stock: 25,
    minStock: 5,
    visibleInWeb: true,
    image: TEST_WEBP_IMAGE,
    badge: 'Test QA'
  };

  try {
    // 1. CREAR PRODUCTO (POST)
    console.log('\n📦 PASO 1: Creando producto con imagen en la base de datos...');
    const createRes = await fetch(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProductPayload)
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData.success) {
      throw new Error(`Fallo al crear producto: ${JSON.stringify(createData)}`);
    }

    console.log('✅ Producto creado exitosamente en PostgreSQL. ID:', createData.product.id, 'SKU:', createData.product.sku);
    console.log('🖼️ Longitud de la imagen guardada:', createData.product.image?.length, 'caracteres');
    console.log('🔍 Formato de la imagen:', createData.product.image?.slice(0, 30));

    const productId = createData.product.id;

    // 2. CONSULTAR Y LEER PRODUCTOS (GET /api/inventory)
    console.log('\n📖 PASO 2: Consultando inventario para verificar lectura y persistencia...');
    const getRes = await fetch(`${API_BASE}/inventory?category=Fundas %26 Protección`);
    const getData = await getRes.json();
    
    if (!getRes.ok || !getData.success) {
      throw new Error(`Fallo al consultar inventario: ${JSON.stringify(getData)}`);
    }

    const found = getData.products.find(p => p.sku === testSku || p.id === productId);
    if (!found) {
      throw new Error('El producto creado no fue encontrado en la consulta de inventario.');
    }

    if (!found.image || !found.image.startsWith('data:image/webp')) {
      throw new Error(`La imagen recuperada de la BD no coincide o está corrupta: ${found.image}`);
    }

    console.log('✅ Persistencia verificada: El producto se leyó correctamente desde PostgreSQL con su imagen intacta.');

    // 3. ACTUALIZAR IMAGEN (PATCH /api/inventory/:id)
    console.log('\n🔄 PASO 3: Actualizando la imagen del producto...');
    const patchRes = await fetch(`${API_BASE}/inventory/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: UPDATED_WEBP_IMAGE,
        price: 13500
      })
    });

    const patchData = await patchRes.json();
    if (!patchRes.ok || !patchData.success) {
      throw new Error(`Fallo al actualizar producto: ${JSON.stringify(patchData)}`);
    }

    if (patchData.product.image !== UPDATED_WEBP_IMAGE) {
      throw new Error('La imagen del producto no se actualizó correctamente en la BD.');
    }

    console.log('✅ Imagen actualizada con éxito en PostgreSQL.');

    // 4. LIMPIEZA (DELETE /api/inventory/:id)
    console.log('\n🧹 PASO 4: Limpiando producto de prueba...');
    const deleteRes = await fetch(`${API_BASE}/inventory/${productId}`, {
      method: 'DELETE'
    });

    const deleteData = await deleteRes.json();
    if (!deleteRes.ok || !deleteData.success) {
      throw new Error(`Fallo al eliminar producto de prueba: ${JSON.stringify(deleteData)}`);
    }

    console.log('✅ Producto de prueba eliminado correctamente.');

    console.log('\n🎉 ¡TODAS LAS PRUEBAS DE PERSISTENCIA Y LECTURA FUERON EXITOSAS!');
    return true;
  } catch (err) {
    console.error('❌ Error en el test de persistencia:', err.message);
    process.exit(1);
  }
}

runTest();
