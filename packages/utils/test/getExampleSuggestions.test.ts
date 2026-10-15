import type { RJSFSchema } from '../src/index.ts';
import { getExampleSuggestions } from '../src/index.ts';

describe('getExampleSuggestions()', () => {
  it('returns no suggestions without examples', () => {
    expect(getExampleSuggestions({ type: 'string', default: 'a' })).toEqual([]);
  });
  it('returns the examples followed by the default, each once', () => {
    expect(getExampleSuggestions({ type: 'integer', default: 5432, examples: ['5432', 3306, true] })).toEqual([
      '5432',
      '3306',
      'true',
    ]);
  });
  it('leaves out null, object and array examples and defaults', () => {
    expect(getExampleSuggestions({ default: null, examples: ['a', null, { a: 1 }, [1]] })).toEqual(['a']);
  });
  it('returns no suggestions when no example or default can be suggested', () => {
    expect(getExampleSuggestions({ examples: [null, { a: 1 }] })).toEqual([]);
  });
  it('returns the same array for the same schema object', () => {
    const schema = { examples: ['a'] };
    expect(getExampleSuggestions(schema)).toBe(getExampleSuggestions(schema));
  });
  it('returns one shared array for every schema without examples', () => {
    expect(getExampleSuggestions({ type: 'string' })).toBe(getExampleSuggestions({ type: 'number' }));
  });
  it.each<[string, RJSFSchema]>([
    ['with examples', { examples: ['a'] }],
    ['without examples', { type: 'string' }],
  ])('returns a frozen array for a schema %s, since every caller shares it', (_, schema) => {
    expect(Object.isFrozen(getExampleSuggestions(schema))).toBe(true);
  });
});
