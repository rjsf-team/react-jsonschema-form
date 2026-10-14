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
});
