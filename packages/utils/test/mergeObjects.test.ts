import { mergeObjects } from '../src';

describe('mergeObjects()', () => {
  it('shouldn`t mutate the provided objects', () => {
    const obj1 = { a: 1 };
    mergeObjects(obj1, { b: 2 });
    expect(obj1).toEqual({ a: 1 });
  });

  it('should merge two one-level deep objects', () => {
    expect(mergeObjects({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it('should override the first object with the values from the second', () => {
    expect(mergeObjects({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });

  it('should override non-existing values of the first object with the values from the second', () => {
    expect(mergeObjects({ a: { b: undefined } }, { a: { b: { c: 1 } } })).toEqual({ a: { b: { c: 1 } } });
  });

  it('should recursively merge deeply nested objects', () => {
    const obj1 = {
      a: 1,
      b: {
        c: 3,
        d: [1, 2, 3],
        e: { f: { g: 1 } },
      },
      c: 2,
    };
    const obj2 = {
      a: 1,
      b: {
        d: [3, 2, 1],
        e: { f: { h: 2 } },
        g: 1,
      },
      c: 3,
    };
    const expected = {
      a: 1,
      b: {
        c: 3,
        d: [3, 2, 1],
        e: { f: { g: 1, h: 2 } },
        g: 1,
      },
      c: 3,
    };
    expect(mergeObjects(obj1, obj2)).toEqual(expected);
  });

  it('should recursively merge File objects', () => {
    const file = new File(['test'], 'test.txt');
    const obj1 = {
      a: {},
    };
    const obj2 = {
      a: file,
    };
    expect(mergeObjects(obj1, obj2).a).toBeInstanceOf(File);
  });

  describe('concatArrays option', () => {
    it('should not concat arrays by default', () => {
      const obj1 = { a: [1] };
      const obj2 = { a: [2] };

      expect(mergeObjects(obj1, obj2)).toEqual({ a: [2] });
    });

    it('should concat arrays when concatArrays is true', () => {
      const obj1 = { a: [1] };
      const obj2 = { a: [2] };

      expect(mergeObjects(obj1, obj2, true)).toEqual({ a: [1, 2] });
    });

    it('should concat nested arrays when concatArrays is true', () => {
      const obj1 = { a: { b: [1] } };
      const obj2 = { a: { b: [2] } };

      expect(mergeObjects(obj1, obj2, true)).toEqual({
        a: { b: [1, 2] },
      });
    });

    it("should not concat duplicate values in arrays when concatArrays is 'preventDuplicates'", () => {
      const obj1 = { a: [1] };
      const obj2 = { a: [1, 2] };

      expect(mergeObjects(obj1, obj2, 'preventDuplicates')).toEqual({
        a: [1, 2],
      });
    });

    it("should not concat duplicate values in nested arrays when concatArrays is 'preventDuplicates'", () => {
      const obj1 = { a: { b: [1] } };
      const obj2 = { a: { b: [1, 2] } };

      expect(mergeObjects(obj1, obj2, 'preventDuplicates')).toEqual({
        a: { b: [1, 2] },
      });
    });
  });
});
