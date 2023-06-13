import { createUnplugin } from 'unplugin'
import type { Options } from './types'
import { build } from './core/exporter'

export default createUnplugin<Options | undefined>(() => ({
  name: '@talex-touch/unplugin-export-plugin',
  buildEnd() {
    build()
  },
}))
