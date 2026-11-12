import type { FieldPathList } from '@rjsf/utils';
import { fieldPathFromList } from '@rjsf/utils';

import { moveOfItems } from '../src/components/keyMove.ts';
import type { Origins, RecordedOrigin } from '../src/components/valueOrigins.ts';
import { alongOrigins, filterOrigins, movedOrigins, withOrigins } from '../src/components/valueOrigins.ts';

const at = fieldPathFromList;

function originsOf(...entries: [FieldPathList, RecordedOrigin][]): Origins {
  return new Map(entries.map(([path, origin]) => [at(path), origin]));
}

describe('withOrigins()', () => {
  it('drops the origin of each path that is gone, whichever it was', () => {
    const origins = originsOf([['a'], 'entered'], [['b'], 'seeded'], [['c'], 'seeded']);
    expect(withOrigins(origins, [at(['a']), at(['b'])])).toEqual(originsOf([['c'], 'seeded']));
  });

  it('records an entered path over the seeded origin it had, and one that had none', () => {
    const origins = originsOf([['a'], 'seeded']);
    expect(withOrigins(origins, [], [at(['a']), at(['b'])])).toEqual(originsOf([['a'], 'entered'], [['b'], 'entered']));
  });

  it('records a path that is both gone and entered as entered', () => {
    const origins = originsOf([['a'], 'seeded']);
    expect(withOrigins(origins, [at(['a'])], [at(['a'])])).toEqual(originsOf([['a'], 'entered']));
  });

  it('hands back the map itself when it records all of it already', () => {
    const origins = originsOf([['a'], 'entered'], [['b'], 'seeded']);
    expect(withOrigins(origins, [at(['a']), at(['c'])], [at(['a'])])).toBe(origins);
    expect(withOrigins(origins, [])).toBe(origins);
  });

  it('takes only the one origin from a gone path when told which', () => {
    const origins = originsOf([['a'], 'entered'], [['b'], 'seeded']);
    expect(withOrigins(origins, [at(['a']), at(['b'])], [], 'seeded')).toEqual(originsOf([['a'], 'entered']));
    expect(withOrigins(origins, [at(['a'])], [], 'seeded')).toBe(origins);
  });
});

describe('filterOrigins()', () => {
  it('keeps the origins the predicate takes', () => {
    const origins = originsOf([['a'], 'entered'], [['b'], 'seeded']);
    expect(filterOrigins(origins, (path) => path !== at(['a']))).toEqual(originsOf([['b'], 'seeded']));
  });

  it('hands back the map itself when the predicate takes every one', () => {
    const origins = originsOf([['a'], 'entered']);
    expect(filterOrigins(origins, () => true)).toBe(origins);
  });
});

describe('movedOrigins()', () => {
  const removingFirst = {
    container: at(['rows']),
    newKeyOf: moveOfItems((index) => (index === 0 ? undefined : index - 1)),
  };

  it('moves each origin with its key, and drops those under a key that went', () => {
    const origins = originsOf(
      [['rows', 0, 'name'], 'entered'],
      [['rows', 1, 'name'], 'seeded'],
      [['rows', 2], 'entered'],
      [['other'], 'seeded'],
    );
    expect(movedOrigins(origins, removingFirst)).toEqual(
      originsOf([['rows', 0, 'name'], 'seeded'], [['rows', 1], 'entered'], [['other'], 'seeded']),
    );
  });

  it('hands back the map itself with no move, and when it records the same after the move', () => {
    const origins = originsOf([['rows', 0], 'entered'], [['rows', 1], 'entered'], [['other'], 'seeded']);
    const swapping = { container: at(['rows']), newKeyOf: moveOfItems((index) => 1 - index) };
    expect(movedOrigins(origins, undefined)).toBe(origins);
    expect(movedOrigins(origins, swapping)).toBe(origins);
    expect(movedOrigins(origins, { container: at(['elsewhere']), newKeyOf: () => undefined })).toBe(origins);
  });

  it('records an entered value where it and a seeded one end at one path, whichever comes first', () => {
    const ontoB = { container: at([]), newKeyOf: () => 'b' };
    const entered = originsOf([['b'], 'entered']);
    expect(movedOrigins(originsOf([['a'], 'seeded'], [['b'], 'entered']), ontoB)).toEqual(entered);
    expect(movedOrigins(originsOf([['a'], 'entered'], [['b'], 'seeded']), ontoB)).toEqual(entered);
  });
});

describe('alongOrigins()', () => {
  it('gives every array and object holding a value its origin, the root included', () => {
    expect(alongOrigins(originsOf([['rows', 0, 'name'], 'seeded']))).toEqual(
      originsOf([['rows', 0, 'name'], 'seeded'], [['rows', 0], 'seeded'], [['rows'], 'seeded'], [[], 'seeded']),
    );
  });

  it('takes what holds an entered value for entered, whichever value is recorded first', () => {
    const expected = originsOf(
      [['rows', 0], 'seeded'],
      [['rows', 1], 'entered'],
      [['rows', 2], 'seeded'],
      [['rows'], 'entered'],
      [[], 'entered'],
    );
    const seededFirst = originsOf([['rows', 0], 'seeded'], [['rows', 1], 'entered'], [['rows', 2], 'seeded']);
    const enteredFirst = originsOf([['rows', 1], 'entered'], [['rows', 0], 'seeded'], [['rows', 2], 'seeded']);
    expect(alongOrigins(seededFirst)).toEqual(expected);
    expect(alongOrigins(enteredFirst)).toEqual(expected);
  });

  it('builds the paths along a map once', () => {
    const origins = originsOf([['a'], 'entered']);
    expect(alongOrigins(origins)).toBe(alongOrigins(origins));
  });
});
