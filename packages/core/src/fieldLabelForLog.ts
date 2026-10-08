import { ROOT_FIELD_PATH, fieldPathToList, toFieldPath } from '@rjsf/utils';
import type { FieldPath, GlobalFormOptions } from '@rjsf/utils';

/** Names a field for a warning logged through `logOnce()`, which dedupes on the message text, so a message naming one
 * field must never read the same as the message naming another. The id alone isn't enough: ids join their segments
 * with `idSeparator`, so a property named `a_b` and a nested `a`/`b` both read as `root_a_b`, and one field's warning
 * would stand in for the other's. The `FieldPath` grammar escapes its separators and so can't collide, but it carries
 * no `idPrefix`, so it can't tell two forms apart on its own either — hence both, id first, since that is what the
 * developer sees in the DOM. The root field's path is empty and its id already reads as `root`, so it gets no suffix.
 *
 * Internal to `@rjsf/core`: `package.json` excludes `./lib/fieldLabelForLog.js` from the `./lib/*.js` exports wildcard
 * so it can't be deep-imported, since a reachable subpath would have to keep working until the next major.
 *
 * @param id - The id of the field in the hierarchy
 * @param fieldPath - The `FieldPath` identifying the field in the form
 * @returns - The field named as `"root_shipping_street" (shipping.street)`, or just `"root"` at the root
 */
export default function fieldLabelForLog(id: string, fieldPath: FieldPath): string {
  return formatLabel(id, fieldPath);
}

/** Takes the path as a plain string because `entryLabelForLog()` writes array indexes as `[]`, outside the `FieldPath`
 * grammar
 */
function formatLabel(id: string, path: string): string {
  return `"${id}"${path ? ` (${path})` : ''}`;
}

/** Names a field the way `fieldLabelForLog()` does, but with each array index written as `[]`, for a warning about
 * the uiSchema entry the field is rendered from rather than about the field itself. Every item an array's `items`
 * entry renders reads alike, so a mistake in that entry is warned about once rather than once per item, which over a
 * long array would also crowd every other warning out of what `logOnce()` remembers.
 *
 * @param fieldPath - The `FieldPath` identifying the field in the form
 * @param globalFormOptions - The `GlobalFormOptions` holding the `idPrefix` and `idSeparator` the id is built from
 * @returns - The field named as `"root_tasks_[]_title" (tasks[].title)`, or just `"root"` at the root
 */
export function entryLabelForLog(fieldPath: FieldPath, globalFormOptions: GlobalFormOptions): string {
  const segments = fieldPathToList(fieldPath);
  const { idPrefix, idSeparator } = globalFormOptions;
  const id = [idPrefix, ...segments.map((segment) => (typeof segment === 'number' ? '[]' : segment))].join(idSeparator);
  const path = segments.reduce<string>(
    (entryPath, segment) =>
      typeof segment === 'number' ? `${entryPath}[]` : toFieldPath(segment, entryPath as FieldPath),
    ROOT_FIELD_PATH,
  );
  return formatLabel(id, path);
}
