import KeyedMemo from './keyedMemo.ts';

/** A memo of results computed from form data, under a list of keys and the data. Data holding an object is not
 * memoized under: a caller may mutate it in place between calls, which an entry keyed on its identity would answer for
 * with what it held before. A missing value, `null`, a boolean or one of the memo's own `constants` is a key of its own.
 * A string or number is memoized under too, but only the last one under the same keys: a field sees one per keystroke,
 * and an entry per value would keep every version of the text for as long as the keys live.
 */
export default class DataMemo<V> {
  private readonly constants: ReadonlySet<unknown>;
  private readonly bounded = new KeyedMemo<V>();
  private readonly latest = new KeyedMemo<{ readonly data: readonly unknown[]; readonly value: V }>();

  /** @param constants - Objects that stand for a value, such as a frozen stand-in for no data */
  constructor(constants: readonly unknown[] = []) {
    this.constants = new Set(constants);
  }

  private isBounded(data: unknown): boolean {
    return data === undefined || data === null || typeof data === 'boolean' || this.constants.has(data);
  }

  /** Returns the value stored under `keys` and `data`, if one is
   *
   * @param keys - The keys, in order
   * @param data - The data, in order
   * @returns - The stored value, or undefined when none is stored
   */
  peek(keys: readonly unknown[], data: readonly unknown[]): V | undefined {
    if (data.every((datum) => this.isBounded(datum))) {
      return this.bounded.peek([...keys, ...data]);
    }
    const last = this.latest.peek(keys);
    return last?.data.every((datum, index) => Object.is(datum, data[index])) ? last.value : undefined;
  }

  /** Stores `value` under `keys` and `data`, unless `data` holds an object
   *
   * @param keys - The keys, in order
   * @param data - The data, in order
   * @param value - The value to store
   */
  set(keys: readonly unknown[], data: readonly unknown[], value: V): void {
    if (data.every((datum) => this.isBounded(datum))) {
      this.bounded.set([...keys, ...data], value);
    } else if (!data.some((datum) => typeof datum === 'object' && datum !== null)) {
      this.latest.set(keys, { data, value });
    }
  }
}
