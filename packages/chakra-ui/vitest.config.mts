import { mergeConfig } from 'vitest/config';

import base from '../../testing/vitest.base.mts';

export default mergeConfig(base, {
  test: {
    setupFiles: ['../snapshot-tests/src/setup.ts', './test/testSetup.ts'],
  },
});
