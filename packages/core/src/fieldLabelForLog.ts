import type { FieldPath } from '@rjsf/utils';

/** Names a field for a warning logged through `logOnce()`, which dedupes on the message text, so a message naming one
 * field must never read the same as the message naming another. The id alone isn't enough: ids join their segments
 * with `idSeparator`, so a property named `a_b` and a nested `a`/`b` both read as `root_a_b`, and one field's warning
 * would stand in for the other's. The `FieldPath` grammar escapes its separators and so can't collide, but it carries
 * no `idPrefix`, so it can't tell two forms apart on its own either — hence both, id first, since that is what the
 * developer sees in the DOM. The root field's path is empty and its id already reads as `root`, so it gets no suffix.
 *
 * @param id - The id of the field in the hierarchy
 * @param fieldPath - The `FieldPath` identifying the field in the form
 * @returns - The field named as `"root_shipping_street" (shipping.street)`, or just `"root"` at the root
 */
export default function fieldLabelForLog(id: string, fieldPath: FieldPath): string {
  return `"${id}"${fieldPath ? ` (${fieldPath})` : ''}`;
}
