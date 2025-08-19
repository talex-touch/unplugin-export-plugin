import path from 'path'
import fs from 'fs-extra'
import crypto from 'crypto'
import { build as viteBuild } from 'vite'
import type { Options } from '../types'
import { createArchive } from './compress-util'

export async function build(options?: Options) {
  const outDir = options?.outDir ?? 'dist'

  await viteBuild({
    build: {
      outDir,
      lib: {
        entry: {
          index: path.resolve(process.cwd(), 'src/index.ts'),
          preload: path.resolve(process.cwd(), 'src/preload.ts'),
        },
        formats: ['cjs'],
      },
      rollupOptions: {
        external: ['vue', 'vue-router', 'vuex'],
      },
    },
  })

  const widgetsDir = path.resolve(process.cwd(), 'src/widgets')
  if (fs.existsSync(widgetsDir)) {
    await fs.copy(widgetsDir, path.join(outDir, 'widgets'))
  }

  const manifestPath = path.resolve(process.cwd(), 'manifest.json')
  if (fs.existsSync(manifestPath)) {
    await fs.copy(manifestPath, path.join(outDir, 'manifest.json'))
  }

  const publicDir = path.resolve(process.cwd(), 'public')
  if (fs.existsSync(publicDir)) {
    await fs.copy(publicDir, outDir)
  }

  const archivePath = path.join(outDir, 'plugin.zip')
  await createArchive(outDir, archivePath)

  const hash = await calculateHash(archivePath)
  const signaturePath = path.join(outDir, 'signature.tuff')
  await fs.writeFile(signaturePath, hash)
}

async function calculateHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = fs.createReadStream(filePath)
    stream.on('data', data => hash.update(data))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}