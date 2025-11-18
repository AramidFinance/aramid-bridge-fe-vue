import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; connect-src 'self' https://*.walletconnect.com https://*.coinbase.com wss://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org https://*.infura.io https://*.alchemy.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; frame-src 'self' https://*.walletconnect.com https://*.walletconnect.org;",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  },
  build: {
    chunkSizeWarningLimit: 5000, // in kB
    rollupOptions: {
      external: [],
      onwarn: (warning, warn) => {
        // Suppress eval warnings from third-party libraries
        if (warning.code === 'EVAL' && warning.id?.includes('lottie-web')) {
          return
        }
        warn(warning)
      }
    }
  }
})
