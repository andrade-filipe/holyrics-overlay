import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

const PROJECT_ROOT   = path.resolve(__dirname);
const IMAGES_DIR     = path.join(PROJECT_ROOT, 'holyrics-images');

export default defineConfig({
  root: PROJECT_ROOT,
  server: {
    host: '0.0.0.0',
    port: 5173,
    fs: {
      allow: [PROJECT_ROOT, IMAGES_DIR]
    }
  },
  plugins: [
    {
      name: 'holyrics-listener',
      configureServer(server) {
        server.middlewares.use('/holyrics-images', (req, res, next) => {
          const rel    = decodeURIComponent(req.url.replace(/^\/holyrics-images\//, ''));
          const full   = path.join(IMAGES_DIR, rel);
          fs.stat(full, (err, st) => {
            if (err || !st.isFile()) return next();
            const ext = path.extname(full).toLowerCase();
            const mime = {
              '.png':  'image/png',
              '.jpg':  'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.gif':  'image/gif'
            }[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': mime });
            fs.createReadStream(full).pipe(res);
          });
        });

        // 2) listener dos eventos do Holyrics
        server.middlewares.use((req, res, next) => {
          if (req.url === '/onLyricChange' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => (body += chunk));
            req.on('end', () => {
              try {
                const payload = JSON.parse(body);
                const eventMap = {
                  onLyricChange:     'lyricChange',
                  onBackgroundChange:'backgroundChange',
                  onThemeChange:     'themeChange',
                  onVerseChange:     'verseChange'
                };
                const eventName = eventMap[payload.action];
                if (eventName) {
                  server.ws.send({
                    type: 'custom',
                    event: eventName,
                    data: payload
                  });
                } else {
                  console.warn(`[holyrics-listener] ação desconhecida: ${payload.action}`);
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
              } catch (err) {
                console.error('[holyrics-listener] JSON inválido', err);
                res.writeHead(400);
                res.end('invalid json');
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ]
});