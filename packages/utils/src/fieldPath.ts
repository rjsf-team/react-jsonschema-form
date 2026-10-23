import type { FieldPath, FieldPathList, GlobalFormOptions } from './types.ts';

/** The `FieldPath` of the root of a form */
export const ROOT_FIELD_PATH = '' as FieldPath;

/** The characters that are structural in the `FieldPath` grammar and must be escaped inside a property name */
const RESERVED = /[\\.[\]]/g;

/** Appends `segment` to `parentPath`, returning the `FieldPath` of the child field.
 *
 * Property names are separated by `.` and array indexes are bracketed, so `friends[0].firstName` is the
 * `firstName` of the first element of `friends`. A property name containing a reserved character is escaped
 * with a backslash, which is what makes the grammar unambiguous — unlike the `idSeparator` join, which
 * collides whenever a property name contains the separator.
 *
 * `''` is a property name like any other, so `toFieldPath('', 'a')` addresses `a['']`. The root path is itself empty,
 * so an empty name directly under the root is written as a lone `.`, which keeps it distinct from the root.
 *
 * @param segment - The property name or array index of the field
 * @param [parentPath] - The optional `FieldPath` of the parent field
 * @returns - The `FieldPath` of the field
 */
export function toFieldPath(segment: string | number, parentPath: FieldPath = ROOT_FIELD_PATH): FieldPath {
  if (typeof segment === 'number') {
    return `${parentPath}[${segment}]` as FieldPath;
  }
  const escaped = segment.replace(RESERVED, '\\$&');
  if (parentPath === ROOT_FIELD_PATH) {
    return (escaped === '' ? '.' : escaped) as FieldPath;
  }
  return `${parentPath}.${escaped}` as FieldPath;
}

/** Determines whether the last segment of `fieldPath` is an array index
 *
 * @param fieldPath - The `FieldPath` to check
 * @returns - True when the path addresses an array element, otherwise false
 */
export function fieldPathEndsWithIndex(fieldPath: FieldPath): boolean {
  return typeof fieldPathToList(fieldPath).at(-1) === 'number';
}

/** Parses `fieldPath` back into its list of segments, with array indexes as numbers and property names unescaped
 *
 * @param fieldPath - The `FieldPath` to parse
 * @returns - The `FieldPathList` for `fieldPath`
 */
export function fieldPathToList(fieldPath: FieldPath): FieldPathList {
  const segments: FieldPathList = [];
  let name = '';
  let hasName = false;
  let i = 0;
  while (i < fieldPath.length) {
    const char = fieldPath[i];
    if (char === '\\') {
      name += fieldPath[i + 1] ?? '';
      hasName = true;
      i += 2;
    } else if (char === '.') {
      if (hasName) {
        segments.push(name);
      }
      name = '';
      // A `.` separates two names rather than terminating one, so whatever follows it is a segment even when empty
      hasName = true;
      i += 1;
    } else if (char === '[') {
      if (hasName) {
        segments.push(name);
        name = '';
        hasName = false;
      }
      const end = fieldPath.indexOf(']', i);
      if (end === -1) {
        // Malformed input from outside `toFieldPath`: treat the rest as a property name, which is also how
        // `fieldPathToId` reads it, rather than looping on a -1 index
        name = fieldPath.slice(i + 1);
        hasName = name !== '';
        break;
      }
      segments.push(Number(fieldPath.slice(i + 1, end)));
      i = end + 1;
    } else {
      name += char;
      hasName = true;
      i += 1;
    }
  }
  if (hasName) {
    segments.push(name);
  }
  return segments;
}

/** Folds a `FieldPathList` into the `FieldPath` that addresses the same field, the inverse of `fieldPathToList()`
 *
 * @param fieldPathList - The list of property names and array indexes to fold
 * @returns - The `FieldPath` for `fieldPathList`
 */
export function fieldPathFromList(fieldPathList: FieldPathList): FieldPath {
  return fieldPathList.reduce<FieldPath>((acc, segment) => toFieldPath(segment, acc), ROOT_FIELD_PATH);
}

/** The characters a property name can't carry into an id as they are: the ASCII whitespace that splits an id list such
 * as `aria-describedby`, and the `%` that starts an escape
 */
const ID_ESCAPED = new Set(['%', ' ', '\t', '\n', '\f', '\r']);

/** Writes a property name as it appears in an id, so the id has no whitespace, two names never write the same text,
 * and no name writes the `__` that joins a field's id to the name of one of its parts (see `partId()`). A character is
 * written as `%` and its two-digit hex code when it is in `ID_ESCAPED`, or when it is a `_` that begins or ends the name
 * or stands next to another `_`, since the `_` separator beside it would then write a `__`. An empty name is `%00`,
 * since the separators around it would also meet in a `__`. A `%` is always followed by two hex digits, which no other
 * escape writes, so the escape is reversible and two names never meet in one id segment
 *
 * @param name - The property name
 * @returns - The name as it appears in an id
 */
function idSegment(name: string) {
  if (name === '') {
    return '%00';
  }
  let segment = '';
  for (let i = 0; i < name.length; i += 1) {
    const char = name[i];
    const escaped =
      ID_ESCAPED.has(char) ||
      (char === '_' && (i === 0 || i === name.length - 1 || name[i - 1] === '_' || name[i + 1] === '_'));
    segment += escaped ? `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}` : char;
  }
  return segment;
}

/** Derives the HTML `id` for `fieldPath` from the `idPrefix` and `idSeparator` in `globalFormOptions`, writing each
 * property name as `idSegment()` does. The `idPrefix` and `idSeparator` are written as given, so neither should hold
 * whitespace or a `__`; a property name holding the `idSeparator` still writes the id another path would, as `a_b` and
 * `a.b` both write `root_a_b`, which choosing a separator no property name holds avoids
 *
 * @param fieldPath - The `FieldPath` of the field
 * @param globalFormOptions - The `GlobalFormOptions` used to get the `idPrefix` and `idSeparator`
 * @returns - The id for the field
 */
export function fieldPathToId(fieldPath: FieldPath, globalFormOptions: GlobalFormOptions): string {
  const { idPrefix, idSeparator } = globalFormOptions;
  const segments = fieldPathToList(fieldPath).map((segment) =>
    typeof segment === 'number' ? String(segment) : idSegment(segment),
  );
  return [idPrefix, ...segments].join(idSeparator);
}

/** Derives the HTML `name` for `fieldPath` using the `nameGenerator` in `globalFormOptions`, when one is provided
 *
 * @param fieldPath - The `FieldPath` of the field
 * @param globalFormOptions - The `GlobalFormOptions` used to get the `nameGenerator` and `idPrefix`
 * @param [isMultiValue] - Optional flag indicating this field accepts multiple values
 * @returns - The name for the field, or undefined when no `nameGenerator` is configured
 */
export function fieldPathToName(
  fieldPath: FieldPath,
  globalFormOptions: GlobalFormOptions,
  isMultiValue?: boolean,
): string | undefined {
  const { nameGenerator, idPrefix } = globalFormOptions;
  if (!nameGenerator || fieldPath === ROOT_FIELD_PATH) {
    return undefined;
  }
  return nameGenerator(fieldPathToList(fieldPath), idPrefix, isMultiValue);
}
