import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        root: path.resolve(__dirname, 'index.html'),
        laptop: path.resolve(__dirname, 'laptop/index.html'),
        mobile: path.resolve(__dirname, 'mobile/index.html')
      }
    }
  }
});
