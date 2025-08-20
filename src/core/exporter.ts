/* eslint-disable no-console */
import process from 'node:process'
import path from 'pathe'
import fs from 'fs-extra'
import * as cliProgress from 'cli-progress'
import { CompressLimit, TalexCompress } from './compress-util'

export async function build() {
  const { default: chalk } = await import('chalk')
  fs.rmSync(path.resolve('dist'), { recursive: true, force: true })
  fs.rmSync(path.resolve('dist-tmp'), { recursive: true, force: true })

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
  const packagePath = path.resolve(process.cwd(), '../package.json')

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))

  const { name, version, description, 'talex-touch': touch } = packageJson

  const manifest = {
    name,
    version,
    icon: {
      type: 'remix',
      value: 'github',
    },
    description,
    plugin: touch?.plugin,
    build: touch?.build,
  }

  const manifestPath = path.resolve('dist', 'manifest.json')

  fs.mkdirSync(path.resolve('dist'), { recursive: true })
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  return manifest as IManifest
}

async function exportPlugin(manifest: IManifest) {
  const { default: chalk } = await import('chalk')
  const build = manifest.build || {
    files: [],
    secret: {
      pos: 'TalexTouch',
      addon: [
        'windows',
        'darwin',
        'linux',
      ],
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

  // Copy files manually
  const filesToCopy = [
    { from: 'index.js', to: 'index.js' },
    { from: 'widgets', to: 'widgets' },
    { from: 'preload.js', to: 'preload.js' },
    { from: '../README.md', to: 'README.md' },
    { from: 'dist/manifest.json', to: 'manifest.json' },
    { from: 'dist/key.talex', to: 'key.talex' },
  ]

  for (const file of filesToCopy) {
    const source = path.resolve(process.cwd(), file.from)
    const destination = path.join(tmpDir, file.to)
    if (fs.existsSync(source))
      fs.copySync(source, destination)
    else
      console.warn(chalk.bgBlack.white(' Talex-Touch ') + chalk.yellowBright(` File not found, skipping: ${source}`))
  }

  build.files = [tmpDir]

  console.log(chalk.bgBlack.white(' Talex-Touch ') + chalk.gray(' Files to be packed: ') + build.files)

  // const tarStream = new compressing.tar.Stream()
  const buildPath = path.resolve('dist', `${manifest.name.replace(/\//g, '-')}-${manifest.version}.tpex`)

  // build.files.forEach(file => tarStream.addEntry(file))
  const tCompress = new TalexCompress(
    build.files,
    buildPath
    ,
  )

  const p = new cliProgress.SingleBar({
    format: '{step} | {bar} | {percentage}% | {value}/{total} Chunks',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  })

  tCompress.on('progress', (bytes: number) => {
    p.update(bytes)
  })

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
    // exec(`explorer.exe /select,${path.normalize(target)}`)
    p.stop()
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  tCompress.setLimit(new CompressLimit(0, 0))

  // The progress bar will be started in the 'stats' event handler.

  console.log('\n')

  console.info(chalk.bgBlack.white(' Talex-Touch ') + chalk.greenBright(' Start compressing plugin files...'))

  console.log('\n')

  await tCompress.compress()
}

function genStr(len: number): string {
  return (Math.random() * 100000).toString(16).slice(-8) + (len > 8 ? genStr(len - 8) : '')
}
