/* eslint-disable no-console */
import path from 'node:path'
import http from 'node:http'
import fs from 'fs-extra'
import { createServer, ViteDevServer, Connect } from 'vite'
import type { Options } from '../types'

// Define the files to be handled by the dev server.
const devFiles = [
  { url: '/manifest.json', path: 'manifest.json' },
  { url: '/index.js', path: 'index.js' },
  { url: '/preload.js', path: 'preload.js' },
]

export async function dev(options?: Options, server?: ViteDevServer) {
  // In development, the plugin is run from the `playground` directory,
  // so we need to go up one level to get the project root.
  const projectRoot = path.resolve(process.cwd(), '..')

  const middleware = async (
    req: Connect.IncomingMessage,
    res: http.ServerResponse,
    next: Connect.NextFunction,
  ) => {
    console.log(`Request URL: ${req.url}`)

    // Handle predefined files
    for (const file of devFiles) {
      if (req.url === file.url) {
        const filePath = path.join(projectRoot, file.path)
        console.log(`Checking for ${file.url} at: ${filePath}`)
        if (fs.existsSync(filePath)) {
          console.log(`Serving ${file.url}...`)
          const content = await fs.readFile(filePath, 'utf-8')
          // Simple content type for JS and JSON
          res.setHeader('Content-Type', file.url.endsWith('.js') ? 'application/javascript' : 'application/json')
          res.end(content)
          return
        }
        else {
          console.log(`${file.url} not found at ${filePath}.`)
        }
      }
    }

    // Handle widgets
    if (req.url?.startsWith('/widgets/')) {
      const widgetName = req.url.replace('/widgets/', '')
      const widgetPath = path.join(
        projectRoot,
        'src/widgets',
        widgetName,
      )
      console.log(`Checking for widget at: ${widgetPath}`)
      if (fs.existsSync(widgetPath)) {
        console.log(`Serving widget: ${widgetName}...`)
        const content = await fs.readFile(widgetPath, 'utf-8')
        res.setHeader('Content-Type', 'application/javascript') // Assuming widgets are JS/Vue components that will be processed
        res.end(content)
        return
      }
      else {
        console.log(`Widget not found at ${widgetPath}.`)
      }
    }

    next()
  }

  if (server) {
    console.log('Attaching middleware to existing server...')
    server.middlewares.use(middleware)
  }
  else {
    console.log('Starting Tuff dev server...')

    const newServer = await createServer({
      // any...
      plugins: [
        {
          name: 'unplugin-tuff-devkit-dev',
          configureServer(server) {
            console.log('Configuring new server...')
            server.middlewares.use(middleware)
          },
        },
      ],
    })

    await newServer.listen()

    newServer.printUrls()
  }
}