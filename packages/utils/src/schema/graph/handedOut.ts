/** The schemas `retrieveSchema()` handed out. A schema found here is one of them as it was handed out, or a copy
 * `replaceEqualDeep()` made of one, which is deep-equal to it, so it is resolved from its provenance alone; one that
 * only carries a provenance is a copy a caller made of one, possibly with keywords of its own, so it is resolved from
 * its keywords.
 */
const handedOut = new WeakSet<object>();

/** Records `schema` as one `retrieveSchema()` handed out
 *
 * @param schema - The schema handed out
 */
export function markHandedOut(schema: object): void {
  handedOut.add(schema);
}

/** Returns whether `schema` is one `retrieveSchema()` handed out, or a copy `replaceEqualDeep()` made of one
 *
 * @param schema - The schema to check
 * @returns - Whether it was handed out
 */
export function isHandedOut(schema: object): boolean {
  return handedOut.has(schema);
}
