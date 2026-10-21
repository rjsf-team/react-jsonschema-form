import { retrieveSchema } from '@rjsf/utils';
import type { RJSFSchema } from '@rjsf/utils';

import { customizeValidator } from '../src/index.ts';

describe('an if checked for a field with no data, with useDefaults', () => {
  const root: RJSFSchema = {
    type: 'object',
    properties: { kind: { type: 'string' } },
    if: { required: ['kind'], properties: { kind: { const: 'a', default: 'a' } } },
    then: { properties: { forA: { type: 'string' } } },
    else: { properties: { other: { type: 'string' } } },
  };
  it.each([undefined, null])('checks %s as an empty object AJV can fill with defaults', (data) => {
    const validator = customizeValidator({ ajvOptionsOverrides: { useDefaults: true } });
    expect(Object.keys(retrieveSchema({ validator }, root, root, data).properties ?? {})).toEqual(['kind', 'forA']);
  });
});
