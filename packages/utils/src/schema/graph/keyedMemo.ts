/** One level of a `KeyedMemo` trie. Object and function keys are held weakly, so an entry keyed on form data or on a
 * schema goes once nothing else holds the key; primitive keys cannot be held weakly and are held by value.
 */
interface MemoLevel<V> {
  readonly byObject: WeakMap<object, MemoLevel<V>>;
  readonly byValue: Map<unknown, MemoLevel<V>>;
  entry?: { readonly value: V };
  latest?: { readonly data: readonly unknown[]; readonly value: V };
}

function createLevel<V>(): MemoLevel<V> {
  return { byObject: new WeakMap(), byValue: new Map() };
}

function isWeakKey(key: unknown): key is object {
  return (typeof key === 'object' && key !== null) || typeof key === 'function';
}

function nextLevel<V>(level: MemoLevel<V>, key: unknown): MemoLevel<V> {
  const found = isWeakKey(key) ? level.byObject.get(key) : level.byValue.get(key);
  if (found !== undefined) {
    return found;
  }
  const created = createLevel<V>();
  if (isWeakKey(key)) {
    level.byObject.set(key, created);
  } else {
    level.byValue.set(key, created);
  }
  return created;
}

/** A memo keyed on a list of values compared by identity (`SameValueZero` for primitives). The graph memoizes condition
 * checks per (node, data) and plans per (seeds, data, policy) through it: the data is kept in a slot of its own holding
 * the last value only, since a field sees a new value on every keystroke and an entry per value would keep every
 * version of the text for as long as the keys live.
 */
export default class KeyedMemo<V> {
  private readonly root = createLevel<V>();

  private level(keys: readonly unknown[]): MemoLevel<V> {
    return keys.reduce<MemoLevel<V>>((level, key) => nextLevel(level, key), nextLevel(this.root, keys.length));
  }

  /** Returns the value stored under `keys`, computing and storing it on the first call
   *
   * @param keys - The keys, in order; a list of a different length is a different entry
   * @param compute - Computes the value when none is stored yet
   * @returns - The stored value
   */
  get(keys: readonly unknown[], compute: () => V): V {
    const level = this.level(keys);
    level.entry ??= { value: compute() };
    return level.entry.value;
  }

  /** Returns the value stored under `keys`, if one is
   *
   * @param keys - The keys, in order
   * @returns - The stored value, or undefined when none is stored
   */
  peek(keys: readonly unknown[]): V | undefined {
    return this.level(keys).entry?.value;
  }

  /** Stores `value` under `keys`
   *
   * @param keys - The keys, in order
   * @param value - The value to store
   */
  set(keys: readonly unknown[], value: V): void {
    this.level(keys).entry = { value };
  }

  /** Returns the value last stored under `keys` for `data`, if that is the data it was stored for
   *
   * @param keys - The keys, in order
   * @param data - The data, compared by identity
   * @returns - The stored value, or undefined when the last one stored was for other data
   */
  peekLatest(keys: readonly unknown[], data: readonly unknown[]): V | undefined {
    const { latest } = this.level(keys);
    return latest?.data.every((datum, index) => Object.is(datum, data[index])) ? latest.value : undefined;
  }

  /** Stores `value` under `keys` for `data`, in place of the value stored for other data, unless `data` holds an
   * object: a caller may mutate that in place between calls, which an entry keyed on its identity would answer for with
   * what it held before
   *
   * @param keys - The keys, in order
   * @param data - The data the value is for
   * @param value - The value to store
   */
  setLatest(keys: readonly unknown[], data: readonly unknown[], value: V): void {
    if (!data.some((datum) => typeof datum === 'object' && datum !== null)) {
      this.level(keys).latest = { data, value };
    }
  }
}
