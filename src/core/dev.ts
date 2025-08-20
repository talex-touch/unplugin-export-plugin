/* eslint-disable no-console */
import process from 'node:process'
import path from 'pathe'
import type { ViteDevServer } from 'vite'
import type { Options } from '../types'

export async function dev(options?: Options, server?: ViteDevServer) {
  if (!server) {
    console.warn('Vite Dev Server not found. Tuff DevKit is running in standalone mode.')
    return
  }

  const projectRoot = process.cwd()

  const filesToWatch = [
    'manifest.json',
    'index.js',
    'preload.js',
    'widgets',
  ]

  const watcher = server.watcher

  for (const file of filesToWatch) {
    const fullPath = path.join(projectRoot, file)
    watcher.add(fullPath)
  }

  watcher.on('change', (file) => {
    const relativePath = path.relative(projectRoot, file)
    console.log(`[Tuff DevKit] File changed: ${relativePath}`)

    server.ws.send('tuff:update', {
      path: relativePath,
      timestamp: Date.now(),
    })
  })

  watcher.on('add', (file) => {
    const relativePath = path.relative(projectRoot, file)
    console.log(`[Tuff DevKit] File added: ${relativePath}`)

    server.ws.send('tuff:update', {
      path: relativePath,
      timestamp: Date.now(),
    })
  })

  watcher.on('unlink', (file) => {
    const relativePath = path.relative(projectRoot, file)
    console.log(`[Tuff DevKit] File removed: ${relativePath}`)

    server.ws.send('tuff:update', {
      path: relativePath,
      timestamp: Date.now(),
    })
  })

  console.log('[Tuff DevKit] Watching for changes...')
}
