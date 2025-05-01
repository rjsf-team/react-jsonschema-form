import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // base needs to be changed for links to work in GitHub pages
  base: process.env.NODE_ENV === 'production' ? './' : '/',
  server: {
    port: 8080,
    open: process.env.NODE_ENV !== 'production',
  }, // maintain the old webpack behavior in dev
  plugins: [react()],
  resolve: {
    preserveSymlinks: true, // Fixes https://github.com/rjsf-team/react-jsonschema-form/issues/3228
    alias: {
      // mapping packages in monorepo to make vite use sources directly avoiding build step
      '@rjsf/antd': path.resolve(__dirname, '../antd/src'),
      '@rjsf/chakra-ui': path.resolve(__dirname, '../chakra-ui/src'),
      '@rjsf/core': path.resolve(__dirname, '../core/src'),
      '@rjsf/fluentui-rc': path.resolve(__dirname, '../fluentui-rc/src'),
      '@rjsf/mui': path.resolve(__dirname, '../mui/src'),
      '@rjsf/react-bootstrap': path.resolve(__dirname, '../react-bootstrap/src'),
      '@rjsf/semantic-ui': path.resolve(__dirname, '../semantic-ui/src'),
      '@rjsf/shadcn': path.resolve(__dirname, '../shadcn/src'),
      // We want to pick up the browser version of the utils
      '@rjsf/utils': path.resolve(__dirname, '../utils/src'),
      '@rjsf/validator-ajv8': path.resolve(__dirname, '../validator-ajv8/src'),
      '@rjsf/daisyui': path.resolve(__dirname, '../daisyui/src'),
    },
  },
});
