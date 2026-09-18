import deepEquals from './deepEquals.ts';
import type {
  EnumOptionsGroupType,
  EnumOptionsType,
  EnumValue,
  GroupedEnumOptionsType,
  IndexedEnumOptionType,
  RJSFSchema,
  StrictRJSFSchema,
} from './types.ts';

const isPrimitive = (value: unknown) => value === null || typeof value !== 'object';

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
 * A group value matches an option whose `value` is deeply equal to it. Failing that, primitive values also match
 * by their string form (so `'1'` groups the enum value `1`), the same way `ui:enumOrder` does, since uiSchemas
 * authored as JSON often stringify them. `enumDisabled` values are matched to options the same way.
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
  const disabledPrimitives = new Set<string>();
  const disabledObjects: unknown[] = [];
  if (Array.isArray(enumDisabled)) {
    enumDisabled.forEach((value) => {
      if (isPrimitive(value)) {
        disabledPrimitives.add(String(value));
      } else {
        disabledObjects.push(value);
      }
    });
  }
  const isDisabled = (value: unknown) =>
    isPrimitive(value)
      ? disabledPrimitives.has(String(value))
      : disabledObjects.some((disabledValue) => deepEquals(disabledValue, value));

  const indexed: IndexedEnumOptionType<S>[] = enumOptions.map((option, index) => ({
    ...option,
    index,
    disabled: isDisabled(option.value),
  }));
  if (!optgroups || typeof optgroups !== 'object') {
    return indexed;
  }

  const primitivesByValue = new Map<unknown, IndexedEnumOptionType<S>[]>();
  const primitivesByString = new Map<string, IndexedEnumOptionType<S>[]>();
  const objectOptions: IndexedEnumOptionType<S>[] = [];
  const append = <K>(map: Map<K, IndexedEnumOptionType<S>[]>, key: K, option: IndexedEnumOptionType<S>) => {
    const existing = map.get(key);
    if (existing) {
      existing.push(option);
    } else {
      map.set(key, [option]);
    }
  };
  indexed.forEach((option) => {
    if (isPrimitive(option.value)) {
      append(primitivesByValue, option.value, option);
      append(primitivesByString, String(option.value), option);
    } else {
      objectOptions.push(option);
    }
  });

  const claimedIndices = new Set<number>();
  const findUnclaimed = (candidates: IndexedEnumOptionType<S>[] | undefined) =>
    candidates?.find((candidate) => !claimedIndices.has(candidate.index));
  const findOption = (value: unknown) =>
    isPrimitive(value)
      ? (findUnclaimed(primitivesByValue.get(value)) ?? findUnclaimed(primitivesByString.get(String(value))))
      : objectOptions.find((candidate) => !claimedIndices.has(candidate.index) && deepEquals(candidate.value, value));

  const groups: EnumOptionsGroupType<S>[] = Object.entries(optgroups)
    .map(([label, values]) => {
      const options = values.flatMap((value) => {
        const option = findOption(value);
        if (option) {
          claimedIndices.add(option.index);
        }
        return option ? [option] : [];
      });
      return { label, options };
    })
    .filter((group) => group.options.length > 0);
  const ungrouped = indexed.filter((option) => !claimedIndices.has(option.index));

  return [...groups, ...ungrouped];
}
