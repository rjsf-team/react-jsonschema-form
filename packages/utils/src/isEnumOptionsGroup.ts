import type { EnumOptionsGroupType, GroupedEnumOptionsType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** A type guard that determines whether an element of the tree returned by `groupEnumOptions()` is a group of
 * options rather than a standalone option. The check requires `options` to be an array rather than merely present,
 * since `enumOptions` is caller-supplied and `groupEnumOptions()` spreads each option through untouched, so an option
 * carrying an unrelated `options` value would otherwise be read as a group and crash the widget rendering it.
 *
 * @param item - An element from the list returned by `groupEnumOptions()`
 * @returns - True if `item` is an `EnumOptionsGroupType`, false otherwise
 */
export default function isEnumOptionsGroup<S extends StrictRJSFSchema = RJSFSchema>(
  item: GroupedEnumOptionsType<S>,
): item is EnumOptionsGroupType<S> {
  return Array.isArray((item as EnumOptionsGroupType<S>).options);
}
