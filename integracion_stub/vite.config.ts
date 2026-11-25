import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

const raiz = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode }) => {
  // Sin .env.local, el stub usa el mock: así basta con clonar e instalar.
  if (!loadEnv(mode, raiz, 'VITE_').VITE_TRACKING_FUENTE) process.env.VITE_TRACKING_FUENTE = 'mock'
  return {
    root: raiz,
    plugins: [vue()],
    server: { port: 5174 },
    build: { outDir: '../node_modules/.integracion_stub', emptyOutDir: true },
  }
})
