import { enumOptionValueLabel } from '../src/index.ts';

describe('enumOptionValueLabel()', () => {
  it('spells a primitive value as its string', () => {
    expect(enumOptionValueLabel('a')).toBe('a');
    expect(enumOptionValueLabel(1)).toBe('1');
    expect(enumOptionValueLabel(null)).toBe('null');
  });
  it('spells an object or array value as its JSON', () => {
    expect(enumOptionValueLabel({ a: 1 })).toBe('{"a":1}');
    expect(enumOptionValueLabel([1, 2])).toBe('[1,2]');
  });
});
