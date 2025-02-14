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
      '@rjsf/bootstrap-4': path.resolve(__dirname, '../bootstrap-4/src'),
      '@rjsf/chakra-ui': path.resolve(__dirname, '../chakra-ui/src'),
      '@rjsf/core': path.resolve(__dirname, '../core/src'),
      '@rjsf/fluent-ui': path.resolve(__dirname, '../fluent-ui/src'),
      '@rjsf/fluentui-rc': path.resolve(__dirname, '../fluentui-rc/src'),
      '@rjsf/mantine': path.resolve(__dirname, '../mantine/src'),
      '@rjsf/material-ui': path.resolve(__dirname, '../material-ui/src'),
      '@rjsf/mui': path.resolve(__dirname, '../mui/src'),
      '@rjsf/semantic-ui': path.resolve(__dirname, '../semantic-ui/src'),
      '@rjsf/utils': path.resolve(__dirname, '../utils/src'),
      '@rjsf/validator-ajv8': path.resolve(__dirname, '../validator-ajv8/src'),
      // validator-ajv6 can not be mapped directly to the sources, because that causes wrong ajv version resolution
      // which looks related to: https://github.com/vitejs/vite/issues/12618
      //
      // the difference when mapping directly vs mapping to src folder - @vitejs/plugin-react can not be applied in the 2nd case
      '@rjsf/validator-ajv6': '@rjsf/validator-ajv6/src',
    },
  },
});
