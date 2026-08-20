import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  devToolbar: {
    enabled: false
  },
  vite: {
    plugins: [tailwindcss(), basicSsl()],
    server: {
      host: true,
      https: true,
      hmr: {
        protocol: 'wss' 
      }
    }
  }
});