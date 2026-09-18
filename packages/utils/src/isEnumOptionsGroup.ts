import type { EnumOptionsGroupType, GroupedEnumOptionsType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** A type guard that determines whether an element of the tree returned by `groupEnumOptions()` is a group of
 * options rather than a standalone option.
 *
 * @param item - An element from the list returned by `groupEnumOptions()`
 * @returns - True if `item` is an `EnumOptionsGroupType`, false otherwise
 */
export default function isEnumOptionsGroup<S extends StrictRJSFSchema = RJSFSchema>(
  item: GroupedEnumOptionsType<S>,
): item is EnumOptionsGroupType<S> {
  return 'options' in item;
}
