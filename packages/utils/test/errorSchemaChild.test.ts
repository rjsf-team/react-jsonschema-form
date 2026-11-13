import { errorSchemaChild, ERRORS_KEY } from '../src/index.ts';

describe('errorSchemaChild()', () => {
  it('returns a plain object or an array under a field key', () => {
    const node = { [ERRORS_KEY]: ['bad'] };
    const items = [node];
    expect(errorSchemaChild('name', node)).toBe(node);
    expect(errorSchemaChild('list', items)).toBe(items);
  });

  it('returns undefined for the __errors array of messages and for a leaf', () => {
    expect(errorSchemaChild(ERRORS_KEY, ['bad'])).toBeUndefined();
    expect(errorSchemaChild('name', 'bad')).toBeUndefined();
    expect(errorSchemaChild('name', null)).toBeUndefined();
    expect(errorSchemaChild('when', new Date())).toBeUndefined();
  });
});
