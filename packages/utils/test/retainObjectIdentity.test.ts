import { retainObjectIdentity } from '../src/index.ts';

describe('retainObjectIdentity()', () => {
  it('returns next for primitives and changed values', () => {
    expect(retainObjectIdentity(1, 2)).toBe(2);
    expect(retainObjectIdentity('a', 'b')).toBe('b');
    expect(retainObjectIdentity(undefined, 'b')).toBe('b');
    expect(retainObjectIdentity({ a: 1 }, undefined)).toBeUndefined();
  });

  it('returns next when the values are already the same reference', () => {
    const value = { a: 1 };
    expect(retainObjectIdentity(value, value)).toBe(value);
  });

  it('returns prev when a rebuilt object is deeply equal', () => {
    const prev = { a: 1, b: { c: [1, 2] } };
    const next = structuredClone(prev);
    expect(retainObjectIdentity(prev, next)).toBe(prev);
  });

  it('retains unchanged sibling subtrees when one branch changes', () => {
    const prev = { changed: { value: 1 }, sibling: { value: 2 }, list: [{ x: 1 }, { x: 2 }] };
    const next = structuredClone(prev);
    next.changed.value = 99;
    const result = retainObjectIdentity(prev, next);
    expect(result).not.toBe(prev);
    expect(result.changed).toEqual({ value: 99 });
    expect(result.sibling).toBe(prev.sibling);
    expect(result.list).toBe(prev.list);
  });

  it('retains unchanged array items when one item changes', () => {
    const prev = [{ x: 1 }, { x: 2 }, { x: 3 }];
    const next = structuredClone(prev);
    next[1].x = 99;
    const result = retainObjectIdentity(prev, next);
    expect(result).not.toBe(prev);
    expect(result[0]).toBe(prev[0]);
    expect(result[1]).toEqual({ x: 99 });
    expect(result[2]).toBe(prev[2]);
  });

  it('treats a length change as a changed array but still retains surviving items', () => {
    const prev = [{ x: 1 }, { x: 2 }];
    const next = [structuredClone(prev[0])];
    const result = retainObjectIdentity(prev, next);
    expect(result).not.toBe(prev);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(prev[0]);
  });

  it('does not treat a missing key as equal to an undefined value', () => {
    const prev = { a: 1 };
    const next = { a: 1, b: undefined };
    expect(retainObjectIdentity(prev, next)).not.toBe(prev);
  });

  it('treats an extra prev key as a change', () => {
    const prev = { a: 1, b: 2 };
    const next = { a: 1 };
    expect(retainObjectIdentity(prev, next)).not.toBe(prev);
  });

  it('returns next untouched when nothing could be retained', () => {
    const prev = { a: { x: 1 } };
    const next = { a: { x: 2 } };
    expect(retainObjectIdentity(prev, next)).toBe(next);
  });

  it('returns next untouched when a changed array has nothing to retain', () => {
    const prev = [{ x: 1 }];
    const next = [{ x: 2 }, { x: 3 }];
    expect(retainObjectIdentity(prev, next)).toBe(next);
  });

  it('retains an equal-valued Date instance', () => {
    const prev = new Date(1000);
    expect(retainObjectIdentity(prev, new Date(1000))).toBe(prev);
    expect(retainObjectIdentity(prev, new Date(2000))).toEqual(new Date(2000));
  });

  it('treats non-plain objects as opaque', () => {
    class Thing {
      x: number;
      constructor(x: number) {
        this.x = x;
      }
    }
    const prev = new Thing(1);
    const next = new Thing(1);
    expect(retainObjectIdentity(prev, next)).toBe(next);
  });

  it('does not mutate either argument when grafting', () => {
    const prev = { changed: { value: 1 }, sibling: { value: 2 } };
    const next = { changed: { value: 99 }, sibling: { value: 2 } };
    const nextSibling = next.sibling;
    const result = retainObjectIdentity(prev, next);
    expect(next.sibling).toBe(nextSibling);
    expect(result.sibling).toBe(prev.sibling);
  });

  it('does not retain across mismatched container types', () => {
    expect(retainObjectIdentity([1], { 0: 1 })).toEqual({ 0: 1 });
    expect(retainObjectIdentity({ 0: 1 }, [1])).toEqual([1]);
  });
});
