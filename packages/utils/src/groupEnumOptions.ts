import type {
  EnumOptionsGroupType,
  EnumOptionsType,
  EnumValue,
  GroupedEnumOptionsType,
  IndexedEnumOptionType,
  RJSFSchema,
  StrictRJSFSchema,
} from './types.ts';

/** Groups `enumOptions` according to `optgroups`, tagging every option along the way with its original array
 * `index` (needed by `enumOptionValueEncoder` for the `'indexed'` `optionValueFormat`) and its `disabled` status
 * (from `enumDisabled`).
 *
 * When `optgroups` isn't provided, returns the same flat list of options, just tagged, so callers can use one
 * rendering code path whether or not grouping is in effect.
 *
 * When `optgroups` is provided, returns one `EnumOptionsGroupType` per non-empty key, in key order, with that
 * group's options in the order they were listed in its value array. Enum values not claimed by any group are
 * appended afterward, in their original relative order. Group values that don't match any (remaining) enum option
 * are skipped, and a group left with no options after that is omitted entirely, so no group renders as an empty
 * heading. If multiple options share the same `value` (e.g. `oneOf` branches with a duplicate discriminator), each
 * `optgroups` reference to that value claims the next not-yet-claimed option with it, by index, rather than
 * collapsing them into a single option.
 *
 * @param enumOptions - The available enum options
 * @param [optgroups] - The `ui:options.optgroups` mapping of group label to the enum values it contains
 * @param [enumDisabled] - The `ui:enumDisabled` list of enum values that should be rendered disabled
 * @returns The ordered list of standalone options and/or option groups to render
 */
export default function groupEnumOptions<S extends StrictRJSFSchema = RJSFSchema>(
  enumOptions: EnumOptionsType<S>[] | undefined,
  optgroups?: Record<string, EnumValue[]>,
  enumDisabled?: EnumValue[],
): GroupedEnumOptionsType<S>[] {
  if (!Array.isArray(enumOptions)) {
    return [];
  }
  const indexed: IndexedEnumOptionType<S>[] = enumOptions.map((option, index) => ({
    ...option,
    index,
    disabled: Array.isArray(enumDisabled) && enumDisabled.includes(option.value),
  }));
  if (!optgroups || typeof optgroups !== 'object') {
    return indexed;
  }

  const byValue = new Map<EnumValue, IndexedEnumOptionType<S>[]>();
  indexed.forEach((option) => {
    const candidates = byValue.get(option.value);
    if (candidates) {
      candidates.push(option);
    } else {
      byValue.set(option.value, [option]);
    }
  });

  const claimedIndices = new Set<number>();
  const groups: EnumOptionsGroupType<S>[] = Object.entries(optgroups)
    .map(([label, values]) => {
      const options = values.reduce<IndexedEnumOptionType<S>[]>((acc, value) => {
        const option = byValue.get(value)?.find((candidate) => !claimedIndices.has(candidate.index));
        if (option) {
          claimedIndices.add(option.index);
          acc.push(option);
        }
        return acc;
      }, []);
      return { label, options };
    })
    .filter((group) => group.options.length > 0);
  const ungrouped = indexed.filter((option) => !claimedIndices.has(option.index));

  return [...groups, ...ungrouped];
}
