import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// base must match GitHub Pages project path: https://USER.github.io/hbee-giao-viec/
export default defineConfig({
  base: '/hbee-giao-viec/',
  plugins: [react(), tailwindcss()],
})
