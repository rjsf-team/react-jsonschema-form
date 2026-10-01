import type { FieldChange, FieldUpdater } from './types.ts';

/** Whether `change` is an updater. Form data is JSON, so a function value is always an updater, never a value
 *
 * @param change - The value, or an updater computing it
 * @returns - True when `change` is an updater
 */
function isUpdater<V, A extends unknown[]>(
  change: V | ((current: V, ...args: A) => V),
): change is (current: V, ...args: A) => V {
  return typeof change === 'function';
}

/** Returns the value a `FieldChange` stands for: the value itself, or what its updater computes from `current` and
 * any further arguments the updater takes
 *
 * @param change - The value, or an updater computing it
 * @param current - What the updater is applied to
 * @param args - Further arguments passed to the updater
 * @returns - The value `change` stands for
 */
export function resolveFieldChange<V, A extends unknown[] = []>(
  change: V | ((current: V, ...args: A) => V),
  current: V,
  ...args: A
): V {
  return isUpdater(change) ? change(current, ...args) : change;
}

/** Whether a `FieldChange` is an updater rather than a value. A field that handles what a child passes to `onChange`
 * branches on it: a value can be read or transformed as it is, an updater only through what it returns, see
 * `mapFieldChange()`
 *
 * @param change - The value, or an updater computing it
 * @returns - True when `change` is an updater
 */
export function isFieldUpdater<V>(change: FieldChange<V>): change is FieldUpdater<V> {
  return isUpdater(change);
}

/** Applies `transform` to what a `FieldChange` stands for: to the value itself, or to what its updater returns. A
 * field that transforms the value a child passes to `onChange` forwards `mapFieldChange(value, transform)`
 *
 * @param change - The value, or an updater computing it
 * @param transform - The transform to apply to the value
 * @returns - The transformed value, or an updater returning the transformed result of `change`'s updater
 */
export function mapFieldChange<V>(change: FieldChange<V>, transform: (value: V) => V): FieldChange<V> {
  return isUpdater(change) ? (current: V) => transform(change(current)) : transform(change);
}
