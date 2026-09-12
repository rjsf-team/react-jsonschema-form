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
 * An empty `segment` names no field, so the parent path is returned unchanged.
 *
 * @param segment - The property name or array index of the field
 * @param [parentPath] - The optional `FieldPath` of the parent field
 * @returns - The `FieldPath` of the field
 */
export function toFieldPath(segment: string | number, parentPath: FieldPath = ROOT_FIELD_PATH): FieldPath {
  if (typeof segment === 'number') {
    return `${parentPath}[${segment}]` as FieldPath;
  }
  if (segment === '') {
    return parentPath;
  }
  const escaped = segment.replace(RESERVED, '\\$&');
  return (parentPath === ROOT_FIELD_PATH ? escaped : `${parentPath}.${escaped}`) as FieldPath;
}

/** Determines whether the last segment of `fieldPath` is an array index. In the `FieldPath` grammar only an
 * unescaped trailing `[n]` can be an array index — an escaped `]` inside a property name renders as `\]`, whose
 * preceding character is a backslash rather than a digit — so the test needs no parsing.
 *
 * @param fieldPath - The `FieldPath` to check
 * @returns - True when the path addresses an array element, otherwise false
 */
export function fieldPathEndsWithIndex(fieldPath: FieldPath): boolean {
  return /\[\d+\]$/.test(fieldPath);
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
      hasName = false;
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

/** Derives the HTML `id` for `fieldPath` from the `idPrefix` and `idSeparator` in `globalFormOptions`
 *
 * @param fieldPath - The `FieldPath` of the field
 * @param globalFormOptions - The `GlobalFormOptions` used to get the `idPrefix` and `idSeparator`
 * @returns - The id for the field
 */
export function fieldPathToId(fieldPath: FieldPath, globalFormOptions: GlobalFormOptions): string {
  const { idPrefix, idSeparator } = globalFormOptions;
  // Single pass over the path, mirroring `[idPrefix, ...fieldPathToList(fieldPath)].join(idSeparator)` without
  // building the intermediate segment list; ids are derived per field per render, so this is a hot path
  let id = idPrefix;
  let pendingSeparator = fieldPath !== ROOT_FIELD_PATH;
  let i = 0;
  while (i < fieldPath.length) {
    const char = fieldPath[i];
    if (char === '.' || char === '[' || char === ']') {
      // `].` and `][` boundaries collapse into one separator via the lazy emit below
      pendingSeparator = true;
      i += 1;
    } else {
      if (pendingSeparator) {
        id += idSeparator;
        pendingSeparator = false;
      }
      if (char === '\\') {
        id += fieldPath[i + 1] ?? '';
        i += 2;
      } else {
        id += char;
        i += 1;
      }
    }
  }
  return id;
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
