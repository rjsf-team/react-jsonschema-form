import enumOptionClaimer from './enumOptionClaimer.ts';
import enumOptionsIsDisabled from './enumOptionsIsDisabled.ts';
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
 * `index` (where a widget reads the option's DOM value in `enumOptionsDomValues()`) and its `disabled` status
 * (from `enumDisabled`).
 *
 * When `optgroups` isn't provided, returns the same flat list of options, just tagged, so callers can use one
 * rendering code path whether or not grouping is in effect.
 *
 * When `optgroups` is provided, returns one `EnumOptionsGroupType` per non-empty key, in the object's property order,
 * with that group's options in the order they were listed in its value array. Enum values not claimed by any group are
 * appended afterward, in their original relative order. Group values that don't match any (remaining) enum option
 * are skipped, and a group left with no options after that is omitted entirely, so no group renders as an empty
 * heading. A group whose value isn't an array at all (a hand-authored `{ 'Group A': 'foo' }`) is ignored the same
 * way, rather than throwing during render. If multiple options share the same `value` (e.g. `oneOf` branches with a
 * duplicate discriminator), each `optgroups` reference to that value claims the next not-yet-claimed option with it,
 * by index, rather than collapsing them into a single option. JavaScript orders integer-like keys (e.g. `'2024'`)
 * ahead of all other keys, in ascending numeric order, regardless of the order they were written in, so those groups
 * come first.
 *
 * A group value matches an option whose `value` is equal to it. Failing that, an object or array value matches one
 * deeply equal to it, and a primitive value one sharing its string form (so `'1'` groups the enum value `1`), the same
 * way `ui:enumOrder` does, since uiSchemas authored as JSON can't hold the schema's own objects and often stringify
 * primitives.
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
    disabled: enumOptionsIsDisabled(option.value, enumDisabled),
  }));
  if (!optgroups || typeof optgroups !== 'object') {
    return indexed;
  }

  const { claim, unclaimed } = enumOptionClaimer(indexed);
  const groups: EnumOptionsGroupType<S>[] = Object.entries(optgroups)
    .map(([label, values]) => ({
      label,
      options: (Array.isArray(values) ? values : []).flatMap((value) => claim(value) ?? []),
    }))
    .filter((group) => group.options.length > 0);

  return [...groups, ...unclaimed()];
}
