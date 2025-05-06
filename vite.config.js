// vite.config.js
import { defineConfig } from 'vite'
import path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const PROJECT_ROOT = path.resolve(__dirname)

function holyricsListener() {
  return {
    name: 'holyrics-listener',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        console.log(`[VITE HTTP] ${new Date().toISOString()} ${req.method} ${req.url}`)
        next()
      })
      server.middlewares.use((req, res, next) => {
        if (req.method === 'POST' && req.url.startsWith('/on')) {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const payload = JSON.parse(body)
              const eventMap = {
                onLyricChange:      'lyricChange',
                onBackgroundChange: 'backgroundChange',
                onThemeChange:      'themeChange',
                onVerseChange:      'verseChange'
              }
              const eventName = eventMap[payload.action]
              if (eventName) server.ws.send({ type: 'custom', event: eventName, data: payload })
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ status: 'ok' }))
            } catch (err) {
              res.writeHead(400)
              res.end('invalid JSON')
            }
          })
        } else next()
      })
    }
  }
}

export default defineConfig(({ command }) => ({
  root: PROJECT_ROOT,
  server: {
    host: '0.0.0.0',
    port: 5173,
    fs: { allow: [PROJECT_ROOT] }
  },
  plugins: [
    // Copia todos os templates HTML para o diretório de saída (build e dev)
    viteStaticCopy({
      targets: [
        {
          src: 'src/templates/**/*.html',
          dest: ''
        }
      ]
    }),
    // Listener para integração com Holyrics durante o dev
    command === 'serve' && holyricsListener()
  ].filter(Boolean)
}))
