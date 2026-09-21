import type {
  EnumOptionsGroupType,
  GroupedEnumOptionsType,
  IndexedEnumOptionType,
  RJSFSchema,
  StrictRJSFSchema,
} from './types.ts';

/** A type guard that determines whether an element of the tree returned by `groupEnumOptions()` is a group of
 * options rather than a standalone option. Both halves of the check matter because `enumOptions` is caller-supplied
 * and `groupEnumOptions()` spreads each option through untouched: an option carrying a non-array `options` value
 * would crash the widget rendering it, and one carrying an array-valued `options` (react-select's group shape, say)
 * would silently render as an empty group in place of the option itself. `groupEnumOptions()` tags every standalone
 * option with a numeric `index` and never puts one on a group, so that tag tells the two apart no matter what the
 * caller supplied.
 *
 * @param item - An element from the list returned by `groupEnumOptions()`
 * @returns - True if `item` is an `EnumOptionsGroupType`, false otherwise
 */
export default function isEnumOptionsGroup<S extends StrictRJSFSchema = RJSFSchema>(
  item: GroupedEnumOptionsType<S>,
): item is EnumOptionsGroupType<S> {
  return (
    Array.isArray((item as EnumOptionsGroupType<S>).options) &&
    typeof (item as IndexedEnumOptionType<S>).index !== 'number'
  );
}
