#!/usr/bin/env node
/* eslint-disable no-console */
import process from 'node:process'
import { build } from '../core/exporter'

async function main() {
  try {
    await build()
  }
  catch (error) {
    const message = error instanceof Error ? error.stack ?? error.message : String(error)
    console.error(message)
    process.exitCode = 1
  }
}

main()
