import {defineConfig} from 'vite';

/** Relocatable static build; no external CDN or hosting dependency. */
export default defineConfig({
  base:'./',
  build:{outDir:'dist',target:'es2022',sourcemap:false},
  server:{host:'0.0.0.0'}
});
