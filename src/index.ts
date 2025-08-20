/* eslint-disable no-console */
import process from 'node:process'
import path from 'pathe'
import fs from 'fs-extra'
import { createUnplugin } from 'unplugin'
import type { Options } from './types'
import { build } from './core/exporter'

const VIRTUAL_PREFIX = 'virtual:tuff-raw/'
const VIRTUAL_PREFIX_RESOLVED = `\0${VIRTUAL_PREFIX}`

export default createUnplugin<Options | undefined>((options, meta) => {
  const projectRoot = process.cwd()
  const filesToVirtualize = [
    'manifest.json',
    'index.js',
    'preload.js',
  ]

  return {
    name: 'unplugin-tuff-export-plugin',
    enforce: 'pre',

    resolveId(id) {
      if (filesToVirtualize.includes(id) || id.startsWith('widgets/')) {
        return VIRTUAL_PREFIX_RESOLVED + id
      }
      return null
    },

    load(id) {
      if (id.startsWith(VIRTUAL_PREFIX_RESOLVED)) {
        const originalId = id.slice(VIRTUAL_PREFIX_RESOLVED.length)
        const filePath = path.join(projectRoot, originalId)
        try {
          return fs.readFileSync(filePath, 'utf-8')
        }
        catch (e) {
          console.error(`[Tuff DevKit] Failed to load virtual module: ${originalId}`, e)
          return null
        }
      }
      return null
    },

    vite: {
      configureServer(server) {
        const filesToWatch = [...filesToVirtualize, 'widgets']
        const watcher = server.watcher

        for (const file of filesToWatch) {
          watcher.add(path.join(projectRoot, file))
        }

        const handleFileChange = (file: string) => {
          const relativePath = path.relative(projectRoot, file)
          console.log(`[Tuff DevKit] File changed: ${relativePath}`)

          // Invalidate the virtual module
          const virtualId = VIRTUAL_PREFIX_RESOLVED + relativePath
          const mod = server.moduleGraph.getModuleById(virtualId)
          if (mod) {
            server.moduleGraph.invalidateModule(mod)
            console.log(`[Tuff DevKit] Invalidated module: ${virtualId}`)
          }

          // Notify Tuff host
          server.ws.send('tuff:update', {
            path: relativePath,
            timestamp: Date.now(),
          })
        }

        watcher.on('change', handleFileChange)
        watcher.on('add', handleFileChange)
        watcher.on('unlink', handleFileChange)

        console.log('[Tuff DevKit] Virtual module system and HMR enabled.')
      },
    },

    async writeBundle() {
      if (meta.framework === 'vite') {
        await build()
      }
    },
  }
})