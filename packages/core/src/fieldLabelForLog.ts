import { ROOT_FIELD_PATH, fieldPathToList, idSegment, toFieldPath } from '@rjsf/utils';
import type { FieldPath, GlobalFormOptions } from '@rjsf/utils';

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
  return formatLabel(id, fieldPath);
}

/** Takes the path as a plain string because `entryLabelForLog()` writes array indexes as `[]` and extra keys as `{}`,
 * outside the `FieldPath` grammar
 */
function formatLabel(id: string, path: string): string {
  return `"${id}"${path ? ` (${path})` : ''}`;
}

/** Where the uiSchema entries below an `anyOf`/`oneOf` option's own entry are named from: that entry, rather than the
 * field path alone, which reads the same under every option and would let one option's mistake stand in for another's
 * under `logOnce()`
 */
export interface EntryAnchor {
  /** How many path segments the option's field has; an entry below it is named by the segments past these */
  depth: number;
  /** The option's entry, such as `uiSchema.anyOf[1]` */
  prefix: string;
  /** Builds the label of the entry the option's entry sits in */
  owner: () => string;
}

/** Names a field the way `fieldLabelForLog()` does, but with each array index written as `[]`, for a warning about
 * the uiSchema entry the field is rendered from rather than about the field itself. Every item an array's `items`
 * entry renders reads alike, so a mistake in that entry is warned about once rather than once per item, which over a
 * long array would also crowd every other warning out of what `logOnce()` remembers. An additional property's key
 * is collapsed the same way, written as `{}` so the label points at an `additionalProperties` entry rather than an
 * `items` one, since every extra key that entry renders - and every field beneath one - shares the one entry too.
 * Beneath an option's own entry, the path within the option is written after that entry instead, as
 * `the uiSchema.anyOf[1].tasks[].title entry of "root"`.
 *
 * @param fieldPath - The `FieldPath` identifying the field in the form
 * @param globalFormOptions - The `GlobalFormOptions` holding the `idPrefix` and `idSeparator` the id is built from
 * @param [collapsedKeys] - The indexes of the path segments that are an additional property's key, written as `{}`
 * @param [anchor] - The option entry the field's entry sits beneath, if any
 * @returns - The field named as `"root_tasks_[]_title" (tasks[].title)`, or just `"root"` at the root
 */
export function entryLabelForLog(
  fieldPath: FieldPath,
  globalFormOptions: GlobalFormOptions,
  collapsedKeys?: readonly number[],
  anchor?: EntryAnchor,
): string {
  const segments = fieldPathToList(fieldPath);
  const marker = (index: number, segment: string | number) => {
    if (typeof segment === 'number') {
      return '[]';
    }
    return collapsedKeys?.includes(index) ? '{}' : undefined;
  };
  const start = anchor?.depth ?? 0;
  const path = segments.slice(start).reduce<string>((entryPath, segment, offset) => {
    const collapsed = marker(start + offset, segment);
    return collapsed ? `${entryPath}${collapsed}` : toFieldPath(segment, entryPath as FieldPath);
  }, anchor?.prefix ?? ROOT_FIELD_PATH);
  if (anchor) {
    return `the ${path} entry of ${anchor.owner()}`;
  }
  const { idPrefix, idSeparator } = globalFormOptions;
  const id = [idPrefix, ...segments.map((segment, index) => marker(index, segment) ?? idSegment(String(segment)))].join(
    idSeparator,
  );
  return formatLabel(id, path);
}
