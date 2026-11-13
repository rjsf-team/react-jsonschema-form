/** Drops the empty ids and the repeats from `ids`, keeping the first of each, as an `aria-describedby` lists them
 *
 * @param ids - The ids, in order
 * @returns - Each non-empty id once, in the order it first appears
 */
export default function uniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids)].filter(Boolean);
}
