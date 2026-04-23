import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true, // Listen on 0.0.0.0 so subdomain testing works (e.g. acme.localhost:5173)
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'https://localhost:7100',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['bootstrap', 'lucide-react'],
            i18n: ['i18next', 'react-i18next'],
            forms: ['react-hook-form'],
          },
        },
      },
      sourcemap: mode !== 'production',
    },
  };
});
