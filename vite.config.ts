import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'global': 'window',
    'process.browser': true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      'react-signature-canvas',
      'signature_pad',
      'react-is',
    ],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
      define: {
        global: 'window',
      },
    },
  },
  build: {
    commonjsOptions: {
      include: [/react-signature-canvas/, /signature_pad/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [],
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})

