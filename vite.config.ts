import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function pwaAssetManifest(): Plugin {
  return {
    name: 'pwa-asset-manifest',
    generateBundle(_, bundle) {
      const assets = Object.values(bundle).map(output => output.fileName).filter(file => /\.(?:js|css)$/.test(file))
      this.emitFile({ type: 'asset', fileName: 'pwa-assets.json', source: JSON.stringify(assets) })
    },
  }
}

// GitHub Pages serves this repository from /moyu-club/. Every emitted URL,
// manifest URL and Service Worker scope stays inside that same subdirectory.
export default defineConfig({ base: '/moyu-club/', plugins: [react(), pwaAssetManifest()] })
