import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { wpc_attachDevApi } from './server/dev-api'

/**
 * 让浏览器调试时也能读写项目里的 data 目录。
 */
const wpc_vaultDevPlugin = (): Plugin => ({
  name: 'hoshisen-vault',
  configureServer(server: ViteDevServer) {
    wpc_attachDevApi(server, process.cwd())
  },
})

export default defineConfig({
  base: './',
  plugins: [react(), wpc_vaultDevPlugin()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/data/**', '**/release/**', '**/dist-electron/**'],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  },
})
