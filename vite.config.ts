import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves this repository from /moyu-club/. Keeping the base here
// also makes every asset URL emitted by Vite work from that subdirectory.
export default defineConfig({ base: '/moyu-club/', plugins: [react()] })
