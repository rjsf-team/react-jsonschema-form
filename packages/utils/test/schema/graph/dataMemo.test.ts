import DataMemo from '../../../src/schema/graph/dataMemo.ts';

describe('DataMemo', () => {
  it('keeps an entry for every missing value, null, boolean and constant it is given', () => {
    const none = Object.freeze({});
    const memo = new DataMemo<string>([none]);
    const values = [undefined, null, true, false, none];
    values.forEach((value, index) => memo.set(['k'], [value], `${index}`));
    expect(values.map((value) => memo.peek(['k'], [value]))).toEqual(['0', '1', '2', '3', '4']);
    expect(memo.peek(['other'], [undefined])).toBeUndefined();
  });
  it('keeps only the last string or number under the same keys', () => {
    const memo = new DataMemo<string>();
    memo.set(['k'], ['a', undefined], 'first');
    expect(memo.peek(['k'], ['a', undefined])).toBe('first');
    memo.set(['k'], [1, undefined], 'second');
    expect(memo.peek(['k'], ['a', undefined])).toBeUndefined();
    expect(memo.peek(['k'], [1, null])).toBeUndefined();
    expect(memo.peek(['k'], [1, undefined])).toBe('second');
  });
  it('keeps nothing for data holding an object, which a caller may mutate in place', () => {
    const memo = new DataMemo<string>();
    const data = { a: 1 };
    memo.set(['k'], [data], 'object');
    memo.set(['k'], ['a', [1]], 'array');
    expect(memo.peek(['k'], [data])).toBeUndefined();
    expect(memo.peek(['k'], ['a', [1]])).toBeUndefined();
  });
});
