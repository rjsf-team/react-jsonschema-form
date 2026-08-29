import { mergeConfig } from 'vitest/config';

import base, { fullCoverage } from '../../testing/vitest.base';

export default mergeConfig(base, {
  test: {
    globalSetup: ['./test/harness/globalSetup.ts'],
    coverage: fullCoverage(),
  },
});
