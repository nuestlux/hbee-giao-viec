/**
 * GitHub Pages has no SPA rewrite. Serving a copy of index.html as 404.html
 * makes deep links (/login, /tasks/…) load the app instead of a hard 404.
 */
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const dist = resolve(import.meta.dirname, '..', 'dist')
const index = resolve(dist, 'index.html')
const notFound = resolve(dist, '404.html')

if (!existsSync(index)) {
  console.error('copy-spa-404: dist/index.html missing — run vite build first')
  process.exit(1)
}

copyFileSync(index, notFound)
console.log('copy-spa-404: wrote dist/404.html')
