import { isEnumOptionsGroup } from '../src/index.ts';
import type { EnumOptionsGroupType, IndexedEnumOptionType } from '../src/index.ts';

describe('isEnumOptionsGroup', () => {
  it('returns true for a group', () => {
    const group: EnumOptionsGroupType = { label: 'Group A', options: [] };
    expect(isEnumOptionsGroup(group)).toBe(true);
  });
  it('returns false for a standalone option', () => {
    const option: IndexedEnumOptionType = { value: 'foo', label: 'Foo', index: 0, disabled: false };
    expect(isEnumOptionsGroup(option)).toBe(false);
  });
  it('returns false for an option carrying a non-array options value, which a caller can put on enumOptions', () => {
    const option = { value: 'foo', label: 'Foo', index: 0, disabled: false, options: 'nope' };
    expect(isEnumOptionsGroup(option as unknown as IndexedEnumOptionType)).toBe(false);
  });
});
