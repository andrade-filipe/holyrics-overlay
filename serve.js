// serve.js
const http = require('http');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { WebSocketServer } = require('ws');

const DIST_DIR = path.join(process.cwd(), 'dist');
const PORT     = 5173;

const nets = os.networkInterfaces();
let hostIP = 'localhost';
for (const name of Object.keys(nets)) {
  for (const iface of nets[name]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      hostIP = iface.address;
      break;
    }
  }
  if (hostIP !== 'localhost') break;
}

const server = http.createServer((req, res) => {
  console.log(`[HTTP] ${new Date().toISOString()} ${req.method} ${req.url}`);

  if (req.method === 'POST' && req.url.startsWith('/on')) {
    console.log(`[Holyrics] POST ${req.url}`);
    let body = '';
    req.on('data', chunk => { body += chunk; console.log(`[Holyrics] chunk: ${chunk}`); });
    req.on('end', () => {
      console.log(`[Holyrics] payload: ${body}`);
      try {
        const payload = JSON.parse(body);
        const eventMap = {
          onLyricChange:      'lyricChange',
          onBackgroundChange: 'backgroundChange',
          onThemeChange:      'themeChange',
          onVerseChange:      'verseChange'
        };
        const eventName = eventMap[payload.action];
        console.log(`[Holyrics] eventName: ${eventName}`);
        if (eventName) {
          wss.clients.forEach(ws => {
            if (ws.readyState === ws.OPEN) {
              console.log(`[Holyrics] sending WS message: ${eventName}`);
              ws.send(JSON.stringify({ event: eventName, data: payload }));
            }
          });
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } catch (err) {
        console.error('[Holyrics] JSON parse error', err);
        res.writeHead(400);
        res.end('invalid JSON');
      }
    });
    return;
  }

  const requestPath = req.url === '/' ? '/index.html' : req.url;
  const filePath    = path.join(DIST_DIR, requestPath);
  console.log(`[Static] serving: ${filePath}`);
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      console.warn(`[Static] not found: ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js':   'application/javascript',
      '.css':  'text/css',
      '.png':  'image/png',
      '.jpg':  'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif':  'image/gif'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
});

const wss = new WebSocketServer({ server });
wss.on('connection', ws => {
  console.log('[WS] client connected');
  ws.send(JSON.stringify({ event: 'connected', ip: hostIP }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] running at http://${hostIP}:${PORT}/`);
});
