/* eslint-disable no-console */
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import cliProgress from 'cli-progress'
import { CompressLimit, TalexCompress } from './compress-util'

export async function build() {
  console.log('\n\n\n')
  console.info(chalk.bgBlack.white(' Talex-Touch ') + chalk.blueBright(' Generating manifest.json ...'))

  const manifest = genInit()

  console.info(chalk.bgBlack.white(' Talex-Touch ') + chalk.greenBright(' Manifest.json generated successfully!'))

  await exportPlugin(manifest)

  console.info(chalk.bgBlack.white(' Talex-Touch ') + chalk.greenBright(` Export plugin ${manifest.name}-${manifest.version}.touch-plugin successfully!`))
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
  const packagePath = path.resolve('package.json')

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

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  return manifest as IManifest
}

async function exportPlugin(manifest: IManifest) {
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

  if (!build.files.length) {
    console.warn(chalk.bgBlack.white(' Talex-Touch ') + chalk.yellowBright(' Your package.json must contain `build` field to choose what you want to export.'))
    console.warn(chalk.bgBlack.white(' Talex-Touch ') + chalk.yellowBright(' All files would be packed, this may tack a long time!'))

    build.files.push(path.resolve('dist'))
  }
  else {
    build.files.push(path.resolve('dist', 'manifest.json'))
    build.files.push(path.resolve('dist', 'key.talex'))
  }

  console.log(chalk.bgBlack.white(' Talex-Touch ') + chalk.gray(' Files to be packed: ') + build.files)

  const content = `@@@${manifest.name}\n${JSON.stringify(manifest)}\n\n\n`
  const length = content.length + 25

  const l = length.toString().padStart(5, '0')

  // const tarStream = new compressing.tar.Stream()
  const buildPath = path.resolve('dist', `${manifest.name}-${manifest.version}.touch-plugin`)

  // build.files.forEach(file => tarStream.addEntry(file))
  const tCompress = new TalexCompress(
    build.files,
    buildPath,
    `TalexTouch-PluginPackage@@${l}${content}`,
  )

  const p = new cliProgress.SingleBar({
    format: '{step} Progress | {bar} | {percentage}% | {value}/{total} Chunks',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  })

  tCompress.on('progress', (bytes: number) => {
    p.update(bytes)
  })

  tCompress.on('stats', (e: any) => {
    if (e === 0)
      return p.update(0, { step: 'Stats' })

    if (e === -1) {
      p.stop()
      p.start(tCompress.totalBytes, 0, { step: 'Compress' })
    }
    else {
      p.increment()
    }
  })

  tCompress.on('err', (msg: any) => console.error(msg))

  tCompress.on('flush', () => {
    // exec(`explorer.exe /select,${path.normalize(target)}`)
    p.stop()
  })

  tCompress.setLimit(new CompressLimit(0, 0))

  p.start(build.files.length, 0, {
    step: 'Stats',
  })

  console.log('\n')

  console.info(chalk.bgBlack.white(' Talex-Touch ') + chalk.greenBright(' Start compressing plugin files...'))

  console.log('\n')

  await tCompress.compress()
}

function genStr(len: number): string {
  return (Math.random() * 100000).toString(16).slice(-8) + (len > 8 ? genStr(len - 8) : '')
}
