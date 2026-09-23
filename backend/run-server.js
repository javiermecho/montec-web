// Polyfill para Node 18
if (typeof globalThis.File === 'undefined') {
  try {
    const { File } = await import('node:buffer');
    if (File) globalThis.File = File;
  } catch (e) {
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

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let targetFile = path.resolve(__dirname, 'server.js');
if (!fs.existsSync(targetFile)) {
  targetFile = path.resolve(__dirname, 'backend', 'server.js');
}

console.log('⚡ [Montec Launcher] Iniciando servidor desde:', targetFile);
await import(pathToFileURL(targetFile).href);
