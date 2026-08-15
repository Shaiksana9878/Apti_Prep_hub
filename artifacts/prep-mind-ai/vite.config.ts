import path from 'path';
import { defineConfig, type Plugin } from 'vite';

import claudeHandler from './api/claude.js';

const port = Number(process.env.PORT || '5173');
const basePath = process.env.BASE_PATH || '/';

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
    strictPort: false,
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
            res.setHeader(
              'Content-Type',
              'application/json; charset=utf-8',
            );
            res.end(
              JSON.stringify({
                error: 'Invalid request body.',
              }),
            );
          }
        });
      });
    },
  };
}
