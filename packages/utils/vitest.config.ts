import { mergeConfig } from 'vitest/config';

import base, { fullCoverage } from '../../testing/vitest.base.ts';

export default mergeConfig(base, {
  test: {
    // Most utils are pure functions; the DOM-dependent test files opt back into
    // jsdom with a /** @vitest-environment jsdom */ pragma.
    environment: 'node',
    exclude: ['node_modules/**', 'lib-test/**'],
    coverage: fullCoverage(),
  },
});
