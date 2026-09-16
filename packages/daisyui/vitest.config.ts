import { mergeConfig } from 'vitest/config';

import base from '../../testing/vitest.base.ts';

export default mergeConfig(base, {
  test: {
    coverage: {
      exclude: ['node_modules/**', 'test/**'],
    },
  },
});
