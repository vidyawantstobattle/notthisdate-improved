import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, normalize } from 'path';
import { createReadStream, existsSync, statSync } from 'fs';

const IMAGES_DIR = resolve(__dirname, 'public/images');

// publicDir is intentionally unset: pointing it at public/ would ship the legacy
// vanilla app and collide with the React index.html. Production copies these via
// `npm run copy:assets`; this serves the same files during `vite dev`.
function serveLegacyImages() {
  return {
    name: 'serve-legacy-images',
    configureServer(server) {
      server.middlewares.use('/images', (req, res, next) => {
        const requested = decodeURIComponent((req.url || '').split('?')[0]).replace(/^\/+/, '');
        const filePath = normalize(resolve(IMAGES_DIR, requested));
        if (!filePath.startsWith(IMAGES_DIR + '/') || !existsSync(filePath) || !statSync(filePath).isFile()) {
          return next();
        }
        if (filePath.endsWith('.svg')) res.setHeader('Content-Type', 'image/svg+xml');
        createReadStream(filePath).on('error', next).pipe(res);
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), serveLegacyImages()],
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
      }
    }
  },
  server: {
    port: 8888
  }
});

