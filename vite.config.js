import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // Proxy sem rewrite: mantém /data no path
      '/data': {
        target: 'https://bible-api.com',
        changeOrigin: true,
      }
    }
  },
  plugins: [
    {
      name: 'holyrics-listener',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/onLyricChange' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const payload = JSON.parse(body);
                console.log(payload);
                // mapeia action para evento HMR
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