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
});
