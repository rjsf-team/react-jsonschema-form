/** Where a change put what an array or object held under `key`: the new key, or `undefined` when it is gone */
export type KeyMove = (key: string) => string | undefined;

/** The `KeyMove` of an array whose items went where `newIndexOf` says, `undefined` for one that was removed. A key that
 * names no item stays where it is
 */
export function moveOfItems(newIndexOf: (index: number) => number | undefined): KeyMove {
  return (key) => (/^(0|[1-9]\d*)$/.test(key) ? newIndexOf(Number(key))?.toString() : key);
}
