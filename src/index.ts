import { createUnplugin } from 'unplugin'
import type { Options } from './types'
import { dev } from './core/dev'
import { build } from './core/build'

export default createUnplugin<Options | undefined>((options, meta) => {
  return {
    name: 'unplugin-tuff-devkit',
    async buildStart() {
      if (meta.framework === 'vite' && process.env.NODE_ENV === 'development')
        await dev(options)
    },
    async writeBundle() {
      if (process.env.NODE_ENV === 'production')
        await build(options)
    },
  }
})
