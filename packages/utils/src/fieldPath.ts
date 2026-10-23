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

/** The ASCII characters a property name carries into an id as they are, which a CSS identifier holds unescaped */
const ID_SAFE = /^[A-Za-z0-9_-]$/;

/** The token that starts an escape: followed by the two uppercase hex digits of an ASCII character, or by `U` and the
 * four of a whitespace character past ASCII, which a CSS identifier can't hold either
 */
const ID_ESCAPE = '-_';

/** The escape an empty name is written as: no ASCII character has the code `FF`, so no character is written so */
const EMPTY_NAME = `${ID_ESCAPE}FF`;

/** Whether the character at `i` of `name` is written as an escape. Every ASCII character a CSS identifier can't hold
 * unescaped is, and of those it can hold:
 * - a `_` that begins or ends the name, or stands next to another `_`, since the `_` separator beside it would write
 *   the `__` that joins a field's id to the name of one of its parts;
 * - a `_` after a `-`, and a `-` that ends the name, since either would write the `-_` that starts an escape, the
 *   second with the `_` separator after it.
 * A character past ASCII is written as it is, as a CSS identifier holds it, unless it is whitespace
 */
function isEscaped(name: string, i: number) {
  const char = name[i];
  if (char.charCodeAt(0) > 0x7f) {
    return /\s/.test(char);
  }
  if (!ID_SAFE.test(char)) {
    return true;
  }
  const last = name.length - 1;
  if (char === '_') {
    return i === 0 || i === last || name[i - 1] === '_' || name[i + 1] === '_' || name[i - 1] === '-';
  }
  return char === '-' && i === last;
}

/** Writes a character as an escape: `-_` and the two uppercase hex digits of an ASCII code, such as `-_20` for a space,
 * or `-_U` and the four of any other, such as `-_U00A0` for a no-break space
 *
 * @param char - The character
 * @returns - Its escape
 */
function escapeIdChar(char: string) {
  const code = char.charCodeAt(0);
  const hex = code.toString(16).toUpperCase();
  return code > 0x7f ? `${ID_ESCAPE}U${hex.padStart(4, '0')}` : `${ID_ESCAPE}${hex.padStart(2, '0')}`;
}

/** Writes a property name as it appears in an id: a CSS identifier as it stands, so `#${id}` finds the element with no
 * escaping, that holds no `__`, and that no other name writes. A character `isEscaped()` picks out is written as
 * `escapeIdChar()` writes it, and an empty name as `-_FF`. The encoder writes `-_` nowhere else, so every `-_` starts
 * an escape whose length its first character gives, and the name can be read back from the id
 *
 * @param name - The property name
 * @returns - The name as it appears in an id
 */
function idSegment(name: string) {
  if (name === '') {
    return EMPTY_NAME;
  }
  let segment = '';
  for (let i = 0; i < name.length; i += 1) {
    const char = name[i];
    segment += isEscaped(name, i) ? escapeIdChar(char) : char;
  }
  return segment;
}

/** Derives the HTML `id` for `fieldPath` from the `idPrefix` and `idSeparator` in `globalFormOptions`, writing each
 * property name as `idSegment()` does. The `idPrefix` and `idSeparator` are written as given, so to keep the id a CSS
 * identifier holding no `__`, each should hold only letters, digits, `-` and `_`, with no `__` in either or where they
 * meet. A property name holding the `idSeparator` still writes the id a path of several names would, as the name
 * `a_b` and the path `a.b` both write `root_a_b`, which choosing a separator no property name holds avoids
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
