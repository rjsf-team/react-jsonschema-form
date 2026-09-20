import { groupEnumOptions, isEnumOptionsGroup } from '../src/index.ts';
import type { EnumOptionsType, EnumValue } from '../src/index.ts';

const options: EnumOptionsType[] = [
  { value: 'foo', label: 'Foo' },
  { value: 'bar', label: 'Bar' },
  { value: 'baz', label: 'Baz' },
  { value: 'qux', label: 'Qux' },
];

describe('groupEnumOptions', () => {
  it('returns an empty array when enumOptions is not an array', () => {
    expect(groupEnumOptions(undefined)).toEqual([]);
  });

  describe('without optgroups', () => {
    it('returns the flat list of options tagged with their index and disabled status', () => {
      expect(groupEnumOptions(options)).toEqual([
        { value: 'foo', label: 'Foo', index: 0, disabled: false },
        { value: 'bar', label: 'Bar', index: 1, disabled: false },
        { value: 'baz', label: 'Baz', index: 2, disabled: false },
        { value: 'qux', label: 'Qux', index: 3, disabled: false },
      ]);
    });
    it('tags options listed in enumDisabled as disabled', () => {
      const result = groupEnumOptions(options, undefined, ['bar', 'qux']);
      expect(result.map((o) => (isEnumOptionsGroup(o) ? undefined : o.disabled))).toEqual([false, true, false, true]);
    });
  });

  describe('enumDisabled matching', () => {
    it('matches enumDisabled values strictly, so a mixed-type enum only disables the listed type', () => {
      const mixedOptions: EnumOptionsType[] = [
        { value: 1, label: 'number' },
        { value: '1', label: 'string' },
      ];
      const result = groupEnumOptions(mixedOptions, { Numbers: [1] }, [1]);
      const [group, ungrouped] = result;
      expect(isEnumOptionsGroup(group) && group.options.map((o) => [o.value, o.disabled])).toEqual([[1, true]]);
      expect(!isEnumOptionsGroup(ungrouped) && [ungrouped.value, ungrouped.disabled]).toEqual(['1', false]);
    });
    it('matches object enumDisabled values only by reference', () => {
      const two = { id: 2 };
      const objectOptions: EnumOptionsType[] = [
        { value: { id: 1 }, label: 'One' },
        { value: two, label: 'Two' },
      ];
      const result = groupEnumOptions(objectOptions, undefined, [{ id: 1 }, two] as any);
      expect(result.map((o) => (isEnumOptionsGroup(o) ? undefined : o.disabled))).toEqual([false, true]);
    });
  });

  describe('with optgroups', () => {
    it('groups options by the provided optgroups, in key order', () => {
      const result = groupEnumOptions(options, { 'Group A': ['foo', 'bar'], 'Group B': ['baz'] });
      expect(result).toHaveLength(3);
      expect(isEnumOptionsGroup(result[0])).toBe(true);
      expect(isEnumOptionsGroup(result[1])).toBe(true);
      if (isEnumOptionsGroup(result[0]) && isEnumOptionsGroup(result[1])) {
        expect(result[0].label).toBe('Group A');
        expect(result[0].options.map((o) => o.value)).toEqual(['foo', 'bar']);
        expect(result[1].label).toBe('Group B');
        expect(result[1].options.map((o) => o.value)).toEqual(['baz']);
      }
    });
    it('orders integer-like group labels ahead of other labels, following JavaScript property order', () => {
      const result = groupEnumOptions(options, { Newest: ['foo', 'bar'], '2024': ['baz'], '2023': ['qux'] });
      expect(result.map((item) => (isEnumOptionsGroup(item) ? item.label : undefined))).toEqual([
        '2023',
        '2024',
        'Newest',
      ]);
    });
    it('appends options not claimed by any group after the groups, preserving relative order', () => {
      const result = groupEnumOptions(options, { 'Group A': ['baz'] });
      expect(result).toHaveLength(4);
      expect(isEnumOptionsGroup(result[0])).toBe(true);
      const ungrouped = result.slice(1);
      expect(ungrouped.every((o) => !isEnumOptionsGroup(o))).toBe(true);
      expect(ungrouped.map((o) => !isEnumOptionsGroup(o) && o.value)).toEqual(['foo', 'bar', 'qux']);
    });
    it('preserves each grouped option’s original index and disabled status', () => {
      const result = groupEnumOptions(options, { 'Group A': ['qux', 'foo'] }, ['qux']);
      const group = result[0];
      if (isEnumOptionsGroup(group)) {
        expect(group.options).toEqual([
          { value: 'qux', label: 'Qux', index: 3, disabled: true },
          { value: 'foo', label: 'Foo', index: 0, disabled: false },
        ]);
      } else {
        throw new Error('expected a group');
      }
    });
    it('skips group values that do not match any enum option', () => {
      const result = groupEnumOptions(options, { 'Group A': ['foo', 'does-not-exist'] });
      const group = result[0];
      if (isEnumOptionsGroup(group)) {
        expect(group.options.map((o) => o.value)).toEqual(['foo']);
      } else {
        throw new Error('expected a group');
      }
    });
    it('omits a group entirely when none of its values match, instead of rendering it empty', () => {
      const result = groupEnumOptions(options, { Empty: ['does-not-exist'] });
      expect(result).toEqual([
        { value: 'foo', label: 'Foo', index: 0, disabled: false },
        { value: 'bar', label: 'Bar', index: 1, disabled: false },
        { value: 'baz', label: 'Baz', index: 2, disabled: false },
        { value: 'qux', label: 'Qux', index: 3, disabled: false },
      ]);
    });
    it('omits an empty group even when other groups have options', () => {
      const result = groupEnumOptions(options, { Empty: [], 'Group A': ['foo'] });
      expect(result).toHaveLength(4);
      expect(isEnumOptionsGroup(result[0]) && result[0].label).toBe('Group A');
    });
    it('ignores a group whose value is not an array instead of throwing', () => {
      const malformed = { 'Group A': 'foo', 'Group B': null, 'Group C': 3 } as unknown as Record<string, EnumValue[]>;
      const result = groupEnumOptions(options, malformed);
      expect(result).toEqual([
        { value: 'foo', label: 'Foo', index: 0, disabled: false },
        { value: 'bar', label: 'Bar', index: 1, disabled: false },
        { value: 'baz', label: 'Baz', index: 2, disabled: false },
        { value: 'qux', label: 'Qux', index: 3, disabled: false },
      ]);
    });
    it('returns an empty array when enumOptions is not an array, even with optgroups provided', () => {
      expect(groupEnumOptions(undefined, { 'Group A': ['foo'] })).toEqual([]);
    });
    it('matches each optgroups reference to a distinct option when values are duplicated, instead of dropping one', () => {
      const duplicateValueOptions: EnumOptionsType[] = [
        { value: 'a', label: 'A1' },
        { value: 'a', label: 'A2' },
        { value: 'b', label: 'B' },
      ];
      const result = groupEnumOptions(duplicateValueOptions, { Group: ['a'] });
      expect(result).toHaveLength(3);
      const group = result[0];
      const ungrouped = result.slice(1);
      if (isEnumOptionsGroup(group) && ungrouped.every((o) => !isEnumOptionsGroup(o))) {
        expect(group.options).toEqual([{ value: 'a', label: 'A1', index: 0, disabled: false }]);
        // The second value:'a' option (A2) is neither dropped nor duplicated into the group; it's ungrouped, alongside B
        expect(ungrouped).toEqual([
          { value: 'a', label: 'A2', index: 1, disabled: false },
          { value: 'b', label: 'B', index: 2, disabled: false },
        ]);
      } else {
        throw new Error('expected a group followed by standalone options');
      }
    });
    it('matches primitive group values against enum values by their string form', () => {
      const numericOptions: EnumOptionsType[] = [
        { value: 1, label: '1' },
        { value: 2, label: '2' },
        { value: 3, label: '3' },
      ];
      const result = groupEnumOptions(numericOptions, { Low: ['1', '2'] });
      expect(result).toHaveLength(2);
      const group = result[0];
      if (isEnumOptionsGroup(group)) {
        expect(group.options.map((o) => o.value)).toEqual([1, 2]);
      } else {
        throw new Error('expected a group');
      }
    });
    it('prefers an exact match over a string-form match', () => {
      const mixedOptions: EnumOptionsType[] = [
        { value: 1, label: 'number' },
        { value: '1', label: 'string' },
      ];
      const result = groupEnumOptions(mixedOptions, { Group: ['1'] });
      const group = result[0];
      if (isEnumOptionsGroup(group)) {
        expect(group.options.map((o) => o.label)).toEqual(['string']);
      } else {
        throw new Error('expected a group');
      }
    });
    it('matches object enum values only by reference', () => {
      const two = { id: 2 };
      const objectOptions: EnumOptionsType[] = [
        { value: { id: 1 }, label: 'One' },
        { value: two, label: 'Two' },
      ];
      const result = groupEnumOptions(objectOptions, { Group: [{ id: 1 }, two] as any });
      const group = result[0];
      if (isEnumOptionsGroup(group)) {
        expect(group.options.map((o) => o.label)).toEqual(['Two']);
      } else {
        throw new Error('expected a group');
      }
      expect(result).toHaveLength(2);
    });
    it('does not string-match an object enum value against a primitive group value', () => {
      const objectOptions: EnumOptionsType[] = [{ value: { id: 1 }, label: 'One' }];
      const result = groupEnumOptions(objectOptions, { Group: ['[object Object]'] });
      expect(result).toEqual([{ value: { id: 1 }, label: 'One', index: 0, disabled: false }]);
    });
    it('claims one distinct option per duplicate-value reference when a group lists the same value twice', () => {
      const duplicateValueOptions: EnumOptionsType[] = [
        { value: 'a', label: 'A1' },
        { value: 'a', label: 'A2' },
      ];
      const result = groupEnumOptions(duplicateValueOptions, { Group: ['a', 'a'] });
      expect(result).toHaveLength(1);
      const group = result[0];
      if (isEnumOptionsGroup(group)) {
        expect(group.options.map((o) => o.label)).toEqual(['A1', 'A2']);
      } else {
        throw new Error('expected a group');
      }
    });
  });
});
