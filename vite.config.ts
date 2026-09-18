import { defineConfig } from 'vite'

// Relative base so the built site works both at the domain root and under a
// GitHub Pages project path (https://eoinjordan.github.io/SiliconCity/).
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      input: { city: 'index.html', logic: 'logic.html' },
    },
  },
})
