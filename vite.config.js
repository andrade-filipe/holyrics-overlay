import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 5173
      },
  plugins: [
    {
      name: 'lyric-change-listener',
      configureServer(server) {
        // Middleware debug: log all incoming requests
        server.middlewares.use((req, res, next) => {
          console.log(`[lyric-plugin] ${req.method} ${req.url}`);
          if (req.url === '/onLyricChange' && req.method === 'POST') {
            console.log('[lyric-plugin] Handling POST /onLyricChange');
            let body = '';
            req.on('data', chunk => {
              console.log('[lyric-plugin] Received chunk:', chunk.toString());
              body += chunk;
            });
            req.on('end', () => {
              console.log('[lyric-plugin] Full body:', body);
              try {
                const payload = JSON.parse(body);
                console.log('[lyric-plugin] Parsed payload:', payload);
                // Dispara evento HMR
                server.ws.send({
                  type: 'custom',
                  event: 'lyricChange',
                  data: payload.content.lyricLine
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
              } catch (e) {
                console.error('[lyric-plugin] JSON parse error:', e);
                res.writeHead(400);
                res.end('invalid json');
              }
            });import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  plugins: [
    {
      name: 'lyric-change-listener',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/onLyricChange' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const { content: { lyricLine } } = JSON.parse(body);
                server.ws.send({ type: 'custom', event: 'lyricChange', data: lyricLine });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
              } catch {
                res.writeHead(400);
                res.end('Invalid JSON');
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
          } else {
            next();
          }
        });
      }
    }
  ]
});
