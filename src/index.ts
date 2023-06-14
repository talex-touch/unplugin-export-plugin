import { createUnplugin } from 'unplugin'
import type { Options } from './types'
import { build } from './core/exporter'

export default createUnplugin<Options | undefined>(() => ({
  name: '@talex-touch/unplugin-export-plugin',
  async buildEnd() {
    await build()

    // eslint-disable-next-line no-console
    console.log('TalexTouch ran done!')
  },
}))
