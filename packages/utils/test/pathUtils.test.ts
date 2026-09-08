import { getByPath, hasByPath, setByPath, toPath, unsetByPath } from '../src/index.ts';

describe('toPath()', () => {
  it('splits dotted paths', () => {
    expect(toPath('a.b.c')).toEqual(['a', 'b', 'c']);
  });
  it('splits bracketed array indexes', () => {
    expect(toPath('a[0].b')).toEqual(['a', '0', 'b']);
  });
  it('ignores a leading dot instead of producing an empty segment', () => {
    expect(toPath('.level1.level2[2].level3')).toEqual(['level1', 'level2', '2', 'level3']);
  });
  it('returns an empty array for an empty string or a bare dot', () => {
    expect(toPath('')).toEqual([]);
    expect(toPath('.')).toEqual([]);
  });
  it('splits array indexes written with dots', () => {
    expect(toPath('a.0.b')).toEqual(['a', '0', 'b']);
  });
  it('drops empty segments from trailing dots and doubled separators', () => {
    expect(toPath('a.')).toEqual(['a']);
    expect(toPath('a..b')).toEqual(['a', 'b']);
    expect(toPath('a[0][1]')).toEqual(['a', '0', '1']);
  });
});

describe('getByPath()', () => {
  const obj = { a: { b: 1, c: null }, list: [{ d: 2 }] };
  it('gets a value via an array path', () => {
    expect(getByPath(obj, ['a', 'b'])).toBe(1);
  });
  it('gets a value via an array path with numeric segments', () => {
    expect(getByPath(obj, ['list', 0, 'd'])).toBe(2);
  });
  it('treats a bare string as a single key, never as a dotted path', () => {
    expect(getByPath({ 'a.b': 3 }, 'a.b')).toBe(3);
    expect(getByPath(obj, 'a.b')).toBeUndefined();
    expect(getByPath({ 'ui:options': { label: false } }, 'ui:options')).toEqual({ label: false });
  });
  it('traverses dotted paths when combined with toPath()', () => {
    expect(getByPath(obj, toPath('a.b'))).toBe(1);
    expect(getByPath(obj, toPath('list[0].d'))).toBe(2);
  });
  it('returns the default only when the resolved value is undefined', () => {
    expect(getByPath(obj, ['a', 'x'], 'fallback')).toBe('fallback');
    expect(getByPath(obj, ['a', 'c'], 'fallback')).toBeNull();
  });
  it('returns the default for a nullish object', () => {
    expect(getByPath(null, 'a', 'fallback')).toBe('fallback');
    expect(getByPath(undefined, ['a', 'b'], 'fallback')).toBe('fallback');
  });
  it('returns the default for an empty path instead of the object itself', () => {
    expect(getByPath(obj, [], 'fallback')).toBe('fallback');
    expect(getByPath(obj, toPath(''))).toBeUndefined();
    expect(hasByPath(obj, [])).toBe(false);
  });
  it('reads own properties only, so inherited members and prototype internals never resolve', () => {
    expect(getByPath({}, ['__proto__'], 'fallback')).toBe('fallback');
    expect(getByPath({}, 'constructor', 'fallback')).toBe('fallback');
    expect(getByPath({ constructor: 'own' }, 'constructor')).toBe('own');
    expect(getByPath({}, 'toString', 'fallback')).toBe('fallback');
    expect(getByPath(Object.create({ x: 1 }), 'x', 'fallback')).toBe('fallback');
  });
  it('agrees with hasByPath, so the two work as a guard/read pair', () => {
    const cases: [object, string][] = [
      [{ a: 1 }, 'a'],
      [{}, 'toString'],
      [Object.create({ x: 1 }), 'x'],
      [{}, 'constructor'],
    ];
    cases.forEach(([obj, key]) => {
      expect(hasByPath(obj, key)).toBe(getByPath(obj, key) !== undefined);
    });
  });
});

