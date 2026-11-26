import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react()],
    resolve: {
      extensions: [
        '.web.tsx',
        '.tsx',
        '.web.ts',
        '.ts',
        '.web.jsx',
        '.jsx',
        '.web.js',
        '.js',
        '.css',
        '.json',
      ],
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
        'react-native': path.resolve(import.meta.dirname, 'src/shims/react-native-web-shim.ts'),
        'react-native-svg': path.resolve(
          import.meta.dirname,
          'node_modules/react-native-svg/lib/module/elements.web.js'
        ),
        '@react-native/assets-registry/registry': path.resolve(
          import.meta.dirname,
          'node_modules/react-native-web/dist/modules/AssetRegistry/index.js'
        ),
      },
    },
    define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      global: 'window',
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
