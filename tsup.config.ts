import type { Options } from 'tsup'

export default <Options>{
  entryPoints: [
    'src/*.ts',
  ],
  clean: true,
  format: ['cjs', 'esm'],
  dts: true,
  target: 'es2020',
  external: ['lightningcss'],
  onSuccess: 'npm run build:fix',
}