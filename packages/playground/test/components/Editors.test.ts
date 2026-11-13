import { isObject } from '@rjsf/utils';

import { parseEdited } from '../../src/components/Editors.tsx';

describe('parseEdited', () => {
  it('returns the parsed value the guard accepts', () => {
    expect(parseEdited('{ "type": "string" }', isObject)).toEqual({ type: 'string' });
  });

  it.each([['5'], ['[]'], ['true'], ['null'], ['"x"']])('returns undefined for %s where an object belongs', (code) => {
    expect(parseEdited(code, isObject)).toBeUndefined();
  });

  it('returns undefined for text that is not JSON', () => {
    expect(parseEdited('{', isObject)).toBeUndefined();
  });
});
