import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Production (GitHub Pages): /hbee-giao-viec/
// Local dev: /  → mở http://localhost:5173/ là vào được
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/hbee-giao-viec/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
  },
}))
