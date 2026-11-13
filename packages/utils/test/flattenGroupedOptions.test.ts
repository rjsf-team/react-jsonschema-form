import { flattenGroupedOptions, groupEnumOptions } from '../src/index.ts';
import type { EnumOptionsType } from '../src/index.ts';

const options: EnumOptionsType[] = [
  { value: 'foo', label: 'Foo' },
  { value: 'bar', label: 'Bar' },
  { value: 'baz', label: 'Baz' },
  { value: 'qux', label: 'Qux' },
];

describe('flattenGroupedOptions', () => {
  it('returns the same list when nothing is grouped', () => {
    const grouped = groupEnumOptions(options);
    expect(flattenGroupedOptions(grouped)).toEqual(grouped);
  });

  it('flattens groups back into a list, in grouped-then-ungrouped order', () => {
    const grouped = groupEnumOptions(options, { 'Group A': ['foo', 'bar'] });
    expect(flattenGroupedOptions(grouped).map((o) => o.value)).toEqual(['foo', 'bar', 'baz', 'qux']);
  });

  it('returns an empty array for an empty input', () => {
    expect(flattenGroupedOptions([])).toEqual([]);
  });
});
