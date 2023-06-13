# TalexTouch # PluginExporter

[![NPM version](https://img.shields.io/npm/v/@talex-touch/unplugin-export-plugin?color=a1b858&label=)](https://www.npmjs.com/package/unplugin-starter)

Export **unplugin** for [talex-touch](https://github.com/talex-touch/talex-touch).

## Install

```bash
npm i @talex-touch/unplugin-export-plugin
```

Next in your `vite.config.js` or `vite.config.ts`

### Vite

``` ts
import TouchPluginExport from '@talex-touch/unplugin-export-plugin/vite'

export default defineConfig({
  plugins: [
    ....,
    TouchPluginExport()
  ],
})
```

## Description

### Auto Generate Manifest

It will automatically generate a `manifest.json` when you build.

### Auto Wrap Project -> Plugin

Generate a `touch-plugin` file on the `build` folder!

For more about it, see the source code.

## Contact

You could contact author by `TalexDreamSoul@Gmail.com`
