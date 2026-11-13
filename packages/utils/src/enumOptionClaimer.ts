import deepEquals from './deepEquals.ts';
import isContainerValue from './isContainerValue.ts';

/** Finds the options the entries of a `ui:enumOrder` or `ui:options.optgroups` list name, each option going to the first
 * entry that finds it. An entry claims the next unclaimed option equal to it, then, since a uiSchema authored as JSON
 * can't hold the schema's own object and often stringifies a primitive, the next one deeply equal to an object or array
 * entry, or sharing a primitive entry's string form
 *
 * @param options - The options to find
 * @returns - `claim()`, which returns the option an entry claims, if any, and `unclaimed()`, the options none has, in
 *        their original order
 */
export default function enumOptionClaimer<O extends { value: unknown }>(options: O[]) {
  const claimed = new Set<O>();
  const isUnclaimed = (option: O) => !claimed.has(option);
  const byValue = new Map<unknown, O[]>();
  const byString = new Map<string, O[]>();
  const append = <K>(map: Map<K, O[]>, key: K, option: O) => {
    const existing = map.get(key);
    if (existing) {
      existing.push(option);
    } else {
      map.set(key, [option]);
    }
  };
  options.forEach((option) => {
    append(byValue, option.value, option);
    // `String()` spells every object `[object Object]`, which would tell none apart
    if (!isContainerValue(option.value)) {
      append(byString, String(option.value), option);
    }
  });
  return {
    claim: (entry: unknown): O | undefined => {
      const option =
        byValue.get(entry)?.find(isUnclaimed) ??
        (isContainerValue(entry)
          ? options.find((candidate) => isUnclaimed(candidate) && deepEquals(candidate.value, entry))
          : byString.get(String(entry))?.find(isUnclaimed));
      if (option) {
        claimed.add(option);
      }
      return option;
    },
    unclaimed: () => options.filter(isUnclaimed),
  };
}
