import path from 'path'
import fs from 'fs-extra'
import { createServer } from 'vite'
import type { Options } from '../types'

export async function dev(options?: Options) {
  const server = await createServer({
    // any...
    plugins: [
      {
        name: 'unplugin-tuff-devkit-dev',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/manifest.json') {
              const manifestPath = path.resolve(process.cwd(), 'manifest.json')
              if (fs.existsSync(manifestPath)) {
                const manifest = await fs.readJSON(manifestPath)
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(manifest))
                return
              }
            }

            if (req.url?.startsWith('/widgets/')) {
              const widgetName = req.url.replace('/widgets/', '')
              const widgetPath = path.resolve(
                process.cwd(),
                'src/widgets',
                widgetName,
              )
              if (fs.existsSync(widgetPath)) {
                const content = await fs.readFile(widgetPath, 'utf-8')
                res.setHeader('Content-Type', 'application/javascript')
                res.end(content)
                return
              }
            }

            next()
          })
        },
      },
    ],
  })

  await server.listen()

  server.printUrls()
}