/** Returns every non-empty combination of the given `values`, each keeping the order they were given in. There are
 * `2 ** n - 1` of them, so the count doubles with every value added.
 *
 * @param values - The values to combine
 * @returns - The list of every non-empty combination of the `values`
 */
export default function combinationsOf<V>(values: V[]): V[][] {
  return values.reduce<V[][]>(
    (combinations, value) => [...combinations, [value], ...combinations.map((combination) => [...combination, value])],
    [],
  );
}

/** Returns the combinations of the given `values` to cover, degrading past `max` to each value on its own and all of
 * them together. What a parse does for each combination is more than the doubling can carry indefinitely, so the
 * caller names a limit it can afford and is told through `onCapped` when one is reached, since what the combinations
 * in between would have covered is lost and only the caller knows what to say about it.
 *
 * @param values - The values to combine
 * @param max - The most values whose combinations can all be covered
 * @param onCapped - Called when there are more than `max` values, before the degraded list is returned
 * @returns - Every non-empty combination of the `values`, or each one alone and all of them together past `max`
 */
export function combinationsUpTo<V>(values: V[], max: number, onCapped: () => void): V[][] {
  if (values.length > max) {
    onCapped();
    return [...values.map((value) => [value]), values];
  }
  return combinationsOf(values);
}
