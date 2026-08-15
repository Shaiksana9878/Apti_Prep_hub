import path from 'path';
import { defineConfig, type Plugin } from 'vite';

import claudeHandler from './api/claude.js';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

export default defineConfig({
  base: basePath,
  plugins: [claudeApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});

function claudeApiPlugin(): Plugin {
  return {
    name: 'prep-mind-claude-api',
    configureServer(server) {
      server.middlewares.use('/api/claude', async (req, res, next) => {
        if (req.method !== 'POST') {
          return next();
        }

        let rawBody = '';
        req.on('data', (chunk) => {
          rawBody += chunk;
          if (rawBody.length > 256_000) {
            req.destroy();
          }
        });
        req.on('end', async () => {
          try {
            req.body = rawBody ? JSON.parse(rawBody) : undefined;
            await claudeHandler(req, res);
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Invalid request body.' }));
          }
        });
      });
    },
  };
}
