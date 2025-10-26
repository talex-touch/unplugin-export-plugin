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
  const outputDir = path.resolve('dist/output')
  const buildDir = path.resolve('dist/build')

  // 保存现有 dist 产物到 dist/output
  if (fs.existsSync(distPath)) {
    // 清空 output 和 build 目录
    fs.rmSync(outputDir, { recursive: true, force: true })
    fs.rmSync(buildDir, { recursive: true, force: true })

    // 将 dist 下的现有文件移动到 dist/output（排除 output、build 目录和临时文件）
    const distFiles = fs.readdirSync(distPath)
    fs.mkdirSync(outputDir, { recursive: true })

    for (const file of distFiles) {
      if (file !== 'output' && file !== 'build' && !file.endsWith('.tpex') && !file.endsWith('.talex')) {
        const sourcePath = path.join(distPath, file)
        const destPath = path.join(outputDir, file)
        try {
          fs.moveSync(sourcePath, destPath, { overwrite: true })
        }
        catch (e) {
          // 如果移动失败，尝试复制
          fs.copySync(sourcePath, destPath, { overwrite: true })
          fs.rmSync(sourcePath, { recursive: true, force: true })
        }
      }
    }
  }

  console.log('\n\n\n')
  console.info(chalk.bgBlack.white(' Talex-Touch ') + chalk.blueBright(' Generating manifest.json ...'))

  const manifest = genInit()

  console.info(chalk.bgBlack.white(' Talex-Touch ') + chalk.greenBright(' Manifest.json generated successfully!'))

  // 合并 assets 目录
  await mergeAssets(chalk)

  const tpexPath = await exportPlugin(manifest)

  console.info(chalk.bgBlack.white(' Talex-Touch ') + chalk.greenBright(` Export plugin ${manifest.name}-${manifest.version}.tpex successfully!`))
  console.info(chalk.bgBlack.white(' Talex-Touch ') + chalk.cyan(` Output path: ${chalk.yellow(tpexPath)}`))
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

async function mergeAssets(chalk: any) {
  const assetsDir = path.resolve('assets')
  const srcAssetsDir = path.resolve('src/assets')
  const distAssetsDir = path.resolve('dist/assets')

  const assetsExists = fs.existsSync(assetsDir)
  const srcAssetsExists = fs.existsSync(srcAssetsDir)

  if (!assetsExists && !srcAssetsExists)
    return // 没有 assets 目录，跳过

  console.info(chalk.bgBlack.white(' Talex-Touch ') + chalk.blueBright(' Merging assets directories...'))

  // 检测文件冲突
  const conflicts: string[] = []

  if (assetsExists && srcAssetsExists) {
    const assetsFiles = globSync('**/*', { cwd: assetsDir, nodir: true })
    const srcAssetsFiles = globSync('**/*', { cwd: srcAssetsDir, nodir: true })

    for (const file of assetsFiles) {
      if (srcAssetsFiles.includes(file))
        conflicts.push(file)
    }

    if (conflicts.length > 0) {
      console.error(chalk.bgRed.white(' ERROR ') + chalk.red(' Assets merge conflict detected:'))
      for (const file of conflicts)
        console.error(chalk.red(`  - ${file}`))

      throw new Error('Assets merge conflict: files exist in both assets/ and src/assets/')
    }
  }

  // 清空并创建 dist/assets
  fs.rmSync(distAssetsDir, { recursive: true, force: true })
  fs.mkdirSync(distAssetsDir, { recursive: true })

  // 复制 assets
  if (assetsExists)
    fs.copySync(assetsDir, distAssetsDir)

  // 复制 src/assets
  if (srcAssetsExists)
    fs.copySync(srcAssetsDir, distAssetsDir)

  console.info(chalk.bgBlack.white(' Talex-Touch ') + chalk.greenBright(' Assets merged successfully!'))
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

async function exportPlugin(manifest: IManifest): Promise<string> {
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

  const tmpDir = path.resolve('dist/build')
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

  return path.resolve(buildPath)
}

function genStr(len: number): string {
  return (Math.random() * 100000).toString(16).slice(-8) + (len > 8 ? genStr(len - 8) : '')
}
