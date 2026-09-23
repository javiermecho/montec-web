// Polyfill de compatibilidad para Node.js < 20 (especialmente Node 18 en Railway)
// Resuelve: ReferenceError: File is not defined en undici / google-ads-api

if (typeof globalThis.File === 'undefined') {
  try {
    const { File } = await import('node:buffer');
    if (File) {
      globalThis.File = File;
    }
  } catch (e) {
    // Si no está en node:buffer, crear implementación compatible con WebIDL
    class FilePolyfill extends Blob {
      constructor(parts, filename, options = {}) {
        super(parts, options);
        this.name = String(filename);
        this.lastModified = options.lastModified || Date.now();
      }
    }
    globalThis.File = FilePolyfill;
  }
}
