import KeyedMemo from '../../../src/schema/graph/keyedMemo.ts';

describe('KeyedMemo', () => {
  it('computes a value once per list of keys', () => {
    const memo = new KeyedMemo<number>();
    const data = { a: 1 };
    const compute = vi.fn(() => 1);
    expect(memo.get(['if', data, 3], compute)).toBe(1);
    expect(memo.get(['if', data, 3], compute)).toBe(1);
    expect(compute).toHaveBeenCalledTimes(1);
  });
  it('tells keys apart by identity, by value for primitives, and lists apart by length', () => {
    const memo = new KeyedMemo<string>();
    const validator = () => true;
    expect(memo.get([{ a: 1 }], () => 'first')).toBe('first');
    expect(memo.get([{ a: 1 }], () => 'equal but another object')).toBe('equal but another object');
    expect(memo.get([validator, undefined], () => 'function')).toBe('function');
    expect(memo.get([validator, undefined], () => 'again')).toBe('function');
    expect(memo.get([validator], () => 'shorter')).toBe('shorter');
    expect(memo.get([null, Number.NaN], () => 'primitives')).toBe('primitives');
    expect(memo.get([null, Number.NaN], () => 'again')).toBe('primitives');
  });
  it('stores an undefined value like any other', () => {
    const memo = new KeyedMemo<undefined>();
    const compute = vi.fn(() => undefined);
    memo.get(['k'], compute);
    memo.get(['k'], compute);
    expect(compute).toHaveBeenCalledTimes(1);
  });
  it('peeks at and sets a stored value', () => {
    const memo = new KeyedMemo<string>();
    expect(memo.peek(['k'])).toBeUndefined();
    memo.set(['k'], 'v');
    expect(memo.peek(['k'])).toBe('v');
    expect(memo.get(['k'], () => 'computed')).toBe('v');
  });
  it('keeps the value for the last data stored under the keys, compared by identity', () => {
    const memo = new KeyedMemo<string>();
    expect(memo.peekLatest(['k'], [undefined])).toBeUndefined();
    memo.setLatest(['k'], [undefined, 'a'], 'first');
    expect(memo.peekLatest(['k'], [undefined, 'a'])).toBe('first');
    expect(memo.peekLatest(['k'], [undefined, 'b'])).toBeUndefined();
    memo.setLatest(['k'], [null, Number.NaN], 'second');
    expect(memo.peekLatest(['k'], [null, Number.NaN])).toBe('second');
    expect(memo.peekLatest(['k'], [undefined, 'a'])).toBeUndefined();
    expect(memo.peekLatest(['other'], [null, Number.NaN])).toBeUndefined();
  });
  it('peeks at the value stored for any data before the one stored for the last data', () => {
    const memo = new KeyedMemo<string>();
    expect(memo.peekAny(['k', 'deeper'], ['a'])).toBeUndefined();
    memo.setLatest(['k'], ['a'], 'latest');
    expect(memo.peekAny(['k'], ['a'])).toBe('latest');
    expect(memo.peekAny(['k'], ['b'])).toBeUndefined();
    memo.set(['k'], 'any');
    expect(memo.peekAny(['k'], ['b'])).toBe('any');
  });
  it('stores nothing for data holding an object, which a caller may mutate in place', () => {
    const memo = new KeyedMemo<string>();
    const data = { a: 1 };
    memo.setLatest(['k'], ['x', 1], 'kept');
    memo.setLatest(['k'], ['x', data], 'object');
    memo.setLatest(['k'], ['x', [1]], 'array');
    expect(memo.peekLatest(['k'], ['x', data])).toBeUndefined();
    expect(memo.peekLatest(['k'], ['x', 1])).toBe('kept');
  });
});
