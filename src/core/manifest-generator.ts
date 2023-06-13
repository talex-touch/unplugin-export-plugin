/* eslint-disable no-console */
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'

export function build() {
  console.info(chalk.bgBlack.white('Talex-Touch') + chalk.blueBright(' Generating manifest.json ...'))

  genInit()

  console.info(chalk.bgBlack.white('Talex-Touch') + chalk.greenBright(' Manifest.json generated successfully!'))
}

function genInit() {
  const packagePath = path.join(__dirname, 'package.json')

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

  const manifestPath = path.join(__dirname, 'dist', 'manifest.json')

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
}
