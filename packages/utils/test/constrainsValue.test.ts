import { constrainsValue } from '../src/index.ts';

describe('constrainsValue()', () => {
  it.each(['enum', 'minLength', 'required', 'properties', 'allOf', 'not', '$ref'])(
    'says %s constrains the value',
    (keyword) => {
      expect(constrainsValue(keyword)).toBe(true);
    },
  );

  it.each(['type', 'title', 'default', '$id', '$defs', 'definitions', 'discriminator', 'x-group'])(
    'says %s does not',
    (keyword) => {
      expect(constrainsValue(keyword)).toBe(false);
    },
  );
});
