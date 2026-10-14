/** One level of a `KeyedMemo` trie. Object and function keys are held weakly, so an entry keyed on form data or on a
 * schema goes once nothing else holds the key; primitive keys cannot be held weakly and are held by value.
 */
interface MemoLevel<V> {
  readonly byObject: WeakMap<object, MemoLevel<V>>;
  readonly byValue: Map<unknown, MemoLevel<V>>;
  entry?: { readonly value: V };
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
 * checks per (node, data) and plans per (seeds, data, policy) through it, where the data is whatever the form holds at
 * a path: the same object is the same data, since form data is replaced rather than mutated.
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
}
