import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react()
      ],
      define: {
        'import.meta.env.VITE_ADMIN_PASSWORD': JSON.stringify(env.VITE_ADMIN_PASSWORD || 'jacopo'),
        'import.meta.env.VITE_GITHUB_TOKEN': JSON.stringify(env.VITE_GITHUB_TOKEN || ''),
        'import.meta.env.VITE_GITHUB_REPO': JSON.stringify(env.VITE_GITHUB_REPO || ''),
        'import.meta.env.VITE_GITHUB_BRANCH': JSON.stringify(env.VITE_GITHUB_BRANCH || 'main'),
        'import.meta.env.VITE_CONTENT_PATH': JSON.stringify(env.VITE_CONTENT_PATH || 'content'),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
            }
          }
        }
      },
      publicDir: 'public'
    };
});
