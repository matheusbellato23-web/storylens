import { defineConfig } from 'vite'
import { handleContactRequest } from './server.js'

function contactApiPlugin() {
  const attachMiddleware = (middlewares) => {
    middlewares.use('/api/contact', (req, res, next) => {
      if (req.method !== 'POST') return next()
      let raw = ''
      req.on('data', chunk => { raw += chunk })
      req.on('end', async () => {
        try {
          const body = raw ? JSON.parse(raw) : {}
          const result = await handleContactRequest(body)
          res.statusCode = result.status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(result.payload))
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ok: false, error: err.message }))
        }
      })
    })
  }

  return {
    name: 'storylens-contact-api',
    configureServer(server) {
      attachMiddleware(server.middlewares)
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares)
    },
  }
}

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [contactApiPlugin()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
})
