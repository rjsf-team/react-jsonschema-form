import { mergeConfig } from 'vitest/config';

import base, { fullCoverage } from '../../testing/vitest.base';

export default mergeConfig(base, {
  test: {
    coverage: fullCoverage(['src/types.ts']),
  },
});
