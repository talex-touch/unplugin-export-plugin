import type { Options } from 'tsup'

export default <Options>{
  entryPoints: [
    'src/index.ts',
    'src/vite.ts',
    'src/webpack.ts',
    'src/rollup.ts',
    'src/esbuild.ts',
    'src/nuxt.ts',
    'src/types.ts',
    'src/preload.ts',
  ],
  clean: true,
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  shims: true,
  target: 'node16',
  platform: 'node',
  noExternal: [/.*/],
}
