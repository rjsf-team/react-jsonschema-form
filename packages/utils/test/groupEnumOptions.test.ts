import { groupEnumOptions, isEnumOptionsGroup } from '../src/index.ts';
import type { EnumOptionsType } from '../src/index.ts';

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
    it('matches primitive enumDisabled values by their string form', () => {
      const numericOptions: EnumOptionsType[] = [
        { value: 1, label: '1' },
        { value: 2, label: '2' },
      ];
      const result = groupEnumOptions(numericOptions, undefined, ['1']);
      expect(result.map((o) => (isEnumOptionsGroup(o) ? undefined : o.disabled))).toEqual([true, false]);
    });
    it('matches object enumDisabled values by deep equality, without matching primitives', () => {
      const mixedOptions: EnumOptionsType[] = [
        { value: { id: 1 }, label: 'One' },
        { value: { id: 2 }, label: 'Two' },
        { value: 'x', label: 'X' },
      ];
      const result = groupEnumOptions(mixedOptions, undefined, [{ id: 2 }, '[object Object]'] as any);
      expect(result.map((o) => (isEnumOptionsGroup(o) ? undefined : o.disabled))).toEqual([false, true, false]);
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
    it('matches object and array enum values by deep equality', () => {
      const objectOptions: EnumOptionsType[] = [
        { value: { id: 1 }, label: 'One' },
        { value: { id: 2 }, label: 'Two' },
        { value: [3], label: 'Three' },
      ];
      const result = groupEnumOptions(objectOptions, { Group: [{ id: 2 }, [3]] as any });
      const group = result[0];
      if (isEnumOptionsGroup(group)) {
        expect(group.options.map((o) => o.label)).toEqual(['Two', 'Three']);
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
