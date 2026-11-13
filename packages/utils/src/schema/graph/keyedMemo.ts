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

interface LevelMap<K, V> {
  get(key: K): MemoLevel<V> | undefined;
  set(key: K, level: MemoLevel<V>): void;
}

function levelIn<K, V>(map: LevelMap<K, V>, key: K): MemoLevel<V> {
  let level = map.get(key);
  if (level === undefined) {
    level = createLevel<V>();
    map.set(key, level);
  }
  return level;
}

function nextLevel<V>(level: MemoLevel<V>, key: unknown): MemoLevel<V> {
  return isWeakKey(key) ? levelIn(level.byObject, key) : levelIn(level.byValue, key);
}

function foundLevel<V>(level: MemoLevel<V>, key: unknown): MemoLevel<V> | undefined {
  return isWeakKey(key) ? level.byObject.get(key) : level.byValue.get(key);
}

function latestFor<V>(level: MemoLevel<V> | undefined, data: readonly unknown[]): V | undefined {
  const latest = level?.latest;
  return latest?.data.every((datum, index) => Object.is(datum, data[index])) ? latest.value : undefined;
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

  /** The level `keys` lead to, without creating the levels a lookup that misses would otherwise leave behind */
  private find(keys: readonly unknown[]): MemoLevel<V> | undefined {
    let level = foundLevel(this.root, keys.length);
    for (let index = 0; level !== undefined && index < keys.length; index += 1) {
      level = foundLevel(level, keys[index]);
    }
    return level;
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
    return this.find(keys)?.entry?.value;
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
    return latestFor(this.find(keys), data);
  }

  /** Returns the value stored under `keys` for any data, or else the one last stored under them for `data`, with one
   * walk of the keys
   *
   * @param keys - The keys, in order
   * @param data - The data, compared by identity
   * @returns - The stored value, or undefined when neither is stored
   */
  peekAny(keys: readonly unknown[], data: readonly unknown[]): V | undefined {
    const level = this.find(keys);
    return level?.entry === undefined ? latestFor(level, data) : level.entry.value;
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
