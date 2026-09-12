import {
  DEFAULT_ID_PREFIX,
  DEFAULT_ID_SEPARATOR,
  ROOT_FIELD_PATH,
  fieldPathToId,
  fieldPathToList,
  fieldPathToName,
  fieldPathEndsWithIndex,
  toFieldPath,
} from '../src/index.ts';
import type { FieldPath } from '../src/index.ts';

/** The grammar tests exercise the parser on raw literal paths, which is the one place a cast is legitimate */
function fp(path: string): FieldPath {
  return path as FieldPath;
}

const GLOBAL_FORM_OPTIONS = {
  idPrefix: DEFAULT_ID_PREFIX,
  idSeparator: DEFAULT_ID_SEPARATOR,
};

describe('toFieldPath()', () => {
  test('no parent, string segment', () => {
    expect(toFieldPath('one')).toEqual('one');
  });
  test('no parent, number segment', () => {
    expect(toFieldPath(1)).toEqual('[1]');
  });
  test('an empty segment names no field, so the parent is returned unchanged', () => {
    expect(toFieldPath('')).toEqual(ROOT_FIELD_PATH);
    expect(toFieldPath('', fp('one'))).toEqual('one');
  });
  test('appends a property name to a parent', () => {
    expect(toFieldPath('two', toFieldPath('one'))).toEqual('one.two');
  });
  test('appends an array index to a parent', () => {
    expect(toFieldPath(1, toFieldPath('one'))).toEqual('one[1]');
  });
  test('escapes reserved characters in a property name', () => {
    expect(toFieldPath('a.b', fp('one'))).toEqual('one.a\\.b');
    expect(toFieldPath('a[0]', fp('one'))).toEqual('one.a\\[0\\]');
    expect(toFieldPath('a\\b', fp('one'))).toEqual('one.a\\\\b');
  });
});

describe('fieldPathToList()', () => {
  test('the root path has no segments', () => {
    expect(fieldPathToList(ROOT_FIELD_PATH)).toEqual([]);
  });
  test('array indexes come back as numbers, property names as strings', () => {
    expect(fieldPathToList(fp('tasks[0].title'))).toEqual(['tasks', 0, 'title']);
  });
  test('a numeric property name stays a string', () => {
    expect(fieldPathToList(toFieldPath('0', fp('a')))).toEqual(['a', '0']);
  });
  test('round-trips property names containing reserved characters', () => {
    const tricky = ['a.b', 'c[0]', 'd\\e', '[1]'];
    const path = tricky.reduce<FieldPath>((acc, segment) => toFieldPath(segment, acc), ROOT_FIELD_PATH);
    expect(fieldPathToList(path)).toEqual(tricky);
  });
  test('a trailing escape character is dropped rather than producing a stray segment', () => {
    expect(fieldPathToList(fp('a\\'))).toEqual(['a']);
  });
  test('an unclosed bracket is read as a property name instead of looping', () => {
    expect(fieldPathToList('a[unclosed' as FieldPath)).toEqual(['a', 'unclosed']);
    expect(fieldPathToList('a[' as FieldPath)).toEqual(['a']);
  });
  test('handles adjacent array indexes', () => {
    const path = toFieldPath(1, toFieldPath(0, fp('matrix')));
    expect(path).toEqual('matrix[0][1]');
    expect(fieldPathToList(path)).toEqual(['matrix', 0, 1]);
  });
});

describe('fieldPathToId()', () => {
  test('the root path is the idPrefix', () => {
    expect(fieldPathToId(ROOT_FIELD_PATH, GLOBAL_FORM_OPTIONS)).toEqual(DEFAULT_ID_PREFIX);
  });
  test('joins the segments with the idSeparator', () => {
    expect(fieldPathToId(fp('tasks[0].title'), GLOBAL_FORM_OPTIONS)).toEqual(
      `${DEFAULT_ID_PREFIX}${DEFAULT_ID_SEPARATOR}tasks${DEFAULT_ID_SEPARATOR}0${DEFAULT_ID_SEPARATOR}title`,
    );
  });
  test('is a plain string, so equal paths produce equal ids', () => {
    expect(fieldPathToId(fp('a.b'), GLOBAL_FORM_OPTIONS)).toBe(
      fieldPathToId(toFieldPath('b', fp('a')), GLOBAL_FORM_OPTIONS),
    );
  });
});

