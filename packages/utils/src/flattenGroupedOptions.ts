import isEnumOptionsGroup from './isEnumOptionsGroup.ts';
import type { GroupedEnumOptionsType, IndexedEnumOptionType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Flattens the tree returned by `groupEnumOptions()` back into a single list of options, in the same order they
 * appear in the tree (a group's options in place of the group, followed by any standalone options) — the order a
 * widget's UI library needs when it manages its own selection/keyboard-navigation state over a flat list of items
 * that must stay in sync with what's actually rendered.
 *
 * @param groupedOptions - The list returned by `groupEnumOptions()`
 * @returns The options in `groupedOptions`, flattened to a single list
 */
export default function flattenGroupedOptions<S extends StrictRJSFSchema = RJSFSchema>(
  groupedOptions: GroupedEnumOptionsType<S>[],
): IndexedEnumOptionType<S>[] {
  return groupedOptions.flatMap((item) => (isEnumOptionsGroup<S>(item) ? item.options : [item]));
}
