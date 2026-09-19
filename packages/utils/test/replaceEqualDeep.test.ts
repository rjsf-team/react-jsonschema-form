import { createContext, forwardRef, memo, createElement } from 'react';

import { replaceEqualDeep } from '../src/index.ts';

describe('replaceEqualDeep()', () => {
  it('returns next for primitives and changed values', () => {
    expect(replaceEqualDeep(1, 2)).toBe(2);
    expect(replaceEqualDeep('a', 'b')).toBe('b');
    expect(replaceEqualDeep(undefined, 'b')).toBe('b');
    expect(replaceEqualDeep({ a: 1 }, undefined)).toBeUndefined();
  });

  it('returns next when the values are already the same reference', () => {
    const value = { a: 1 };
    expect(replaceEqualDeep(value, value)).toBe(value);
  });

  it('returns prev when a rebuilt object is deeply equal', () => {
    const prev = { a: 1, b: { c: [1, 2] } };
    const next = structuredClone(prev);
    expect(replaceEqualDeep(prev, next)).toBe(prev);
  });

  it('retains unchanged sibling subtrees when one branch changes', () => {
    const prev = { changed: { value: 1 }, sibling: { value: 2 }, list: [{ x: 1 }, { x: 2 }] };
    const next = structuredClone(prev);
    next.changed.value = 99;
    const result = replaceEqualDeep(prev, next);
    expect(result).not.toBe(prev);
    expect(result.changed).toEqual({ value: 99 });
    expect(result.sibling).toBe(prev.sibling);
    expect(result.list).toBe(prev.list);
  });

  it('retains unchanged array items when one item changes', () => {
    const prev = [{ x: 1 }, { x: 2 }, { x: 3 }];
    const next = structuredClone(prev);
    next[1].x = 99;
    const result = replaceEqualDeep(prev, next);
    expect(result).not.toBe(prev);
    expect(result[0]).toBe(prev[0]);
    expect(result[1]).toEqual({ x: 99 });
    expect(result[2]).toBe(prev[2]);
  });

  it('treats a length change as a changed array but still retains surviving items', () => {
    const prev = [{ x: 1 }, { x: 2 }];
    const next = [structuredClone(prev[0])];
    const result = replaceEqualDeep(prev, next);
    expect(result).not.toBe(prev);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(prev[0]);
  });

  it('does not treat a missing key as equal to an undefined value', () => {
    const prev = { a: 1 };
    const next = { a: 1, b: undefined };
    expect(replaceEqualDeep(prev, next)).not.toBe(prev);
  });

  it('treats an extra prev key as a change', () => {
    const prev = { a: 1, b: 2 };
    const next = { a: 1 };
    expect(replaceEqualDeep(prev, next)).not.toBe(prev);
  });

  it('returns next untouched when nothing could be retained', () => {
    const prev = { a: { x: 1 } };
    const next = { a: { x: 2 } };
    expect(replaceEqualDeep(prev, next)).toBe(next);
  });

  it('returns next untouched when a changed array has nothing to retain', () => {
    const prev = [{ x: 1 }];
    const next = [{ x: 2 }, { x: 3 }];
    expect(replaceEqualDeep(prev, next)).toBe(next);
  });

  it('retains a React element rebuilt with the same type, key and props, and drops one that changed', () => {
    const prev = createElement('span', { className: 'a' }, 'text');
    expect(replaceEqualDeep(prev, createElement('span', { className: 'a' }, 'text'))).toBe(prev);
    const changed = createElement('span', { className: 'b' }, 'text');
    expect(replaceEqualDeep(prev, changed)).toBe(changed);
    const otherType = createElement('b', { className: 'a' }, 'text');
    expect(replaceEqualDeep(prev, otherType)).toBe(otherType);
    const keyed = createElement('span', { key: 'k', className: 'a' }, 'text');
    expect(replaceEqualDeep(prev, keyed)).toBe(keyed);
  });

  it('retains an equal-valued Date instance', () => {
    const prev = new Date(1000);
    expect(replaceEqualDeep(prev, new Date(1000))).toBe(prev);
    expect(replaceEqualDeep(prev, new Date(2000))).toEqual(new Date(2000));
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
    expect(replaceEqualDeep(prev, next)).toBe(next);
  });

  it('does not mutate either argument when grafting', () => {
    const prev = { changed: { value: 1 }, sibling: { value: 2 } };
    const next = { changed: { value: 99 }, sibling: { value: 2 } };
    const nextSibling = next.sibling;
    const result = replaceEqualDeep(prev, next);
    expect(next.sibling).toBe(nextSibling);
    expect(result.sibling).toBe(prev.sibling);
  });

  it('keeps an own __proto__ key as data and preserves a null prototype when grafting', () => {
    const prev = JSON.parse('{"__proto__": {"polluted": true}, "changed": 1, "same": {"a": 1}}');
    const next = JSON.parse('{"__proto__": {"polluted": true}, "changed": 2, "same": {"a": 1}}');
    const result = replaceEqualDeep(prev, next);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.hasOwn(result, '__proto__')).toBe(true);
    expect(result.same).toBe(prev.same);

    const bare = Object.assign(Object.create(null), { changed: 1, same: { a: 1 } });
    const bareNext = Object.assign(Object.create(null), { changed: 2, same: { a: 1 } });
    const bareResult = replaceEqualDeep(bare, bareNext);
    expect(Object.getPrototypeOf(bareResult)).toBeNull();
    expect(bareResult.same).toBe(bare.same);
  });

  it('does not treat two different forwardRef components as the same one', () => {
    const first = forwardRef(() => null);
    const second = forwardRef(() => null);
    expect(replaceEqualDeep({ widget: first }, { widget: second }).widget).toBe(second);
  });

  it('does not treat two different memo components or contexts as the same one', () => {
    const first = memo(() => null);
    const second = memo(() => null);
    expect(replaceEqualDeep({ widget: first }, { widget: second }).widget).toBe(second);

    const firstContext = createContext('a');
    const secondContext = createContext('b');
    expect(replaceEqualDeep({ context: firstContext }, { context: secondContext }).context).toBe(secondContext);
  });

  it('walks out of a value that contains itself instead of overflowing the stack', () => {
    const prev: Record<string, unknown> = { name: 'x' };
    prev.self = prev;
    const next: Record<string, unknown> = { name: 'x' };
    next.self = next;
    expect(replaceEqualDeep(prev, next)).toBe(next);

    const prevList: unknown[] = ['x'];
    prevList.push(prevList);
    const nextList: unknown[] = ['x'];
    nextList.push(nextList);
    expect(replaceEqualDeep(prevList, nextList)).toBe(nextList);
  });

  it('retains a value reachable by more than one path', () => {
    const shared = { a: 1 };
    const prev = { first: shared, second: shared };
    const result = replaceEqualDeep(prev, { first: { a: 1 }, second: { a: 1 } });
    expect(result).toBe(prev);
  });

  it('does not retain a value whose symbol-keyed markers differ', () => {
    const marker = Symbol('marker');
    const prev = { type: 'string' };
    const next = { type: 'string', [marker]: true };
    expect(replaceEqualDeep(prev, next)).toBe(next);
    expect(replaceEqualDeep(next, prev)).toBe(prev);
    expect(replaceEqualDeep({ a: prev }, { a: next }).a).toBe(next);

    const other = Symbol('other');
    expect(replaceEqualDeep(next, { type: 'string', [other]: true })).not.toBe(next);
    expect(replaceEqualDeep(next, { type: 'string', [marker]: false })).not.toBe(next);
    expect(replaceEqualDeep(next, { type: 'string', [marker]: true })).toBe(next);
  });

  it('does not retain across mismatched container types', () => {
    expect(replaceEqualDeep([1], { 0: 1 })).toEqual({ 0: 1 });
    expect(replaceEqualDeep({ 0: 1 }, [1])).toEqual([1]);
  });
});
