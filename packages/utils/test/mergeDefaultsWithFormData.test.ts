import { mergeDefaultsWithFormData } from '../src/index.ts';

describe('mergeDefaultsWithFormData()', () => {
  it.each(['toString', 'constructor', 'valueOf', 'hasOwnProperty'])(
    'keeps form data under the inherited default name %s',
    (key) => {
      const formData = { [key]: 'user value' };
      expect(mergeDefaultsWithFormData<Record<string, unknown>>({ a: 1 }, formData, true, false, true)).toEqual({
        a: 1,
        [key]: 'user value',
      });
    },
  );

  it.each([false, true])('preserves a JSON __proto__ key with override=%s', (override) => {
    const formData = JSON.parse('{"__proto__":{"marker":1},"b":2}');
    const result = mergeDefaultsWithFormData({ a: 1 }, formData, false, false, override);
    expect(Object.hasOwn(result, '__proto__')).toBe(true);
    expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toEqual({ marker: 1 });
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(result.marker).toBeUndefined();
    expect(Object.getOwnPropertyDescriptor(formData, '__proto__')?.value).toEqual({ marker: 1 });
  });

  it('safely copies and merges an own __proto__ default', () => {
    const defaults = JSON.parse('{"__proto__":{"left":1}}');
    const formData = JSON.parse('{"__proto__":{"right":2}}');
    const result = mergeDefaultsWithFormData(defaults, formData);
    expect(Object.hasOwn(result, '__proto__')).toBe(true);
    expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toEqual({ left: 1, right: 2 });
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.getOwnPropertyDescriptor(defaults, '__proto__')?.value).toEqual({ left: 1 });
    const copied = mergeDefaultsWithFormData(defaults, {});
    expect(Object.hasOwn(copied, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(copied)).toBe(Object.prototype);
  });

  it('ignores inherited defaults but honors own prototype-named defaults', () => {
    const inherited = Object.create({ constructor: 'inherited' });
    expect(mergeDefaultsWithFormData(inherited, { constructor: 'user' }, false, false, true)).toEqual({
      constructor: 'user',
    });
    expect(mergeDefaultsWithFormData({ constructor: 'own' }, { constructor: 'user' }, false, false, true)).toEqual({
      constructor: 'own',
    });
  });

  it('preserves a nested __proto__ form value', () => {
    const formData = JSON.parse('{"nested":{"__proto__":{"marker":1}}}');
    const result = mergeDefaultsWithFormData({ nested: { d: { e: 1 } } }, formData);
    expect(Object.hasOwn(result?.nested, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(result?.nested)).toBe(Object.prototype);
  });

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

  it('should return formData when formData is undefined', () => {
    expect(mergeDefaultsWithFormData({}, undefined)).toEqual(undefined);
  });

  it('should return default when formData is undefined and defaultSupercedesUndefined true', () => {
    expect(mergeDefaultsWithFormData({}, undefined, undefined, true)).toEqual({});
  });

  it('should return default when formData is null and defaultSupercedesUndefined true', () => {
    expect(mergeDefaultsWithFormData({}, null, undefined, true)).toEqual({});
  });

  it('should return null if default is null and formData is undefined and defaultSupercedesUndefined is true', () => {
    const defaultValue = null;
    const formData = undefined;
    const defaultSupercedesUndefined = true;
    expect(mergeDefaultsWithFormData(defaultValue, formData, undefined, defaultSupercedesUndefined)).toBeNull();
  });

  it('should return undefined when formData is undefined', () => {
    expect(mergeDefaultsWithFormData(undefined, undefined)).toBeUndefined();
  });

  it('should return the formData object when defaults is undefined', () => {
    expect(mergeDefaultsWithFormData(undefined, { a: 1 })).toEqual({ a: 1 });
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

  it('should merge arrays using entries from second and extra from the first', () => {
    expect(mergeDefaultsWithFormData([1, 2, 3], [4, 5], true)).toEqual([4, 5, 3]);
  });

  it('should append extra array defaults under an object key, the same as at the root', () => {
    expect(mergeDefaultsWithFormData({ config: { tags: ['a', 'b'] } }, { config: { tags: ['x'] } }, true)).toEqual({
      config: { tags: ['x', 'b'] },
    });
    expect(mergeDefaultsWithFormData({ config: { tags: ['a', 'b'] } }, { config: { tags: ['x'] } })).toEqual({
      config: { tags: ['x'] },
    });
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

  it('should recursively merge deeply nested objects, including extra array data', () => {
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
        d: [3, 2, 3],
        e: { f: { g: 1, h: 2 } },
        g: 1,
        h: [{ i: 3 }, { i: 2 }],
      },
      c: 3,
    };
    expect(mergeDefaultsWithFormData<any>(obj1, obj2, true)).toEqual(expected);
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

  it('should merge quickly when the default for a key is a long string (e.g. data-url file value)', () => {
    const largeDefault = `data:application/octet-stream;base64,${'A'.repeat(200_000)}`;
    const formValue = 'data:application/octet-stream;base64,B';
    expect(mergeDefaultsWithFormData<{ file: string }>({ file: largeDefault }, { file: formValue })).toEqual({
      file: formValue,
    });
  });

  it('should not merge a scalar default into object formData as index keys', () => {
    expect(mergeDefaultsWithFormData<any>('x', { b: 2 })).toEqual({ b: 2 });
  });

  it('should not merge an array default into object formData as index keys', () => {
    expect(mergeDefaultsWithFormData<any>([1, 2], { b: 2 })).toEqual({ b: 2 });
  });

  it('should not merge a nested array default into nested object formData as index keys', () => {
    expect(mergeDefaultsWithFormData<any>({ a: [1, 2] }, { a: { x: 1 } })).toEqual({ a: { x: 1 } });
  });

  describe('test with overrideFormDataWithDefaults set to true', () => {
    it('should return data in formData when no defaults', () => {
      expect(mergeDefaultsWithFormData(undefined, [2], undefined, undefined, true)).toEqual([2]);
    });

    it('should return formData when formData is undefined', () => {
      expect(mergeDefaultsWithFormData({}, undefined, undefined, undefined, true)).toEqual(undefined);
    });

    it('should deeply merge and return formData when formData is undefined and defaultSupercedesUndefined false', () => {
      expect(
        mergeDefaultsWithFormData(
          {
            arrayWithDefaults: ['Hello World'],
            objectWidthDefaults: {
              nestedField: 'Hello World!',
            },
            stringField: 'Hello World!!',
          },
          {
            arrayWithDefaults: [null],
            objectWidthDefaults: {
              nestedField: undefined,
            },
            stringField: undefined,
            nonEmptyField: 'Hello World!!!',
          },
          undefined,
          undefined,
          true,
        ),
      ).toEqual({
        arrayWithDefaults: [null],
        objectWidthDefaults: {
          nestedField: undefined,
        },
        stringField: undefined,
        nonEmptyField: 'Hello World!!!',
      });
    });

    it('should return default when formData is undefined and defaultSupercedesUndefined true', () => {
      expect(mergeDefaultsWithFormData({}, undefined, undefined, true, true)).toEqual({});
    });

    it('should return default when formData is null and defaultSupercedesUndefined true', () => {
      expect(mergeDefaultsWithFormData({}, null, undefined, true, true)).toEqual({});
    });

    it('should merge two one-level deep objects', () => {
      expect(mergeDefaultsWithFormData({ a: 1 }, { b: 2 }, undefined, undefined, true)).toEqual({
        a: 1,
        b: 2,
      });
    });

    it('should override the first object with the values from the second', () => {
      expect(mergeDefaultsWithFormData({ a: 1 }, { a: 2 }, undefined, undefined, true)).toEqual({ a: 1 });
    });

    it('should override non-existing values of the first object with the values from the second', () => {
      expect(
        mergeDefaultsWithFormData({ a: { b: undefined } }, { a: { b: { c: 1 } } }, undefined, undefined, true),
      ).toEqual({
        a: { b: { c: 1 } },
      });
    });

    it('should merge arrays using entries from second', () => {
      expect(mergeDefaultsWithFormData([1, 2, 3], [4, 5], undefined, undefined, true)).toEqual([1, 2, 3]);
    });

    it('should merge arrays using entries from second and extra from the first', () => {
      expect(mergeDefaultsWithFormData([1, 2], [4, 5, 6], undefined, undefined, true)).toEqual([1, 2, 6]);
    });

    it('should deeply merge arrays with overlapping entries', () => {
      expect(mergeDefaultsWithFormData([{ a: 1 }], [{ b: 2 }, { c: 3 }], undefined, undefined, true)).toEqual([
        { a: 1, b: 2 },
        { c: 3 },
      ]);
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
          d: [1, 2, 3],
          e: { f: { g: 1, h: 2 } },
          g: 1,
          h: [{ i: 1 }, { i: 2 }],
        },
        c: 2,
      };
      expect(mergeDefaultsWithFormData<any>(obj1, obj2, undefined, undefined, true)).toEqual(expected);
    });

    it('should recursively merge deeply nested objects, including extra array data', () => {
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
          h: [{ i: 3 }, { i: 4 }, { i: 5 }],
        },
        c: 3,
        d: 4,
      };
      const expected = {
        a: 1,
        b: {
          c: 3,
          d: [1, 2, 3],
          e: { f: { g: 1, h: 2 } },
          g: 1,
          h: [{ i: 1 }, { i: 2 }, { i: 5 }],
        },
        c: 2,
        d: 4,
      };
      expect(mergeDefaultsWithFormData<any>(obj1, obj2, undefined, undefined, true)).toEqual(expected);
    });

    it('should deeply merge an array that sits under an object key', () => {
      const defaults = { outer: { rows: [{ name: 'Name', grade: 'A' }] } };
      const formData = { outer: { rows: [{ name: 'Name' }] } };
      expect(mergeDefaultsWithFormData<any>(defaults, formData, true, false, true)).toEqual({
        outer: { rows: [{ name: 'Name', grade: 'A' }] },
      });
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

    it.each([
      ['string', 'x'],
      ['array', [1, 2]],
      ['null', null],
      ['number', 5],
    ])('should keep object formData over a %s default', (_, defaults) => {
      expect(mergeDefaultsWithFormData<any>(defaults, { b: 2 }, true, false, true)).toEqual({ b: 2 });
    });

    it.each([
      ['null', { a: null }],
      ['number', { a: 5 }],
      ['array', { a: [1, 2] }],
    ])('should keep nested object formData over a nested %s default', (_, defaults) => {
      expect(mergeDefaultsWithFormData<any>(defaults, { a: { x: 1 } }, true, false, true)).toEqual({ a: { x: 1 } });
    });
  });
});
