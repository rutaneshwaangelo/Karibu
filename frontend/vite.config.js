import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // NOTE: Vite 8 bundles with Rolldown and minifies with Oxc, so the default
    // `target`/`minify` behaviour is already optimal here - overriding them
    // routes the build back through esbuild, which is no longer installed.
    //
    // Emit each lazily-loaded route as its own CSS file instead of one
    // render-blocking stylesheet.
    cssCodeSplit: true,
    // Inline anything under 4kb as a data URI to save request round-trips.
    assetsInlineLimit: 4096,
    // Warn earlier: the landing shell should stay small, everything else
    // belongs in a lazy chunk.
    chunkSizeWarningLimit: 300,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        // Split the rarely-changing vendor libraries into their own chunks so
        // they stay valid in the browser cache across app deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
            return 'vendor-react'
          }
          if (id.includes('socket.io') || id.includes('engine.io')) {
            return 'vendor-socket'
          }
          if (id.includes('lucide-react')) {
            return 'vendor-icons'
          }
          return 'vendor'
        },
      },
    },
  },
})
