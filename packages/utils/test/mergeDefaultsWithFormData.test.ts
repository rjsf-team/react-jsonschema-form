import { mergeDefaultsWithFormData } from '../src';

describe('mergeDefaultsWithFormData()', () => {
  it('shouldn`t mutate the provided objects', () => {
    const obj1 = { a: 1 };
    mergeDefaultsWithFormData<any>(obj1, { b: 2 });
    expect(obj1).toEqual({ a: 1 });
  });

  it('shouldn`t mutate the provided arrays', () => {
    const array1 = [1];
    mergeDefaultsWithFormData(array1, [2]);
    expect(array1).toEqual([1]);
  });

  it('should return data in formData when no defaults', () => {
    expect(mergeDefaultsWithFormData(undefined, [2])).toEqual([2]);
  });

  it('should merge two one-level deep objects', () => {
    expect(mergeDefaultsWithFormData({ a: 1 }, { b: 2 })).toEqual({
      a: 1,
      b: 2,
    });
  });

  it('should override the first object with the values from the second', () => {
    expect(mergeDefaultsWithFormData({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });

  it('should override non-existing values of the first object with the values from the second', () => {
    expect(mergeDefaultsWithFormData({ a: { b: undefined } }, { a: { b: { c: 1 } } })).toEqual({ a: { b: { c: 1 } } });
  });

  it('should merge arrays using entries from second', () => {
    expect(mergeDefaultsWithFormData([1, 2, 3], [4, 5])).toEqual([4, 5]);
  });

  it('should deeply merge arrays with overlapping entries', () => {
    expect(mergeDefaultsWithFormData([{ a: 1 }], [{ b: 2 }, { c: 3 }])).toEqual([{ a: 1, b: 2 }, { c: 3 }]);
  });

  it('should recursively merge deeply nested objects', () => {
    const obj1 = {
      a: 1,
      b: {
        c: 3,
        d: [1, 2, 3],
        e: { f: { g: 1 } },
        h: [{ i: 1 }, { i: 2 }],
      },
      c: 2,
    };
    const obj2 = {
      a: 1,
      b: {
        d: [3],
        e: { f: { h: 2 } },
        g: 1,
        h: [{ i: 3 }],
      },
      c: 3,
    };
    const expected = {
      a: 1,
      b: {
        c: 3,
        d: [3],
        e: { f: { g: 1, h: 2 } },
        g: 1,
        h: [{ i: 3 }],
      },
      c: 3,
    };
    expect(mergeDefaultsWithFormData<any>(obj1, obj2)).toEqual(expected);
  });

  it('should recursively merge File objects', () => {
    const file = new File(['test'], 'test.txt');
    const obj1 = {
      a: {},
    };
    const obj2 = {
      a: file,
    };
    expect(mergeDefaultsWithFormData(obj1, obj2)?.a).toBeInstanceOf(File);
  });
});
