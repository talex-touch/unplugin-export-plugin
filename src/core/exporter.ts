/* eslint-disable no-console */
import process from 'node:process'
import path from 'pathe'
import fs from 'fs-extra'
import cliProgress from 'cli-progress'
import { globSync } from 'glob'
import { CompressLimit, TalexCompress } from './compress-util'
import { generateFilesSha256, generateSignature } from './security-util'

export async function build() {
  const { default: chalk } = await import('chalk')
  const distPath = path.resolve('dist')
  const tmpDir = path.resolve('dist-tmp')

  fs.rmSync(distPath, { recursive: true, force: true })
  fs.rmSync(tmpDir, { recursive: true, force: true })

  console.log('\n\n\n')
  console.info(chalk.bgBlack.white(' Talex-Touch ') + chalk.blueBright(' Generating manifest.json ...'))

  const manifest = genInit()

  console.info(chalk.bgBlack.white(' Talex-Touch ') + chalk.greenBright(' Manifest.json generated successfully!'))

  await exportPlugin(manifest)

  console.info(chalk.bgBlack.white(' Talex-Touch ') + chalk.greenBright(` Export plugin ${manifest.name}-${manifest.version}.tpex successfully!`))
  console.log('\n\n\n')
}

interface IManifest {
  name: string
  version: string
  description: string
  _files?: Record<string, string>
  _signature?: string
  plugin?: {
    dev: {
      enable: boolean
      address: string
    }
  }
  build?: {
    files: string[]
    secret: {
      pos: string
      addon: string[]
    }
    verify?: {
      enable: boolean
      online: 'custom' | 'always' | 'once'
    }
    version?: {
      update: 'auto' | 'ask' | 'readable'
      downgrade: boolean
    }
  }
}

function genInit(): IManifest {
  const manifestPath = path.resolve(process.cwd(), 'manifest.json')

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

  if (!manifest.id)
    throw new Error('`id` field is required in manifest.json')

  if (!/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/.test(manifest.id))
    throw new Error('`id` field must be in the format of `com.xxx.xxx`')

  const distManifestPath = path.resolve('dist', 'manifest.json')

  fs.mkdirSync(path.resolve('dist'), { recursive: true })
  fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2))

  return manifest as IManifest
}

async function exportPlugin(manifest: IManifest) {
  const buildConfig = manifest.build || {
    files: [],
    secret: {
      pos: 'TalexTouch',
      addon: ['windows', 'darwin', 'linux'],
    },
    version: {
      update: 'auto',
      downgrade: false,
    },
  }

  const key = genStr(32)
  fs.writeFileSync(path.resolve('dist', 'key.talex'), key)

  const tmpDir = path.resolve('dist-tmp')
  fs.mkdirSync(tmpDir, { recursive: true })

  // Copy files
  const filesToCopy = [
    { from: 'index.js', to: 'index.js' },
    { from: 'widgets', to: 'widgets' },
    { from: 'preload.js', to: 'preload.js' },
    { from: 'README.md', to: 'README.md' },
    { from: 'dist/manifest.json', to: 'manifest.json' },
    { from: 'dist/key.talex', to: 'key.talex' },
  ]

  for (const file of filesToCopy) {
    const source = path.resolve(process.cwd(), file.from)
    const destination = path.join(tmpDir, file.to)
    if (fs.existsSync(source))
      fs.copySync(source, destination)
  }

  // Generate file hashes and signature
  const filesInTmp = globSync('**/*', { cwd: tmpDir, nodir: true, absolute: true })
  const filesToHash = filesInTmp.filter(file => path.basename(file) !== 'manifest.json' && path.basename(file) !== 'key.talex')

  manifest._files = generateFilesSha256(filesToHash, tmpDir)
  manifest._signature = generateSignature(manifest._files)

  // Write the final manifest with signature
  fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

  buildConfig.files = [tmpDir]

  const buildPath = path.resolve('dist', `${manifest.name.replace(/\//g, '-')}-${manifest.version}.tpex`)

  const tCompress = new TalexCompress(buildConfig.files, buildPath)

  const p = new cliProgress.SingleBar({
    format: '{step} | {bar} | {percentage}% | {value}/{total} Chunks',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  })

  tCompress.on('progress', (bytes: number) => p.update(bytes))
  tCompress.on('stats', (e: any) => {
    if (e.type === 'start') {
      p.start(e.totalFiles, 0, { step: 'Calculating file sizes' })
    }
    else if (e === -1) {
      p.stop()
      p.start(tCompress.totalBytes, 0, { step: 'Compressing files' })
    }
    else if (e.type === 'progress') {
      p.increment()
    }
  })
  tCompress.on('err', (msg: any) => console.error(msg))
  tCompress.on('flush', () => {
    p.stop()
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  tCompress.setLimit(new CompressLimit(0, 0))

  const { default: chalk } = await import('chalk')
  console.log('\n')
  console.info(chalk.bgBlack.white(' Talex-Touch ') + chalk.greenBright(' Start compressing plugin files...'))
  console.log('\n')

  await tCompress.compress()
}

function genStr(len: number): string {
  return (Math.random() * 100000).toString(16).slice(-8) + (len > 8 ? genStr(len - 8) : '')
}
