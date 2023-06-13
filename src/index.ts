import { createUnplugin } from 'unplugin'
import type { Options } from './types'
import { build } from './core/manifest-generator'

export default createUnplugin<Options | undefined>(options => ({
  name: '@talex-touch/unplugin-export-plugin',
  buildEnd() {
    build()
  },
}))
