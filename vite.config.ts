import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        root: path.resolve(__dirname, 'index.html'),
        control: path.resolve(__dirname, 'control/index.html'),
        projector: path.resolve(__dirname, 'projector/index.html'),
        mobile: path.resolve(__dirname, 'mobile/index.html')
      }
    }
  }
});
