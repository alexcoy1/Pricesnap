import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { paytrailApiPlugin } from './vite-plugin-paytrail-api';

export default defineConfig(({ mode }) => ({
  plugins: [react(), paytrailApiPlugin(mode)],
  server: {
    port: 3000,
    strictPort: false,
  },
}));
