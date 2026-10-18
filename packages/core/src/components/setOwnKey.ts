/** Sets `value` under `key` as an own data property of the object `acc` being built. A JSON-sourced `__proto__` key is
 * a field name like any other, and a plain assignment would reach the setter and swap `acc`'s prototype for `value`.
 * Only that key is defined, since the walks writing through this one copy whole trees, the validator's `ErrorSchema`
 * and the form data, and a definition costs more than an assignment
 *
 * @param acc - The object being built
 * @param key - The key to set
 * @param value - The value to hold under `key`
 */
export default function setOwnKey(acc: Record<string, unknown>, key: string, value: unknown) {
  if (key === '__proto__') {
    Object.defineProperty(acc, key, { value, enumerable: true, writable: true, configurable: true });
  } else {
    acc[key] = value;
  }
}
