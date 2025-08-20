/* eslint-disable no-console */
import process from 'node:process'
import { createUnplugin } from 'unplugin'
import type { Options } from './types'
import { dev } from './core/dev'
import { build } from './core/exporter'

export default createUnplugin<Options | undefined>((options, meta) => {
  return {
    name: 'unplugin-tuff-export-plugin',
    vite: {
      configureServer(server) {
        if (process.env.NODE_ENV === 'development')
          dev(options, server)
      },
    },
    async buildStart() {
      if (meta.framework !== 'vite' && process.env.NODE_ENV === 'development')
        await dev(options)
    },
    async writeBundle() {
      await build()
    },
  }
})
