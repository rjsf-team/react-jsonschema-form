import {
  DEFAULT_ID_PREFIX,
  DEFAULT_ID_SEPARATOR,
  ROOT_FIELD_PATH,
  fieldPathFromList,
  fieldPathToId,
  fieldPathToList,
  fieldPathToName,
  fieldPathEndsWithIndex,
  toFieldPath,
  deepEquals,
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
  test('an empty property name addresses a field, written as a lone `.` at the root', () => {
    expect(toFieldPath('')).toEqual('.');
    expect(toFieldPath('', fp('one'))).toEqual('one.');
    expect(toFieldPath('a', toFieldPath(''))).toEqual('..a');
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
  test('round-trips an empty property name below the root', () => {
    expect(fieldPathToList(fp('a.'))).toEqual(['a', '']);
    expect(fieldPathToList(fp('a..b'))).toEqual(['a', '', 'b']);
    expect(fieldPathToList(fp('a[0].'))).toEqual(['a', 0, '']);
  });
});

describe('the FieldPath encoding round-trips', () => {
  // Every segment shape that interacts with the grammar: the reserved characters on their own and embedded, an empty
  // name, a numeric-looking name that must stay a string, and a real array index
  const SEGMENTS: (string | number)[] = ['a', '', '.', '[', ']', '\\', 'a.b', 'a[0]', 'a\\b', '0', 0];

  /** Every list of `length` segments drawn from `SEGMENTS`, which is small enough to enumerate exhaustively */
  function listsOfLength(length: number): (string | number)[][] {
    if (length === 0) {
      return [[]];
    }
    return listsOfLength(length - 1).flatMap((rest) => SEGMENTS.map((segment) => [segment, ...rest]));
  }

  const lists = [1, 2, 3].flatMap(listsOfLength);

  test('every list enumerated here is round-tripped, so the cases below are not the only coverage', () => {
    expect(lists).toHaveLength(SEGMENTS.length + SEGMENTS.length ** 2 + SEGMENTS.length ** 3);
  });

  test('every list parses back to itself', () => {
    const broken = lists
      .filter((list) => !deepEquals(fieldPathToList(fieldPathFromList(list)), list))
      .map((list) => ({ list, path: fieldPathFromList(list), parsed: fieldPathToList(fieldPathFromList(list)) }));

    expect(broken).toEqual([]);
  });

  test('a leading empty name is not the root', () => {
    expect(fieldPathFromList([''])).not.toEqual(ROOT_FIELD_PATH);
    expect(fieldPathToList(fp('.'))).toEqual(['']);
    expect(fieldPathToList(fp('..a'))).toEqual(['', 'a']);
    expect(fieldPathToList(fp('.[0]'))).toEqual(['', 0]);
  });
});

describe('fieldPathFromList()', () => {
  test('the empty list is the root path', () => {
    expect(fieldPathFromList([])).toEqual(ROOT_FIELD_PATH);
  });
  test('round-trips every list fieldPathToList() can produce', () => {
    const lists = [
      ['tasks', 0, 'title'],
      ['a.b', 'c[0]', 'd\\e'],
      ['a', '', 'b'],
      ['matrix', 0, 1],
    ];
    lists.forEach((list) => expect(fieldPathToList(fieldPathFromList(list))).toEqual(list));
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
  test('writes no whitespace into the id, so it stays one id in a space-separated id list (#5558)', () => {
    const id = fieldPathToId(toFieldPath('Do you have any pets?', toFieldPath('petOwner')), GLOBAL_FORM_OPTIONS);
    expect(id).toBe('root_petOwner_Do-_20you-_20have-_20any-_20pets-_3F');
    expect(fieldPathToId(toFieldPath('a\tb\nc\fd\re'), GLOBAL_FORM_OPTIONS)).toBe('root_a-_09b-_0Ac-_0Cd-_0De');
    expect(fieldPathToId(toFieldPath('a\u00a0b\u3000c'), GLOBAL_FORM_OPTIONS)).toBe('root_a-_U00A0b-_U3000c');
  });
  test('writes every character a CSS identifier holds escaped as an escape, and the rest as it is', () => {
    const ids = ['a.b', 'a:b', 'a/b', 'a#b', 'a[0]', '100%', 'café', '名前', 'emoji😀'].map((name) =>
      fieldPathToId(toFieldPath(name), GLOBAL_FORM_OPTIONS),
    );
    expect(ids).toEqual([
      'root_a-_2Eb',
      'root_a-_3Ab',
      'root_a-_2Fb',
      'root_a-_23b',
      'root_a-_5B0-_5D',
      'root_100-_25',
      'root_café',
      'root_名前',
      'root_emoji😀',
    ]);
    for (const id of ids) {
      expect(id).toMatch(/^[A-Za-z0-9_\-\u0080-\uffff]+$/);
    }
  });
  test('writes camelCase, kebab-case and snake_case names as they are', () => {
    const ids = ['firstName', 'first-name', 'snake_case_name', 'a1-b2_c3'].map((name) =>
      fieldPathToId(toFieldPath(name), GLOBAL_FORM_OPTIONS),
    );
    expect(ids).toEqual(['root_firstName', 'root_first-name', 'root_snake_case_name', 'root_a1-b2_c3']);
  });
  test('writes different property names as different ids, the escape token included', () => {
    const names = ['a b', 'a-_20b', 'a_b', 'a-_5Fb', '', '-_FF', '_', '-', '-_', 'a-_b', 'a--b', 'a-'];
    const ids = names.map((name) => fieldPathToId(toFieldPath(name), GLOBAL_FORM_OPTIONS));
    expect(ids).toEqual([
      'root_a-_20b',
      'root_a--_5F20b',
      'root_a_b',
      'root_a--_5F5Fb',
      'root_-_FF',
      'root_--_5FFF',
      'root_-_5F',
      'root_-_2D',
      'root_--_5F',
      'root_a--_5Fb',
      'root_a--b',
      'root_a-_2D',
    ]);
    expect(new Set(ids).size).toBe(names.length);
  });
  test('writes no `__`, which joins a field id to the name of one of its parts', () => {
    expect(fieldPathToId(toFieldPath('_description', toFieldPath('a')), GLOBAL_FORM_OPTIONS)).toBe(
      'root_a_-_5Fdescription',
    );
    expect(fieldPathToId(toFieldPath('b', toFieldPath('a_')), GLOBAL_FORM_OPTIONS)).toBe('root_a-_5F_b');
    expect(fieldPathToId(toFieldPath('a__b'), GLOBAL_FORM_OPTIONS)).toBe('root_a-_5F-_5Fb');
    expect(fieldPathToId(toFieldPath('description', toFieldPath('')), GLOBAL_FORM_OPTIONS)).toBe(
      'root_-_FF_description',
    );
    expect(fieldPathToId(toFieldPath('_id'), GLOBAL_FORM_OPTIONS)).toBe('root_-_5Fid');
  });
  test('writes no `-_` but where an escape starts, a name ending in `-` before the separator included', () => {
    expect(fieldPathToId(toFieldPath('b', toFieldPath('a-')), GLOBAL_FORM_OPTIONS)).toBe('root_a-_2D_b');
    expect(fieldPathToId(toFieldPath('2D_b', toFieldPath('a')), GLOBAL_FORM_OPTIONS)).toBe('root_a_2D_b');
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