describe('fieldPathToName()', () => {
  const phpNameGenerator = (path: (string | number)[], idPrefix: string, isMultiValue?: boolean) => {
    if (path.length === 0) {
      return idPrefix;
    }
    const name = `${idPrefix}${path.map((segment) => `[${segment}]`).join('')}`;
    return isMultiValue ? `${name}[]` : name;
  };
  const OPTIONS_WITH_NAME_GENERATOR = { ...GLOBAL_FORM_OPTIONS, nameGenerator: phpNameGenerator };

  test('undefined when no nameGenerator is configured', () => {
    expect(fieldPathToName(fp('firstName'), GLOBAL_FORM_OPTIONS)).toBeUndefined();
  });
  test('undefined for the root path', () => {
    expect(fieldPathToName(ROOT_FIELD_PATH, OPTIONS_WITH_NAME_GENERATOR)).toBeUndefined();
  });
  test('generates a name for a nested path', () => {
    expect(fieldPathToName(fp('tasks[0].title'), OPTIONS_WITH_NAME_GENERATOR)).toEqual('root[tasks][0][title]');
  });
  test('the isMultiValue flag is passed through', () => {
    expect(fieldPathToName(fp('hobbies'), OPTIONS_WITH_NAME_GENERATOR, true)).toEqual('root[hobbies][]');
    expect(fieldPathToName(fp('hobbies'), OPTIONS_WITH_NAME_GENERATOR, false)).toEqual('root[hobbies]');
  });
});

describe('fieldPathToId() matches the segment-list derivation', () => {
  test.each([
    ROOT_FIELD_PATH,
    toFieldPath('one'),
    toFieldPath(0, toFieldPath('tasks')),
    toFieldPath('title', toFieldPath(0, toFieldPath('tasks'))),
    toFieldPath(1, toFieldPath(0, toFieldPath('matrix'))),
    toFieldPath('a.b', toFieldPath('one')),
    toFieldPath('a[0]', toFieldPath('one')),
    toFieldPath('a\\b', toFieldPath('one')),
    toFieldPath(2),
  ])('single-pass id for %j equals joining the parsed segments', (path) => {
    const expected = [GLOBAL_FORM_OPTIONS.idPrefix, ...fieldPathToList(path)].join(GLOBAL_FORM_OPTIONS.idSeparator);
    expect(fieldPathToId(path, GLOBAL_FORM_OPTIONS)).toEqual(expected);
  });
  test('a trailing escape character is dropped, matching the parser', () => {
    expect(fieldPathToId(fp('a\\'), GLOBAL_FORM_OPTIONS)).toEqual(
      [GLOBAL_FORM_OPTIONS.idPrefix, ...fieldPathToList(fp('a\\'))].join(GLOBAL_FORM_OPTIONS.idSeparator),
    );
  });
});

describe('fieldPathEndsWithIndex()', () => {
  test('true for a path addressing an array element', () => {
    expect(fieldPathEndsWithIndex(toFieldPath(0, toFieldPath('tasks')))).toBe(true);
    expect(fieldPathEndsWithIndex(toFieldPath(12))).toBe(true);
  });
  test('false for a property path, the root, and a numeric object key', () => {
    expect(fieldPathEndsWithIndex(toFieldPath('title'))).toBe(false);
    expect(fieldPathEndsWithIndex(ROOT_FIELD_PATH)).toBe(false);
    expect(fieldPathEndsWithIndex(toFieldPath('0', toFieldPath('a')))).toBe(false);
  });
  test('false for a property name that merely ends with an escaped bracket', () => {
    expect(fieldPathEndsWithIndex(toFieldPath('a[0]', toFieldPath('one')))).toBe(false);
  });
});
