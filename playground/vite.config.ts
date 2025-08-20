import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import vue from '@vitejs/plugin-vue'
import TuffDevKit from '../src/vite'

export default defineConfig({
  build: {
    outDir: 'dist',
  },
  plugins: [
    Inspect(),
    vue(),
    TuffDevKit(),
  ],
})