describe('setByPath()', () => {
  it('sets a nested value via an array path, creating objects', () => {
    const obj = {};
    expect(setByPath(obj, ['a', 'b'], 1)).toBe(obj);
    expect(obj).toEqual({ a: { b: 1 } });
  });
  it('creates arrays for numeric path segments', () => {
    expect(setByPath({}, ['a', 0, 'b'], 1)).toEqual({ a: [{ b: 1 }] });
    expect(setByPath({}, ['a', '0', 'b'], 1)).toEqual({ a: [{ b: 1 }] });
    const withArray = setByPath({}, ['a', '1'], 'x') as { a: unknown[] };
    expect(Array.isArray(withArray.a)).toBe(true);
  });
  it('creates plain objects even for numeric segments when createIntermediateObjects is true', () => {
    expect(setByPath({}, ['a', 0, 'b'], 1, true)).toEqual({ a: { 0: { b: 1 } } });
  });
  it('preserves existing sibling values', () => {
    const obj = { a: { b: 1 }, keep: true };
    setByPath(obj, ['a', 'c'], 2);
    expect(obj).toEqual({ a: { b: 1, c: 2 }, keep: true });
  });
  it('assigns undefined while keeping the key present', () => {
    const obj: { a?: { b?: number } } = { a: { b: 1 } };
    setByPath(obj, ['a', 'b'], undefined);
    expect(obj.a && 'b' in obj.a).toBe(true);
    expect(obj.a!.b).toBeUndefined();
  });
  it('treats a bare string as a single key, never as a dotted path', () => {
    expect(setByPath({}, 'ui:readonly', true)).toEqual({ 'ui:readonly': true });
    expect(setByPath({}, 'a.b', 1)).toEqual({ 'a.b': 1 });
  });
  it('returns non-objects unchanged', () => {
    expect(setByPath(null, 'a', 1)).toBeNull();
    expect(setByPath('str', 'a', 1)).toBe('str');
  });
  it('sets properties on function targets', () => {
    const fn = (() => undefined) as { (): undefined; cached?: { value: number } };
    setByPath(fn, ['cached', 'value'], 1);
    expect(fn.cached).toEqual({ value: 1 });
  });
  it('sets into existing function intermediates instead of replacing them', () => {
    const inner = (() => undefined) as { (): undefined; flag?: boolean };
    const obj = { fn: inner };
    setByPath(obj, ['fn', 'flag'], true);
    expect(obj.fn).toBe(inner);
    expect(inner.flag).toBe(true);
  });
  it('refuses a __proto__ segment in any position to prevent prototype pollution', () => {
    const target = {};
    expect(setByPath(target, ['__proto__', 'polluted'], 'x')).toBe(target);
    expect(({} as { polluted?: string }).polluted).toBeUndefined();
    setByPath(target, '__proto__', { polluted2: 'x' });
    expect(({} as { polluted2?: string }).polluted2).toBeUndefined();
    expect(target).toEqual({});
  });
  it('writes constructor and prototype as own properties without reaching the prototype chain', () => {
    const target: Record<string, unknown> = {};
    setByPath(target, ['constructor', 'prototype', 'polluted'], 'x');
    expect(({} as { polluted?: string }).polluted).toBeUndefined();
    expect(target.constructor).toEqual({ prototype: { polluted: 'x' } });
    setByPath(target, 'prototype', 'y');
    expect(Object.hasOwn(target, 'prototype')).toBe(true);
    expect(target.prototype).toBe('y');
  });
  it('never traverses into an inherited member when creating intermediates', () => {
    const target: Record<string, unknown> = {};
    setByPath(target, ['toString', 'polluted'], 'x');
    expect(target.toString).toEqual({ polluted: 'x' });
    expect(Object.prototype.toString).toBeInstanceOf(Function);
  });
});

describe('unsetByPath() prototype safety', () => {
  it('cannot reach the prototype chain through a __proto__ segment', () => {
    const target = { keep: 1 };
    expect(unsetByPath(target, ['__proto__', 'toString'])).toBe(true);
    expect(Object.prototype.toString).toBeInstanceOf(Function);
    expect(unsetByPath(target, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
    expect(target).toEqual({ keep: 1 });
  });
});

describe('hasByPath()', () => {
  it('returns true for existing own nested paths', () => {
    expect(hasByPath({ a: { b: 1 } }, ['a', 'b'])).toBe(true);
    expect(hasByPath({ a: { b: undefined } }, ['a', 'b'])).toBe(true);
  });
  it('treats a bare string as a single key, never as a dotted path', () => {
    expect(hasByPath({ 'a.b': 1 }, 'a.b')).toBe(true);
    expect(hasByPath({ a: { b: 1 } }, 'a.b')).toBe(false);
    expect(hasByPath({ a: 1 }, 'a')).toBe(true);
  });
  it('returns false for missing paths and nullish objects', () => {
    expect(hasByPath({ a: 1 }, ['a', 'c'])).toBe(false);
    expect(hasByPath(null, 'a')).toBe(false);
    expect(hasByPath(undefined, ['a'])).toBe(false);
  });
  it('returns false for inherited properties', () => {
    expect(hasByPath(Object.create({ x: 1 }), 'x')).toBe(false);
  });
  it('supports array indexes', () => {
    expect(hasByPath({ list: [1, 2] }, ['list', 1])).toBe(true);
    expect(hasByPath({ list: [1, 2] }, ['list', 5])).toBe(false);
  });
});

describe('unsetByPath()', () => {
  it('removes a nested key and returns true', () => {
    const obj = { a: { b: 1, c: 2 } };
    expect(unsetByPath(obj, ['a', 'b'])).toBe(true);
    expect(obj).toEqual({ a: { c: 2 } });
  });
  it('removes a single key given as a bare string', () => {
    const obj: Record<string, number> = { 'a.b': 1 };
    unsetByPath(obj, 'a.b');
    expect('a.b' in obj).toBe(false);
  });
  it('returns true when the path does not exist', () => {
    expect(unsetByPath({}, ['a', 'b'])).toBe(true);
    expect(unsetByPath(null, 'a')).toBe(true);
  });
  it('leaves the object untouched for an empty path', () => {
    const obj = { a: 1 };
    expect(unsetByPath(obj, [])).toBe(true);
    expect(obj).toEqual({ a: 1 });
    expect(Object.keys(obj)).toEqual(['a']);
  });
  it('returns false instead of throwing when the property cannot be deleted', () => {
    expect(unsetByPath({ a: 'str' }, ['a', 'length'])).toBe(false);
    expect(unsetByPath({ a: [1] }, ['a', 'length'])).toBe(false);
  });
});
